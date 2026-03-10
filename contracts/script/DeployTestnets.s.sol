// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";

contract DeployTestnetsScript is Script {
    function run() external {
        console.log("Starting testnet deployment...");
        
        // Deploy to Polkadot Asset Hub Testnet
        try this.deployToPolkadot() {
            console.log("✓ Polkadot Asset Hub testnet deployment completed");
        } catch {
            console.log("✗ Polkadot Asset Hub testnet deployment failed");
        }
        
        // Deploy to Celo Alfajores Testnet
        try this.deployToCeloAlfajores() {
            console.log("✓ Celo Alfajores testnet deployment completed");
        } catch {
            console.log("✗ Celo Alfajores testnet deployment failed");
        }
        
        // Deploy to Base Sepolia Testnet
        try this.deployToBaseSepolia() {
            console.log("✓ Base Sepolia testnet deployment completed");
        } catch {
            console.log("✗ Base Sepolia testnet deployment failed");
        }
        
        console.log("Testnet deployment completed!");
    }
    
    function deployToPolkadot() public {
        uint256 privateKey;
        try vm.envUint("PRIVATE_KEY_POLKADOT") returns (uint256 key) {
            privateKey = key;
        } catch {
            revert("PRIVATE_KEY_POLKADOT not set");
        }
        
        vm.startBroadcast(privateKey);
        PeysEscrow escrow = new PeysEscrow();
        vm.stopBroadcast();
        
        console.log("Polkadot Asset Hub Testnet:", address(escrow));
        console.log("Chain ID: 420420421");
    }
    
    function deployToCeloAlfajores() public {
        uint256 privateKey;
        try vm.envUint("PRIVATE_KEY_CELO") returns (uint256 key) {
            privateKey = key;
        } catch {
            revert("PRIVATE_KEY_CELO not set");
        }
        
        vm.startBroadcast(privateKey);
        PeysEscrow escrow = new PeysEscrow();
        vm.stopBroadcast();
        
        console.log("Celo Alfajores Testnet:", address(escrow));
        console.log("Chain ID: 44787");
    }
    
    function deployToBaseSepolia() public {
        // Use Anvil test account for Base Sepolia
        uint256 privateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        vm.startBroadcast(privateKey);
        PeysEscrow escrow = new PeysEscrow();
        vm.stopBroadcast();
        
        console.log("Base Sepolia Testnet:", address(escrow));
        console.log("Chain ID: 84532");
    }
}
