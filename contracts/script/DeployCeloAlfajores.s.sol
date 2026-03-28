// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";

/**
 * @title DeployCeloAlfajores
 * @notice Deploys PeysEscrow contract to Celo Alfajores testnet
 */
contract DeployCeloAlfajores is Script {
    // Celo Alfajores USDC token address (Circle testnet)
    // From: https://developers.circle.com/docs/usdc-on-testnet
    address constant USDC_ADDRESS = 0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_CELO");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying PeysEscrow to Celo Alfajores...");
        console.log("Deployer address:", deployer);
        console.log("USDC address:", USDC_ADDRESS);
        
        vm.startBroadcast(deployerPrivateKey);
        
        PeysEscrow escrow = new PeysEscrow(USDC_ADDRESS);
        
        console.log("PeysEscrow deployed at:", address(escrow));
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Celo Alfajores (Chain ID: 44787)");
        console.log("Escrow Contract:", address(escrow));
        console.log("USDC Token:", USDC_ADDRESS);
        console.log("===========================");
        console.log("");
        console.log("Add these to your .env file:");
        console.log("VITE_ESCROW_CONTRACT_ADDRESS_CELO=", vm.toString(address(escrow)));
    }
}
