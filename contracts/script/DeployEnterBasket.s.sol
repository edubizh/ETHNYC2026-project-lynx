// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {EnterBasket} from "../src/EnterBasket.sol";

/// Deploy EnterBasket to Polygon mainnet (137).
///
/// Dry-run (no key, no broadcast — verifies wiring):
///   forge script script/DeployEnterBasket.s.sol --rpc-url $POLYGON_RPC
/// Live deploy (throwaway key from shell env — NEVER commit it):
///   forge script script/DeployEnterBasket.s.sol --rpc-url $POLYGON_RPC --private-key $PRIVATE_KEY --broadcast
///
/// Then set NEXT_PUBLIC_ENTER_BASKET to the printed address.
contract DeployEnterBasket is Script {
    // Verified Polygon 137 addresses (overridable via env).
    address constant USDCE = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address constant ADAPTER = 0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296;
    address constant CTF = 0x4D97DCd97eC945f40cF65F87097ACe5EA0476045;

    function run() external returns (EnterBasket basket) {
        address usdce = vm.envOr("USDCE_POLYGON", USDCE);
        address adapter = vm.envOr("NEGRISK_ADAPTER", ADAPTER);
        address ctf = vm.envOr("CTF_POLYGON", CTF);

        vm.startBroadcast();
        basket = new EnterBasket(usdce, adapter, ctf);
        vm.stopBroadcast();

        console2.log("EnterBasket deployed at:", address(basket));
        console2.log("  usdce  :", usdce);
        console2.log("  adapter:", adapter);
        console2.log("  ctf    :", ctf);
        console2.log("-> set NEXT_PUBLIC_ENTER_BASKET to the address above");
    }
}
