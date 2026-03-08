// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script, console } from "forge-std/Script.sol";
import { PeyDotEscrow } from "../contracts/PeyDotEscrow.sol";

contract DeployPeyDotEscrow is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory network = vm.envString("NETWORK");
        
        vm.startBroadcast(deployerPrivateKey);

        PeyDotEscrow escrow = new PeyDotEscrow();

        vm.stopBroadcast();

        console.log("========================================");
        console.log("PeyDotEscrow Deployment");
        console.log("========================================");
        console.log("Network:", network);
        console.log("Contract Address:", address(escrow));
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("========================================");
        
        console.log("");
        console.log("CONTRACT_ADDRESS=", vm.toString(address(escrow)));
        console.log("");
    }
}
