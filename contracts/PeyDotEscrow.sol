// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface IXCM {
    function transfer(address token, address recipient, uint256 amount) external returns (bool);
}

contract PeyDotEscrow {
    uint256 public constant DEFAULT_EXPIRY = 7 days;
    uint256 public constant MIN_EXPIRY = 1 days;
    uint256 public constant MAX_EXPIRY = 30 days;

    struct Payment {
        address sender;
        address token;
        uint256 amount;
        bytes32 claimHash;
        uint256 expiry;
        bool claimed;
        bool refunded;
        string memo;
    }

    mapping(bytes32 => Payment) public payments;
    mapping(address => bytes32[]) public userPayments;

    event PaymentCreated(
        bytes32 indexed paymentId,
        address indexed sender,
        address token,
        uint256 amount,
        uint256 expiry,
        string memo
    );

    event PaymentClaimed(
        bytes32 indexed paymentId,
        address indexed recipient,
        uint256 amount
    );

    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed sender,
        uint256 amount
    );

    error PaymentNotFound();
    error PaymentAlreadyClaimed();
    error PaymentAlreadyRefunded();
    error PaymentExpired();
    error InvalidClaimHash();
    error InsufficientBalance();
    error ZeroAmount();
    error InvalidExpiry();
    error NotSender();
    error TransferFailed();

    modifier onlyActivePayment(bytes32 paymentId) {
        Payment storage payment = payments[paymentId];
        if (payment.amount == 0) revert PaymentNotFound();
        if (payment.claimed) revert PaymentAlreadyClaimed();
        if (payment.refunded) revert PaymentAlreadyRefunded();
        if (block.timestamp > payment.expiry) revert PaymentExpired();
        _;
    }

    function createPayment(
        address token,
        uint256 amount,
        bytes32 claimHash,
        uint256 expiry,
        string calldata memo
    ) internal returns (bytes32 paymentId) {
        if (amount == 0) revert ZeroAmount();
        if (expiry < MIN_EXPIRY || expiry > MAX_EXPIRY) revert InvalidExpiry();
        if (token == address(0)) revert ZeroAmount();

        IERC20 tokenContract = IERC20(token);
        if (tokenContract.allowance(msg.sender, address(this)) < amount) {
            revert InsufficientBalance();
        }

        if (!tokenContract.transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed();
        }

        paymentId = keccak256(
            abi.encodePacked(msg.sender, token, amount, claimHash, block.timestamp)
        );

        payments[paymentId] = Payment({
            sender: msg.sender,
            token: token,
            amount: amount,
            claimHash: claimHash,
            expiry: block.timestamp + expiry,
            claimed: false,
            refunded: false,
            memo: memo
        });

        userPayments[msg.sender].push(paymentId);

        emit PaymentCreated(paymentId, msg.sender, token, amount, payments[paymentId].expiry, memo);
    }

    function createPaymentWithDefaultExpiry(
        address token,
        uint256 amount,
        bytes32 claimHash,
        string calldata memo
    ) external returns (bytes32 paymentId) {
        return createPayment(token, amount, claimHash, DEFAULT_EXPIRY, memo);
    }

    function createPaymentExternal(
        address token,
        uint256 amount,
        bytes32 claimHash,
        uint256 expiry,
        string calldata memo
    ) external returns (bytes32 paymentId) {
        return createPayment(token, amount, claimHash, expiry, memo);
    }

    function claim(
        bytes32 paymentId,
        bytes32 secretHash,
        address recipient
    ) external onlyActivePayment(paymentId) returns (uint256) {
        Payment storage payment = payments[paymentId];

        if (payment.claimHash != secretHash) revert InvalidClaimHash();

        payment.claimed = true;

        IERC20 tokenContract = IERC20(payment.token);
        if (!tokenContract.transfer(recipient, payment.amount)) {
            revert TransferFailed();
        }

        emit PaymentClaimed(paymentId, recipient, payment.amount);

        return payment.amount;
    }

    function refundAfterExpiry(bytes32 paymentId) external {
        Payment storage payment = payments[paymentId];

        if (payment.amount == 0) revert PaymentNotFound();
        if (payment.claimed) revert PaymentAlreadyClaimed();
        if (payment.refunded) revert PaymentAlreadyRefunded();
        if (block.timestamp <= payment.expiry) revert PaymentExpired();
        if (payment.sender != msg.sender) revert NotSender();

        payment.refunded = true;

        IERC20 tokenContract = IERC20(payment.token);
        if (!tokenContract.transfer(payment.sender, payment.amount)) {
            revert TransferFailed();
        }

        emit PaymentRefunded(paymentId, payment.sender, payment.amount);
    }

    function getPayment(bytes32 paymentId) external view returns (
        address sender,
        address token,
        uint256 amount,
        uint256 expiry,
        bool claimed,
        bool refunded,
        string memory memo
    ) {
        Payment storage payment = payments[paymentId];
        return (
            payment.sender,
            payment.token,
            payment.amount,
            payment.expiry,
            payment.claimed,
            payment.refunded,
            payment.memo
        );
    }

    function getUserPaymentIds(address user) external view returns (bytes32[] memory) {
        return userPayments[user];
    }

    function isPaymentExpired(bytes32 paymentId) external view returns (bool) {
        Payment storage payment = payments[paymentId];
        return block.timestamp > payment.expiry;
    }

    function getContractTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}
