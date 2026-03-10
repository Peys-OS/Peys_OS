// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";

contract DeployBaseSepoliaScript is Script {
    function run() external {
        // For Base Sepolia testnet, use a known test account
        // This is Anvil's first test account - NEVER use this in production
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        vm.startBroadcast(deployerPrivateKey);
        
        PeysEscrow escrow = new PeysEscrow();
        
        vm.stopBroadcast();
        
        console.log("PeysEscrow deployed to Base Sepolia at:", address(escrow));
        console.log("Chain ID: 84532");
    }
}
