// contracts/StakingProtocol.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StakingProtocol is Ownable, Pausable, ReentrancyGuard {
    // Structs for Pools and User Positions
    // ...

    constructor(IERC20 _stakingToken, IERC20 _rewardToken) {
        // ...
    }

    // --- Owner Functions ---
    function createPool(uint256 _apyRate, uint256 _lockDuration, bool _isFlexible) external onlyOwner {
        // ...
    }

    // --- User Functions ---
    function stake(uint256 _poolId, uint256 _amount) external whenNotPaused nonReentrant {
        // ...
    }

    function unstake(uint256 _positionId) external whenNotPaused nonReentrant {
        // ...
    }

    function claimRewards(uint256 _positionId) external whenNotPaused nonReentrant {
        // ...
    }

    function withdrawEarly(uint256 _positionId) external whenNotPaused nonReentrant {
        // ...
    }

    function emergencyWithdraw(uint256 _positionId) external nonReentrant {
        // ...
    }

    // --- View Functions ---
    function getPendingRewards(uint256 _positionId) public view returns (uint256) {
        // ...
    }
}
