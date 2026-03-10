// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";

contract DeployAllScript is Script {
    function run() external {
        // This script deploys to multiple networks sequentially
        // Set environment variables before running:
        // export PRIVATE_KEY_POLKADOT=your_key
        // export PRIVATE_KEY_CELO=your_key
        // export PRIVATE_KEY_BASE=your_key
        
        console.log("Starting multi-chain deployment...");
        
        // Deploy to Polkadot Asset Hub if private key is set
        try this.deployToPolkadot() {
            console.log("✓ Polkadot deployment completed");
        } catch {
            console.log("✗ Polkadot deployment failed (check PRIVATE_KEY_POLKADOT)");
        }
        
        // Deploy to Celo if private key is set
        try this.deployToCelo() {
            console.log("✓ Celo deployment completed");
        } catch {
            console.log("✗ Celo deployment failed (check PRIVATE_KEY_CELO)");
        }
        
        // Deploy to Base Sepolia (uses test account)
        try this.deployToBaseSepolia() {
            console.log("✓ Base Sepolia deployment completed");
        } catch {
            console.log("✗ Base Sepolia deployment failed");
        }
        
        console.log("Multi-chain deployment completed!");
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
        
        console.log("Polkadot Asset Hub:", address(escrow));
    }
    
    function deployToCelo() public {
        uint256 privateKey;
        try vm.envUint("PRIVATE_KEY_CELO") returns (uint256 key) {
            privateKey = key;
        } catch {
            revert("PRIVATE_KEY_CELO not set");
        }
        
        vm.startBroadcast(privateKey);
        PeysEscrow escrow = new PeysEscrow();
        vm.stopBroadcast();
        
        console.log("Celo Mainnet:", address(escrow));
    }
    
    function deployToBaseSepolia() public {
        // Use Anvil test account for Base Sepolia
        uint256 privateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        vm.startBroadcast(privateKey);
        PeysEscrow escrow = new PeysEscrow();
        vm.stopBroadcast();
        
        console.log("Base Sepolia:", address(escrow));
    }
}
