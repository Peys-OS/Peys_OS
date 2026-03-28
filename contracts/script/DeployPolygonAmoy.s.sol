// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";

/**
 * @title DeployPolygonAmoy
 * @notice Deploys PeysEscrow contract to Polygon Amoy testnet
 */
contract DeployPolygonAmoy is Script {
    // Polygon Amoy USDC token address (Testnet)
    // From: https://www.circle.com/blog/introducing-usdc-on-polygon-pos
    address constant USDC_ADDRESS = 0x41E94EB09554da6d1DE6384F89b8c2C5B2c7f3f7;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_POLYGON");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying PeysEscrow to Polygon Amoy...");
        console.log("Deployer address:", deployer);
        console.log("USDC address:", USDC_ADDRESS);
        
        vm.startBroadcast(deployerPrivateKey);
        
        PeysEscrow escrow = new PeysEscrow(USDC_ADDRESS);
        
        console.log("PeysEscrow deployed at:", address(escrow));
        
        vm.stopBroadcast();
        
        console.log("");
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Polygon Amoy (Chain ID: 80002)");
        console.log("Escrow Contract:", address(escrow));
        console.log("USDC Token:", USDC_ADDRESS);
        console.log("===========================");
        console.log("");
        console.log("Add these to your .env file:");
        console.log("VITE_ESCROW_CONTRACT_ADDRESS_POLYGON=0x", vm.toString(address(escrow)));
    }
}
