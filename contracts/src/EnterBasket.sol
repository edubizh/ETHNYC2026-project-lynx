// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {ERC1155Holder} from "openzeppelin-contracts/contracts/token/ERC1155/utils/ERC1155Holder.sol";

interface IERC20 {
    function approve(address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
}

interface IERC1155 {
    function safeTransferFrom(address, address, uint256, uint256, bytes calldata) external;
    function balanceOf(address, uint256) external view returns (uint256);
}

interface INegRiskAdapter {
    // The adapter pulls USDC.e (col()) from msg.sender, wraps it to wcol, splits via CTF, and
    // safeBatchTransferFroms the NEUTRAL YES+NO set back to msg.sender (verified on-chain + source).
    function splitPosition(bytes32 conditionId, uint256 amount) external;
    // Position ids derive from the QUESTION id (NOT collateral + collectionId).
    function getPositionId(bytes32 questionId, bool outcome) external view returns (uint256);
    // True once a market is resolved/determined — used to fail fast.
    function getDetermined(bytes32 marketId) external view returns (bool);
    // The conditionId a questionId belongs to — used to reject mismatched (conditionId, questionId) pairs.
    function getConditionId(bytes32 questionId) external view returns (bytes32);
}

/// @title EnterBasket
/// @notice Non-custodial executor for Project-Lynx. Splits USDC.e into a Polymarket NegRisk
///         neutral YES+NO set and forwards BOTH outcome tokens to an explicit `recipient` EOA.
///         Inherits ERC1155Holder so it can RECEIVE the ERC-1155 set the adapter mints to it
///         (without this, NegRiskAdapter.splitPosition's safeBatchTransferFrom would revert).
contract EnterBasket is ReentrancyGuard, ERC1155Holder {
    IERC20 public immutable usdce; // USDC.e collateral
    INegRiskAdapter public immutable adapter; // Polymarket NegRiskAdapter
    IERC1155 public immutable ctf; // ConditionalTokens (ERC1155 outcome tokens)

    event PredictionLegEntered(address indexed recipient, bytes32 indexed questionId, uint256 amount);
    event PredictionLegRefunded(address indexed recipient, bytes32 indexed questionId, uint256 amount);
    event AssetLegEntered(address indexed recipient, address indexed assetOut, uint256 amountIn, uint256 amountOut);
    event AssetLegRefunded(address indexed recipient, uint256 amount);

    constructor(address _usdce, address _adapter, address _ctf) {
        usdce = IERC20(_usdce);
        adapter = INegRiskAdapter(_adapter);
        ctf = IERC1155(_ctf);
    }

    /// @notice Pull USDC.e from caller, split via the NegRiskAdapter into a NEUTRAL YES+NO set,
    ///         then forward BOTH outcome tokens to an explicit `recipient` EOA (non-custodial).
    /// @dev `recipient` is a calldata param because the immediate caller may be the LI.FI/Across
    ///      executor contract, not the end user. Revert-safe: on an internal split failure the
    ///      USDC.e is refunded to `recipient` rather than stranded.
    function enterPredictionLeg(bytes32 conditionId, bytes32 questionId, uint256 amount, address recipient)
        external
        nonReentrant
    {
        require(recipient != address(0), "recipient");
        require(amount > 0, "amount");
        // Guard: questionId MUST belong to conditionId. Otherwise splitPosition(conditionId) mints a real
        // set the contract never reads back (positionIds derive from questionId) -> tokens would strand.
        require(adapter.getConditionId(questionId) == conditionId, "qid/cid mismatch");
        // Fail fast on a resolved market (clean revert, no funds stranded).
        require(!adapter.getDetermined(_marketId(questionId)), "market resolved");

        // Pull collateral from the caller into this contract.
        require(usdce.transferFrom(msg.sender, address(this), amount), "transferFrom");

        // Try the split; on ANY internal failure, refund USDC.e to the recipient (revert-safe).
        try this._split(conditionId, amount) {
            // ok
        } catch {
            require(usdce.transfer(recipient, amount), "refund");
            emit PredictionLegRefunded(recipient, questionId, amount);
            return;
        }

        // Read the two positionIds the CORRECT way: from the adapter, off the QUESTION id.
        uint256 yesId = adapter.getPositionId(questionId, true);
        uint256 noId = adapter.getPositionId(questionId, false);

        // Forward the full NEUTRAL set to the recipient — keep nothing.
        uint256 yesBal = ctf.balanceOf(address(this), yesId);
        uint256 noBal = ctf.balanceOf(address(this), noId);
        // Defense-in-depth: the split must have minted the set we're about to forward (never strand).
        require(yesBal > 0 && noBal > 0, "no outcome minted");
        ctf.safeTransferFrom(address(this), recipient, yesId, yesBal, "");
        ctf.safeTransferFrom(address(this), recipient, noId, noBal, "");

        emit PredictionLegEntered(recipient, questionId, amount);
    }

    /// @notice Asset leg: pull USDC.e, exact-approve `spender`, execute the off-chain-built `swapData`
    ///         against `router` (Uniswap V3 SwapRouter02 route — see lib/uniswap/router.ts), then sweep
    ///         the `assetOut` output and any USDC.e dust to `recipient`. The BASKET asset leg — NOT the $7k swap.
    /// @dev Revert-safe: on a swap failure the approval is reset and USDC.e is refunded to `recipient`.
    function enterAssetLeg(
        uint256 amount,
        address recipient,
        address router,
        address spender,
        address assetOut,
        uint256 minAmountOut,
        bytes calldata swapData
    ) external nonReentrant {
        require(recipient != address(0), "recipient");
        require(amount > 0, "amount");
        require(usdce.transferFrom(msg.sender, address(this), amount), "transferFrom");

        // Exact-amount approval to the spender (router or Permit2); no persistent allowance.
        require(usdce.approve(spender, amount), "approve");
        (bool ok,) = router.call(swapData);
        if (!ok) {
            usdce.approve(spender, 0);
            require(usdce.transfer(recipient, amount), "refund");
            emit AssetLegRefunded(recipient, amount);
            return;
        }
        usdce.approve(spender, 0);

        // Sweep the swap output (non-custodial) and any unspent USDC.e back to the recipient.
        uint256 outBal = IERC20(assetOut).balanceOf(address(this));
        // Slippage floor: a no-op / under-delivering route reverts the whole tx (funds untouched).
        require(outBal >= minAmountOut, "slippage");
        if (outBal > 0) require(IERC20(assetOut).transfer(recipient, outBal), "sweep");
        uint256 dust = usdce.balanceOf(address(this));
        if (dust > 0) require(usdce.transfer(recipient, dust), "dust");

        emit AssetLegEntered(recipient, assetOut, amount, outBal);
    }

    /// @notice Internal split, isolated so the outer try/catch can refund on failure.
    /// @dev Exact-amount approval only; no persistent setApprovalForAll. Self-call only.
    function _split(bytes32 conditionId, uint256 amount) external {
        require(msg.sender == address(this), "internal");
        usdce.approve(address(adapter), amount); // exact amount, just-in-time
        adapter.splitPosition(conditionId, amount);
    }

    /// @notice NegRisk marketId is the question id with its last byte zeroed (one market, many questions).
    function _marketId(bytes32 questionId) internal pure returns (bytes32) {
        return questionId & bytes32(~uint256(0xff));
    }
}
