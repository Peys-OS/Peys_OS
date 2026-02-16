// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PeyDotEscrow.sol";

contract DeployPeyDotEscrow is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        PeyDotEscrow escrow = new PeyDotEscrow();

        console.log("PeyDotEscrow deployed at:", address(escrow));

        vm.stopBroadcast();
    }
}

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory network = vm.envString("NETWORK");

        vm.startBroadcast(deployerPrivateKey);

        PeyDotEscrow escrow = new PeyDotEscrow();

        console.log("========================================");
        console.log("PeyDotEscrow Deployment");
        console.log("========================================");
        console.log("Network:", network);
        console.log("Contract Address:", address(escrow));
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("========================================");

        vm.stopBroadcast();
    }
}
