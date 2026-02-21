// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingProtocol is Ownable, Pausable, ReentrancyGuard {

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public constant SECONDS_IN_YEAR = 31536000;
    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 10; // 10%

    struct Pool {
        uint256 apyRate;
        uint256 lockDuration;
        bool isFlexible;
        uint256 totalStaked;
    }

    struct Position {
        uint256 poolId;
        address holder;
        uint256 amount;
        uint256 startTime;
        uint256 lastRewardClaimTime;
        bool isActive;
    }

    Pool[] private pools;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) private userPositions;

    uint256 public positionCounter;
    uint256 public totalValueLocked;

    event PoolCreated(uint256 indexed poolId, uint256 apyRate, uint256 lockDuration, bool isFlexible);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 positionId);
    event RewardsClaimed(address indexed user, uint256 indexed positionId, uint256 reward);
    event Unstaked(address indexed user, uint256 indexed positionId, uint256 principal, uint256 reward);
    event EarlyWithdraw(address indexed user, uint256 indexed positionId, uint256 returnedAmount, uint256 penalty);
    event EmergencyWithdraw(address indexed user, uint256 indexed positionId, uint256 principal);

    constructor(IERC20 _stakingToken, IERC20 _rewardToken) Ownable(msg.sender) {
        require(address(_stakingToken) != address(0), "Invalid staking token");
        require(address(_rewardToken) != address(0), "Invalid reward token");
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
    }

    // ---------------- OWNER ----------------

    function createPool(
        uint256 _apyRate,
        uint256 _lockDuration,
        bool _isFlexible
    ) external onlyOwner {

        pools.push(
            Pool({
                apyRate: _apyRate,
                lockDuration: _isFlexible ? 0 : _lockDuration,
                isFlexible: _isFlexible,
                totalStaked: 0
            })
        );

        emit PoolCreated(pools.length - 1, _apyRate, _lockDuration, _isFlexible);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ---------------- USER ----------------

    function stake(uint256 _poolId, uint256 _amount)
        external
        whenNotPaused
        nonReentrant
    {
        require(_poolId < pools.length, "Invalid pool");
        require(_amount > 0, "Amount must be > 0");

        stakingToken.transferFrom(msg.sender, address(this), _amount);

        positions[positionCounter] = Position({
            poolId: _poolId,
            holder: msg.sender,
            amount: _amount,
            startTime: block.timestamp,
            lastRewardClaimTime: block.timestamp,
            isActive: true
        });

        userPositions[msg.sender].push(positionCounter);

        pools[_poolId].totalStaked += _amount;
        totalValueLocked += _amount;

        emit Staked(msg.sender, _poolId, _amount, positionCounter);
        positionCounter++;
    }

    function claimRewards(uint256 _positionId)
        external
        whenNotPaused
        nonReentrant
    {
        Position storage pos = positions[_positionId];

        require(pos.isActive, "Inactive position");
        require(pos.holder == msg.sender, "Not yours");

        uint256 rewards = _calculateRewards(_positionId);
        require(rewards > 0, "No rewards");

        pos.lastRewardClaimTime = block.timestamp;

        require(
            rewardToken.balanceOf(address(this)) >= rewards,
            "Insufficient reward balance"
        );

        rewardToken.transfer(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, _positionId, rewards);
    }

    function unstake(uint256 _positionId)
        external
        whenNotPaused
        nonReentrant
    {
        Position storage pos = positions[_positionId];
        require(pos.isActive, "Inactive");
        require(pos.holder == msg.sender, "Not yours");

        Pool storage pool = pools[pos.poolId];

        require(
            pool.isFlexible ||
            block.timestamp >= pos.startTime + pool.lockDuration,
            "Lock not expired"
        );

        uint256 rewards = _calculateRewards(_positionId);
        uint256 principal = pos.amount;

        pos.isActive = false;
        pools[pos.poolId].totalStaked -= principal;
        totalValueLocked -= principal;

        stakingToken.transfer(msg.sender, principal);

        if (rewards > 0) {
            rewardToken.transfer(msg.sender, rewards);
        }

        emit Unstaked(msg.sender, _positionId, principal, rewards);
    }

    function withdrawEarly(uint256 _positionId)
        external
        whenNotPaused
        nonReentrant
    {
        Position storage pos = positions[_positionId];
        require(pos.isActive, "Inactive");
        require(pos.holder == msg.sender, "Not yours");

        Pool storage pool = pools[pos.poolId];
        require(!pool.isFlexible, "Flexible pool");
        require(
            block.timestamp < pos.startTime + pool.lockDuration,
            "Lock expired"
        );

        uint256 penalty = (pos.amount * EARLY_WITHDRAWAL_PENALTY) / 100;
        uint256 amountToUser = pos.amount - penalty;

        pos.isActive = false;

        pools[pos.poolId].totalStaked -= pos.amount;
        totalValueLocked -= pos.amount;

        stakingToken.transfer(msg.sender, amountToUser);
        stakingToken.transfer(owner(), penalty);

        emit EarlyWithdraw(msg.sender, _positionId, amountToUser, penalty);
    }

    function emergencyWithdraw(uint256 _positionId)
        external
        nonReentrant
    {
        Position storage pos = positions[_positionId];

        require(pos.isActive, "Inactive");
        require(pos.holder == msg.sender, "Not yours");

        uint256 principal = pos.amount;

        pos.isActive = false;
        pools[pos.poolId].totalStaked -= principal;
        totalValueLocked -= principal;

        stakingToken.transfer(msg.sender, principal);

        emit EmergencyWithdraw(msg.sender, _positionId, principal);
    }

    // ---------------- VIEW ----------------

    function poolCount() external view returns (uint256) {
        return pools.length;
    }

    function getPoolInfo(uint256 _poolId)
        external
        view
        returns (Pool memory)
    {
        require(_poolId < pools.length, "Invalid pool");
        return pools[_poolId];
    }

    function getUserPositions(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userPositions[_user];
    }

    function getPendingRewards(uint256 _positionId)
        external
        view
        returns (uint256)
    {
        Position memory pos = positions[_positionId];
        if (!pos.isActive) return 0;
        return _calculateRewards(_positionId);
    }

    function _calculateRewards(uint256 _positionId)
        internal
        view
        returns (uint256)
    {
        Position memory pos = positions[_positionId];
        Pool memory pool = pools[pos.poolId];

        uint256 timeElapsed =
            block.timestamp - pos.lastRewardClaimTime;

        return (pos.amount * pool.apyRate * timeElapsed)
            / (SECONDS_IN_YEAR * 100);
    }
}