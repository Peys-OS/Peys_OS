// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "forge-std/Script.sol";
import "../src/PeysEscrow.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);
        
        PeysEscrow escrow = new PeysEscrow();
        
        vm.stopBroadcast();
        
        console.log("PeysEscrow deployed at:", address(escrow));
        
        // Save address to .env for frontend usage
        vm.writeLine(".env", string(abi.encodePacked("VITE_ESCROW_CONTRACT_ADDRESS=", vm.toString(address(escrow)))));
    }
}
