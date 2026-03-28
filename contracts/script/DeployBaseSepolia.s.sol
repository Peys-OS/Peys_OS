// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";

/**
 * @title DeployBaseSepolia
 * @notice Deploys PeysEscrow contract to Base Sepolia testnet
 */
contract DeployBaseSepolia is Script {
    // Base Sepolia USDC token address (Circle testnet)
    // From: https://developers.circle.com/docs/usdc-on-testnet
    address constant USDC_ADDRESS = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_BASE");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying PeysEscrow to Base Sepolia...");
        console.log("Deployer address:", deployer);
        console.log("USDC address:", USDC_ADDRESS);
        
        vm.startBroadcast(deployerPrivateKey);
        
        PeysEscrow escrow = new PeysEscrow(USDC_ADDRESS);
        
        console.log("PeysEscrow deployed at:", address(escrow));
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Base Sepolia (Chain ID: 84532)");
        console.log("Escrow Contract:", address(escrow));
        console.log("USDC Token:", USDC_ADDRESS);
        console.log("===========================");
        console.log("");
        console.log("Add these to your .env file:");
        console.log("VITE_ESCROW_CONTRACT_ADDRESS_BASE_SEPOLIA=", vm.toString(address(escrow)));
    }
}
