// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";

contract DeployCeloAlfajoresScript is Script {
    function run() external {
        // For Celo Alfajores Testnet (Chain ID: 44787)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_CELO");
        
        vm.startBroadcast(deployerPrivateKey);
        
        PeysEscrow escrow = new PeysEscrow();
        
        vm.stopBroadcast();
        
        console.log("PeysEscrow deployed to Celo Alfajores at:", address(escrow));
        console.log("Chain ID: 44787");
    }
}
