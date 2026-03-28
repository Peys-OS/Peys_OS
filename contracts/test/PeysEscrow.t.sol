// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PeysEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        if (allowance[from][msg.sender] != type(uint256).max) {
            require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
            allowance[from][msg.sender] -= amount;
        }
        require(balanceOf[from] >= amount, "Insufficient balance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract PeysEscrowTest is Test {
    PeysEscrow public escrow;
    MockERC20 public usdc;
    
    address public sender = address(0x1);
    address public recipient = address(0x2);
    address public attacker = address(0x3);
    
    function setUp() public {
        usdc = new MockERC20();
        escrow = new PeysEscrow(address(usdc));
        
        usdc.mint(sender, 1000e6);
        usdc.mint(recipient, 100e6);
        usdc.mint(attacker, 100e6);
    }
    
    function testCreatePayment() public {
        vm.prank(sender);
        usdc.approve(address(escrow), type(uint256).max);
        
        bytes32 secretHash = keccak256(abi.encodePacked("mysecret"));
        
        vm.prank(sender);
        uint256 paymentId = escrow.createPayment(
            recipient,
            100e6,
            address(usdc),
            secretHash,
            0
        );
        
        assertEq(paymentId, 1);
        assertEq(usdc.balanceOf(address(escrow)), 100e6);
        
        PeysEscrow.Payment memory payment = escrow.getPayment(1);
        assertEq(uint8(payment.status), 0); // Pending
    }
    
    function testCommitRevealFlow() public {
        vm.prank(sender);
        usdc.approve(address(escrow), type(uint256).max);
        
        string memory secret = "mysecret123";
        bytes32 secretHash = keccak256(abi.encodePacked(secret));
        
        vm.prank(sender);
        escrow.createPayment(recipient, 100e6, address(usdc), secretHash, 0);
        
        // Recipient commits with hash of (secret + recipient)
        bytes32 commitmentHash = keccak256(abi.encodePacked(secret, recipient));
        
        vm.prank(recipient);
        escrow.commitClaim(1, commitmentHash);
        
        // Fast forward past commit-reveal delay
        vm.warp(block.timestamp + 3 minutes);
        
        // Recipient reveals with secret
        vm.prank(recipient);
        escrow.claimPayment(1, secret);
        
        assertEq(usdc.balanceOf(recipient), 200e6); // 100 initial + 100 claimed
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }
    
    function testFrontRunningPrevention() public {
        vm.prank(sender);
        usdc.approve(address(escrow), type(uint256).max);
        
        string memory secret = "mysecret123";
        bytes32 secretHash = keccak256(abi.encodePacked(secret));
        
        vm.prank(sender);
        escrow.createPayment(recipient, 100e6, address(usdc), secretHash, 0);
        
        // Attacker tries to front-run by calling claimPayment directly (should fail - must commit first)
        vm.prank(attacker);
        vm.expectRevert("Must commit first");
        escrow.claimPayment(1, secret);
        
        // Attacker also can't commit (not the recipient)
        bytes32 fakeCommitment = keccak256(abi.encodePacked("fakesecret", attacker));
        vm.prank(attacker);
        vm.expectRevert("Not the recipient");
        escrow.commitClaim(1, fakeCommitment);
    }
    
    function testCannotRevealBeforeDelay() public {
        vm.prank(sender);
        usdc.approve(address(escrow), type(uint256).max);
        
        string memory secret = "mysecret123";
        bytes32 secretHash = keccak256(abi.encodePacked(secret));
        
        vm.prank(sender);
        escrow.createPayment(recipient, 100e6, address(usdc), secretHash, 0);
        
        bytes32 commitmentHash = keccak256(abi.encodePacked(secret, recipient));
        
        vm.prank(recipient);
        escrow.commitClaim(1, commitmentHash);
        
        // Try to reveal immediately (should fail)
        vm.prank(recipient);
        vm.expectRevert("Too soon to reveal");
        escrow.claimPayment(1, secret);
        
        // After delay, reveal should work
        vm.warp(block.timestamp + 3 minutes);
        
        vm.prank(recipient);
        escrow.claimPayment(1, secret);
        
        assertEq(usdc.balanceOf(recipient), 200e6);
    }
    
    function testRefundAfterExpiry() public {
        vm.prank(sender);
        usdc.approve(address(escrow), type(uint256).max);
        
        uint256 senderBalanceBefore = usdc.balanceOf(sender);
        
        bytes32 secretHash = keccak256(abi.encodePacked("mysecret"));
        
        vm.prank(sender);
        escrow.createPayment(recipient, 100e6, address(usdc), secretHash, 1 minutes);
        
        // Fast forward past expiry
        vm.warp(block.timestamp + 2 minutes);
        
        // Sender can refund
        vm.prank(sender);
        escrow.refundPayment(1);
        
        assertEq(usdc.balanceOf(sender), senderBalanceBefore); // Refunded to original balance
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }
}
