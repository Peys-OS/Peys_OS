// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";

contract DeployPolkadotScript is Script {
    function run() external {
        // For Polkadot Asset Hub testnet
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_POLKADOT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        PeysEscrow escrow = new PeysEscrow();
        
        vm.stopBroadcast();
        
        console.log("PeysEscrow deployed to Polkadot Asset Hub at:", address(escrow));
        console.log("Chain ID: 420420421");
    }
}
