// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";
import "../src/PeyStreaming.sol";
import "../src/PeyBatchPayroll.sol";

contract DeployStreamingPayrollScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_POLKADOT");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // PASS token address on Polkadot Asset Hub (ERC20 precompile)
        address passToken = 0x00000001000000000000000000000000000007c0;
        
        // Deploy Streaming contract
        PeyStreaming streaming = new PeyStreaming(passToken);
        console.log("PeyStreaming deployed to:", address(streaming));
        
        // Deploy Batch Payroll contract
        PeyBatchPayroll batchPayroll = new PeyBatchPayroll(passToken);
        console.log("PeyBatchPayroll deployed to:", address(batchPayroll));
        
        vm.stopBroadcast();
        
        console.log("=== Deployment Summary ===");
        console.log("Chain: Polkadot Asset Hub Testnet (420420417)");
        console.log("PASS Token:", passToken);
        console.log("PeyStreaming:", address(streaming));
        console.log("PeyBatchPayroll:", address(batchPayroll));
    }
}
