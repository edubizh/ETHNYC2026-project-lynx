// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {EnterBasket, IERC20, IERC1155, INegRiskAdapter} from "../src/EnterBasket.sol";

interface IAllowance {
    function allowance(address owner, address spender) external view returns (uint256);
}

contract EnterBasketTest is Test {
    EnterBasket basket;

    // Verified Polygon 137 addresses (overridable via env). Defaults = pinned VERIFIED FACTS.
    address USDCE = vm.envOr("USDCE_POLYGON", address(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174));
    address ADAPTER = vm.envOr("NEGRISK_ADAPTER", address(0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296));
    address WCOL = vm.envOr("WCOL", address(0x3A3BD7bb9528E159577F7C2e685CC81A765002E2));
    address CTF = vm.envOr("CTF_POLYGON", address(0x4D97DCd97eC945f40cF65F87097ACe5EA0476045));

    // PRIMARY always-valid leg: OpenAI-not-IPO-by-Dec-2026 (verified ends 2027-01-01).
    bytes32 conditionId =
        vm.envOr("AI_CONDITION_ID", bytes32(0x3849e1d62e0807801913d3e2427e8caf3cc6dd1c8ef42d8d5c08c6f9c449dc5e));
    bytes32 questionId =
        vm.envOr("AI_QUESTION_ID", bytes32(0xd2c21cbb9d2cb407ab3dcf619d93f6d65b7967154cd6ee930f7758baa2b4bf06));

    address user = address(0xBEEF); // the recipient EOA

    function setUp() public {
        string memory rpc = vm.envOr("POLYGON_RPC", string("https://polygon-bor-rpc.publicnode.com"));
        vm.createSelectFork(rpc);
        basket = new EnterBasket(USDCE, ADAPTER, CTF);
        deal(USDCE, user, 100e6); // 100 USDC.e
        assertEq(IERC20(USDCE).balanceOf(user), 100e6, "deal failed (USDC.e balance not set)");
    }

    /// GOLD STANDARD: a real NegRiskAdapter split on a Polygon fork lands the NEUTRAL set in the
    /// recipient's wallet, and EnterBasket retains nothing. NO false-green USDC-balance assertion.
    function test_splitMintsNeutralSetToRecipient() public {
        // Read positionIds the CORRECT way: from the adapter, off the QUESTION id.
        uint256 yesId = INegRiskAdapter(ADAPTER).getPositionId(questionId, true);
        uint256 noId = INegRiskAdapter(ADAPTER).getPositionId(questionId, false);

        // Sanity: these equal the verified Gamma clobTokenIds.
        assertEq(
            yesId,
            56615676606297588259337956203332341775475048285080710344367729433788967812170,
            "YES id != clobTokenId"
        );
        assertEq(
            noId,
            8070607953656787024050950499598687532281829563384949938603247089607814583142,
            "NO id != clobTokenId"
        );

        vm.startPrank(user);
        IERC20(USDCE).approve(address(basket), 10e6);
        basket.enterPredictionLeg(conditionId, questionId, 10e6, user); // recipient = user (explicit)
        vm.stopPrank();

        // Non-custodial: the recipient holds BOTH outcome tokens...
        assertGt(IERC1155(CTF).balanceOf(user, yesId), 0, "recipient YES");
        assertGt(IERC1155(CTF).balanceOf(user, noId), 0, "recipient NO");
        // ...and EnterBasket retains NOTHING (no wcol, no USDC.e, no outcome tokens).
        assertEq(IERC20(WCOL).balanceOf(address(basket)), 0, "no wcol left");
        assertEq(IERC20(USDCE).balanceOf(address(basket)), 0, "no USDC.e left");
        assertEq(IERC1155(CTF).balanceOf(address(basket), yesId), 0, "no YES left");
        assertEq(IERC1155(CTF).balanceOf(address(basket), noId), 0, "no NO left");
    }

    function test_enterPredictionLeg_revertsOnZeroRecipient() public {
        vm.startPrank(user);
        IERC20(USDCE).approve(address(basket), 10e6);
        vm.expectRevert(bytes("recipient"));
        basket.enterPredictionLeg(conditionId, questionId, 10e6, address(0));
        vm.stopPrank();
    }

    function test_enterPredictionLeg_revertsOnZeroAmount() public {
        vm.startPrank(user);
        vm.expectRevert(bytes("amount"));
        basket.enterPredictionLeg(conditionId, questionId, 0, user);
        vm.stopPrank();
    }

    /// A mismatched (conditionId, questionId) pair must revert fast — never strand the minted set.
    function test_enterPredictionLeg_revertsOnMismatchedQuestionId() public {
        // Anthropic's questionId paired with the OpenAI conditionId -> getConditionId != conditionId.
        bytes32 wrongQuestionId = bytes32(0x3dcd0f5c7c6df89336a87be866327c862646e18b5deee05f31c250451b3a2901);
        vm.startPrank(user);
        IERC20(USDCE).approve(address(basket), 10e6);
        vm.expectRevert(bytes("qid/cid mismatch"));
        basket.enterPredictionLeg(conditionId, wrongQuestionId, 10e6, user);
        vm.stopPrank();
        // No funds pulled on a fast revert.
        assertEq(IERC20(USDCE).balanceOf(address(basket)), 0, "no USDC.e pulled");
    }

    /// Asset leg mechanics against a MockRouter: pull USDC.e, run the route, sweep output to recipient.
    function test_assetLeg_swapsAndSweepsToRecipient() public {
        MockERC20 assetOut = new MockERC20();
        MockRouter router = new MockRouter();
        uint256 amountIn = 10e6;
        uint256 amountOut = 7e15; // arbitrary wstETH-like output

        bytes memory swapData = abi.encodeWithSelector(
            MockRouter.swap.selector, USDCE, address(basket), amountIn, address(assetOut), amountOut, address(basket)
        );

        vm.startPrank(user);
        IERC20(USDCE).approve(address(basket), amountIn);
        basket.enterAssetLeg(amountIn, user, address(router), address(router), address(assetOut), amountOut, swapData);
        vm.stopPrank();

        assertEq(assetOut.balanceOf(user), amountOut, "recipient asset out");
        assertEq(IERC20(USDCE).balanceOf(address(basket)), 0, "no USDC.e left");
        assertEq(assetOut.balanceOf(address(basket)), 0, "no asset left");
        assertEq(IAllowance(USDCE).allowance(address(basket), address(router)), 0, "approval reset");
    }

    /// On a failed swap the asset leg refunds USDC.e to the recipient (revert-safe).
    function test_assetLeg_refundsOnSwapFailure() public {
        MockERC20 assetOut = new MockERC20();
        RevertingRouter router = new RevertingRouter();
        uint256 amountIn = 10e6;

        vm.startPrank(user);
        IERC20(USDCE).approve(address(basket), amountIn);
        uint256 before = IERC20(USDCE).balanceOf(user);
        basket.enterAssetLeg(amountIn, user, address(router), address(router), address(assetOut), 0, hex"deadbeef");
        vm.stopPrank();

        assertEq(IERC20(USDCE).balanceOf(user), before, "USDC.e refunded to recipient");
        assertEq(IERC20(USDCE).balanceOf(address(basket)), 0, "no USDC.e left");
    }
}

// --- minimal mocks (asset-leg mechanics only) ---

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amt) external {
        balanceOf[to] += amt;
    }

    function approve(address s, uint256 a) external returns (bool) {
        allowance[msg.sender][s] = a;
        return true;
    }

    function transfer(address to, uint256 a) external returns (bool) {
        balanceOf[msg.sender] -= a;
        balanceOf[to] += a;
        return true;
    }

    function transferFrom(address f, address to, uint256 a) external returns (bool) {
        allowance[f][msg.sender] -= a;
        balanceOf[f] -= a;
        balanceOf[to] += a;
        return true;
    }
}

contract MockRouter {
    function swap(address tokenIn, address from, uint256 amountIn, address tokenOut, uint256 amountOut, address to)
        external
    {
        IERC20(tokenIn).transferFrom(from, address(this), amountIn);
        MockERC20(tokenOut).mint(to, amountOut);
    }
}

contract RevertingRouter {
    fallback() external payable {
        revert("router failed");
    }
}
