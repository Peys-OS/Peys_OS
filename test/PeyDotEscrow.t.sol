// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/PeyDotEscrow.sol";

contract MockERC20 is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return 6;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        _balances[from] = fromBalance - amount;
        _balances[to] += amount;
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            _approve(owner, spender, currentAllowance - amount);
        }
    }

    function mint(address to, uint256 amount) external {
        _balances[to] += amount;
        _totalSupply += amount;
    }
}

contract PeyDotEscrowTest is Test {
    PeyDotEscrow public escrow;
    MockERC20 public usdc;
    MockERC20 public usdt;

    address public sender = address(0x1);
    address public recipient = address(0x2);
    address public other = address(0x3);

    uint256 constant AMOUNT = 100e6;

    bytes32 public claimHash;
    bytes32 public wrongClaimHash = keccak256(abi.encodePacked("wrong"));

    function setUp() public {
        escrow = new PeyDotEscrow();
        usdc = new MockERC20("USD Coin", "USDC");
        usdt = new MockERC20("Tether USD", "USDT");

        claimHash = keccak256(abi.encodePacked("secret"));

        usdc.mint(sender, 1000e6);
        usdt.mint(sender, 1000e6);

        vm.prank(sender);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function testCreatePayment() public {
        vm.prank(sender);
        bytes32 paymentId = escrow.createPaymentWithDefaultExpiry(
            address(usdc),
            AMOUNT,
            claimHash,
            "Test payment"
        );

        assert(paymentId != bytes32(0));

        (address _sender, address _token, uint256 _amount, uint256 _expiry, bool claimed, bool refunded, string memory memo) = 
            escrow.getPayment(paymentId);

        assert(_sender == sender);
        assert(_token == address(usdc));
        assert(_amount == AMOUNT);
        assert(!claimed);
        assert(!refunded);
        assert(keccak256(abi.encodePacked(memo)) == keccak256(abi.encodePacked("Test payment")));
    }

    function testCreatePaymentWithCustomExpiry() public {
        vm.prank(sender);
        bytes32 paymentId = escrow.createPaymentExternal(
            address(usdc),
            AMOUNT,
            claimHash,
            3 days,
            "Custom expiry"
        );

        (,,, uint256 expiry,,,) = escrow.getPayment(paymentId);
        assert(expiry == block.timestamp + 3 days);
    }

    function testClaimPayment() public {
        vm.prank(sender);
        bytes32 paymentId = escrow.createPaymentWithDefaultExpiry(
            address(usdc),
            AMOUNT,
            claimHash,
            "Test"
        );

        vm.prank(recipient);
        escrow.claim(paymentId, claimHash, recipient);

        assert(usdc.balanceOf(recipient) == AMOUNT);
        assert(usdc.balanceOf(address(escrow)) == 0);

        (address _sender3, address _token3, uint256 _amount3, uint256 _expiry3, bool claimed, bool _refunded3, string memory _memo3) = escrow.getPayment(paymentId);
        assert(claimed);
    }

    function testClaimWithWrongHash() public {
        vm.prank(sender);
        bytes32 paymentId = escrow.createPaymentWithDefaultExpiry(
            address(usdc),
            AMOUNT,
            claimHash,
            "Test"
        );

        vm.prank(recipient);
        vm.expectRevert(PeyDotEscrow.InvalidClaimHash.selector);
        escrow.claim(paymentId, wrongClaimHash, recipient);
    }

    function testRefundAfterExpiry() public {
        vm.prank(sender);
        bytes32 paymentId = escrow.createPaymentWithDefaultExpiry(
            address(usdc),
            AMOUNT,
            claimHash,
            "Test"
        );

        vm.warp(block.timestamp + 8 days);

        vm.prank(sender);
        escrow.refundAfterExpiry(paymentId);

        assert(usdc.balanceOf(sender) == 1000e6);
        
        (address _sender2, address _token2, uint256 _amount2, uint256 _expiry2, bool _claimed, bool refunded,) = escrow.getPayment(paymentId);
        assert(refunded);
    }

    function testCannotRefundBeforeExpiry() public {
        vm.prank(sender);
        bytes32 paymentId = escrow.createPaymentWithDefaultExpiry(
            address(usdc),
            AMOUNT,
            claimHash,
            "Test"
        );

        vm.prank(sender);
        vm.expectRevert(PeyDotEscrow.PaymentExpired.selector);
        escrow.refundAfterExpiry(paymentId);
    }

    function testCannotRefundByNonSender() public {
        vm.prank(sender);
        bytes32 paymentId = escrow.createPaymentWithDefaultExpiry(
            address(usdc),
            AMOUNT,
            claimHash,
            "Test"
        );

        vm.warp(block.timestamp + 8 days);

        vm.prank(other);
        vm.expectRevert(PeyDotEscrow.NotSender.selector);
        escrow.refundAfterExpiry(paymentId);
    }

    function testCannotClaimExpiredPayment() public {
        vm.prank(sender);
        bytes32 paymentId = escrow.createPaymentWithDefaultExpiry(
            address(usdc),
            AMOUNT,
            claimHash,
            "Test"
        );

        vm.warp(block.timestamp + 8 days);

        vm.prank(recipient);
        vm.expectRevert(PeyDotEscrow.PaymentExpired.selector);
        escrow.claim(paymentId, claimHash, recipient);
    }

    function testZeroAmount() public {
        vm.prank(sender);
        vm.expectRevert(PeyDotEscrow.ZeroAmount.selector);
        escrow.createPaymentWithDefaultExpiry(
            address(usdc),
            0,
            claimHash,
            "Test"
        );
    }

    function testInvalidExpiry() public {
        vm.prank(sender);
        vm.expectRevert(PeyDotEscrow.InvalidExpiry.selector);
        escrow.createPaymentExternal(
            address(usdc),
            AMOUNT,
            claimHash,
            45 days,
            "Test"
        );
    }

    function testPaymentNotFound() public {
        bytes32 nonExistentId = keccak256(abi.encodePacked("non-existent"));
        vm.expectRevert(PeyDotEscrow.PaymentNotFound.selector);
        escrow.refundAfterExpiry(nonExistentId);
    }
}
