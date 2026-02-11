// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingProtocol is Ownable, Pausable, ReentrancyGuard {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    struct Pool {
        uint256 apyRate;      // e.g., 10 for 10%
        uint256 lockDuration; // in seconds
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

    Pool[] public pools;
    mapping(uint256 => Position) public positions;
    uint256 public positionCounter;

    uint256 public constant SECONDS_IN_YEAR = 31536000;
    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 10; // 10%

    event PoolCreated(uint256 indexed poolId, uint256 apy, uint256 lockDuration, bool isFlexible);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount, uint256 positionId);
    event Withdrawn(address indexed user, uint256 amount, uint256 reward);

    constructor(IERC20 _stakingToken, IERC20 _rewardToken) Ownable(msg.sender) {
    require(address(_stakingToken) != address(0), "Invalid staking token");
    require(address(_rewardToken) != address(0), "Invalid reward token");
    stakingToken = _stakingToken;
    rewardToken = _rewardToken;
}

    // --- Owner Functions ---
    function createPool(uint256 _apyRate, uint256 _lockDuration, bool _isFlexible) external onlyOwner {
        pools.push(Pool({
            apyRate: _apyRate,
            lockDuration: _isFlexible ? 0 : _lockDuration,
            isFlexible: _isFlexible,
            totalStaked: 0
        }));
        emit PoolCreated(pools.length - 1, _apyRate, _lockDuration, _isFlexible);
    }

    // --- User Functions ---
    function stake(uint256 _poolId, uint256 _amount) external whenNotPaused nonReentrant {
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

        pools[_poolId].totalStaked += _amount;
        emit Staked(msg.sender, _poolId, _amount, positionCounter);
        positionCounter++;
    }

    function claimRewards(uint256 _positionId) public whenNotPaused nonReentrant {
        Position storage pos = positions[_positionId];
        require(pos.isActive, "Position not active");
        require(pos.holder == msg.sender, "Not your position");

        uint256 rewards = calculateRewards(_positionId);
        if (rewards > 0) {
            pos.lastRewardClaimTime = block.timestamp;
            rewardToken.transfer(msg.sender, rewards);
        }
    }

    function unstake(uint256 _positionId) external whenNotPaused nonReentrant {
        Position storage pos = positions[_positionId];
        Pool storage pool = pools[pos.poolId];
        
        require(pos.isActive, "Position not active");
        require(pos.holder == msg.sender, "Not your position");
        require(pool.isFlexible || block.timestamp >= pos.startTime + pool.lockDuration, "Lock period not over");

        uint256 rewards = calculateRewards(_positionId);
        uint256 principal = pos.amount;

        pos.isActive = false;
        pool.totalStaked -= principal;

        stakingToken.transfer(msg.sender, principal);
        if (rewards > 0) rewardToken.transfer(msg.sender, rewards);
    }

    function withdrawEarly(uint256 _positionId) external whenNotPaused nonReentrant {
        Position storage pos = positions[_positionId];
        Pool storage pool = pools[pos.poolId];

        require(pos.isActive, "Position not active");
        require(!pool.isFlexible, "Use unstake for flexible");
        require(block.timestamp < pos.startTime + pool.lockDuration, "Lock expired, use unstake");

        uint256 penalty = (pos.amount * EARLY_WITHDRAWAL_PENALTY) / 100;
        uint256 amountToUser = pos.amount - penalty;

        pos.isActive = false;
        pool.totalStaked -= pos.amount;

        stakingToken.transfer(msg.sender, amountToUser);
        stakingToken.transfer(owner(), penalty); // Penalty to treasury
        // Rewards are forfeited in early withdrawal
    }

    function emergencyWithdraw(uint256 _positionId) external nonReentrant {
        Position storage pos = positions[_positionId];
        require(pos.isActive, "Position not active");
        require(pos.holder == msg.sender, "Not your position");

        uint256 principal = pos.amount;
        pos.isActive = false;
        pools[pos.poolId].totalStaked -= principal;

        stakingToken.transfer(msg.sender, principal);
        // Rewards are forfeited
    }

    // --- View Functions ---
    function calculateRewards(uint256 _positionId) public view returns (uint256) {
        Position memory pos = positions[_positionId];
        Pool memory pool = pools[pos.poolId];
        
        uint256 timeElapsed = block.timestamp - pos.lastRewardClaimTime;
        return (pos.amount * pool.apyRate * timeElapsed) / (SECONDS_IN_YEAR * 100);
    }

    function getPendingRewards(uint256 _positionId) public view returns (uint256) {
        return calculateRewards(_positionId);
    }
}