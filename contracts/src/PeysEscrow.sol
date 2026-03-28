// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PeysEscrow
 * @notice Escrow contract for Peys payment platform
 * @dev Allows users to create payment intents, claim funds, and request refunds
 * @dev Uses Solidity 0.8.20 for built-in overflow/underflow protection
 * @dev All state-changing functions use ReentrancyGuard
 * @dev Implements commit-reveal scheme to prevent front-running attacks
 */
contract PeysEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Payment status enum
    enum PaymentStatus { Pending, Committed, Claimed, Refunded, Expired }

    /// @notice Payment struct
    struct Payment {
        address sender;
        address recipient;
        uint256 amount;
        address token;
        bytes32 secretHash;
        PaymentStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 claimedAt;
        bytes32 commitmentHash;
        uint256 commitmentTime;
    }

    /// @notice ERC20 token interface
    IERC20 public usdc;

    /// @notice Payment counter
    uint256 public paymentCount;

    /// @notice Maximum payment amount (prevents large loss from bugs)
    uint256 public constant MAX_PAYMENT_AMOUNT = 1_000_000e6; // 1M USDC

    /// @notice Minimum payment amount
    uint256 public constant MIN_PAYMENT_AMOUNT = 1e6; // 1 USDC (6 decimals)

    /// @notice Default expiration period
    uint256 public constant DEFAULT_EXPIRATION = 7 days;

    /// @notice Maximum expiration period
    uint256 public constant MAX_EXPIRATION = 90 days;

    /// @notice Commit reveal delay - prevents front-running
    uint256 public constant COMMIT_REVEAL_DELAY = 2 minutes;

    /// @notice Payments mapping
    mapping(uint256 => Payment) public payments;

    /// @notice User's payment IDs
    mapping(address => uint256[]) public userPayments;

    /// @notice Events
    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        address token,
        uint256 expiresAt
    );

    event PaymentCommitted(
        uint256 indexed paymentId,
        address indexed recipient,
        bytes32 commitmentHash
    );

    event PaymentClaimed(
        uint256 indexed paymentId,
        address indexed recipient,
        uint256 amount,
        address token
    );

    event PaymentRefunded(
        uint256 indexed paymentId,
        address indexed sender,
        uint256 amount,
        address token
    );

    /**
     * @notice Constructor
     * @param _usdc USDC token address
     */
    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Create a new payment
     * @param _recipient Recipient address
     * @param _amount Amount to escrow (must be between MIN and MAX)
     * @param _token Token address (must be USDC)
     * @param _secretHash Hash of the secret for claiming
     * @param _duration Lock duration in seconds (default 7 days, max 90 days)
     */
    function createPayment(
        address _recipient,
        uint256 _amount,
        address _token,
        bytes32 _secretHash,
        uint256 _duration
    ) external nonReentrant returns (uint256) {
        require(_recipient != address(0), "Invalid recipient");
        require(_recipient != msg.sender, "Cannot pay yourself");
        require(_amount >= MIN_PAYMENT_AMOUNT, "Amount too small");
        require(_amount <= MAX_PAYMENT_AMOUNT, "Amount too large");
        require(_token == address(usdc), "Only USDC accepted");
        require(_secretHash != bytes32(0), "Invalid secret hash");

        uint256 duration = _duration > 0 ? _duration : DEFAULT_EXPIRATION;
        require(duration <= MAX_EXPIRATION, "Duration too long");
        uint256 expiresAt = block.timestamp + duration;

        usdc.safeTransferFrom(msg.sender, address(this), _amount);

        paymentCount++;
        uint256 paymentId = paymentCount;

        payments[paymentId] = Payment({
            sender: msg.sender,
            recipient: _recipient,
            amount: _amount,
            token: _token,
            secretHash: _secretHash,
            status: PaymentStatus.Pending,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            claimedAt: 0,
            commitmentHash: bytes32(0),
            commitmentTime: 0
        });

        userPayments[msg.sender].push(paymentId);

        emit PaymentCreated(paymentId, msg.sender, _recipient, _amount, _token, expiresAt);

        return paymentId;
    }

    /**
     * @notice Commit to claiming a payment (prevents front-running)
     * @param _paymentId Payment ID
     * @param _commitmentHash Hash of (secret + recipient address) to prevent front-running
     * @dev Front-running protection: the commitment is bound to the recipient
     */
    function commitClaim(uint256 _paymentId, bytes32 _commitmentHash) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");
        require(_commitmentHash != bytes32(0), "Invalid commitment");

        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Pending, "Payment not pending or already claimed");
        require(block.timestamp <= payment.expiresAt, "Payment expired");
        require(payment.recipient == msg.sender, "Not the recipient");
        require(payment.commitmentHash == bytes32(0), "Already committed");
        require(payment.commitmentTime == 0, "Already committed");

        payment.commitmentHash = _commitmentHash;
        payment.commitmentTime = block.timestamp;
        payment.status = PaymentStatus.Committed;

        emit PaymentCommitted(_paymentId, msg.sender, _commitmentHash);
    }

    /**
     * @notice Claim a payment using the secret (after commit)
     * @param _paymentId Payment ID
     * @param _secret The secret to claim
     * @dev Front-running protected by commit-reveal scheme
     */
    function claimPayment(uint256 _paymentId, string calldata _secret) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");

        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Committed, "Must commit first");
        require(block.timestamp <= payment.expiresAt, "Payment expired");
        require(payment.recipient == msg.sender, "Not the recipient");
        require(payment.commitmentTime + COMMIT_REVEAL_DELAY <= block.timestamp, "Too soon to reveal");

        // Verify commitment hash: hash(secret + recipient) must match
        require(
            payment.commitmentHash == keccak256(abi.encodePacked(_secret, msg.sender)),
            "Invalid secret or commitment"
        );

        // Verify the original secret hash matches
        require(
            payment.secretHash == keccak256(abi.encodePacked(_secret)),
            "Invalid secret"
        );

        payment.status = PaymentStatus.Claimed;
        payment.claimedAt = block.timestamp;

        usdc.safeTransfer(payment.recipient, payment.amount);

        emit PaymentClaimed(_paymentId, payment.recipient, payment.amount, payment.token);
    }

    /**
     * @notice Cancel a commit if something went wrong (refund after expiry only)
     * @param _paymentId Payment ID
     * @dev Allows sender to refund after expiry, even if someone committed
     */
    function cancelCommit(uint256 _paymentId) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");

        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Committed, "No commit to cancel");
        require(payment.sender == msg.sender, "Not the sender");
        require(block.timestamp > payment.expiresAt, "Cannot cancel before expiry");

        payment.status = PaymentStatus.Refunded;
        usdc.safeTransfer(payment.sender, payment.amount);

        emit PaymentRefunded(_paymentId, payment.sender, payment.amount, payment.token);
    }

    /**
     * @notice Refund an unclaimed payment (only sender can call after expiry)
     * @param _paymentId Payment ID
     */
    function refundPayment(uint256 _paymentId) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");

        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Pending || payment.status == PaymentStatus.Committed, "Cannot refund");
        require(payment.sender == msg.sender, "Not the sender");
        require(block.timestamp > payment.expiresAt, "Not expired yet");

        payment.status = PaymentStatus.Refunded;

        usdc.safeTransfer(payment.sender, payment.amount);

        emit PaymentRefunded(_paymentId, payment.sender, payment.amount, payment.token);
    }

    /**
     * @notice Get payment details
     * @param _paymentId Payment ID
     */
    function getPayment(uint256 _paymentId) external view returns (Payment memory) {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");
        return payments[_paymentId];
    }

    /**
     * @notice Get user's payment IDs
     * @param _user User address
     */
    function getUserPayments(address _user) external view returns (uint256[] memory) {
        return userPayments[_user];
    }

    /**
     * @notice Get pending payments for a recipient
     * @param _recipient Recipient address
     */
    function getPendingPaymentsForRecipient(address _recipient) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= paymentCount; i++) {
            if (payments[i].recipient == _recipient && 
                (payments[i].status == PaymentStatus.Pending || payments[i].status == PaymentStatus.Committed)) {
                count++;
            }
        }

        uint256[] memory pendingIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= paymentCount; i++) {
            if (payments[i].recipient == _recipient && 
                (payments[i].status == PaymentStatus.Pending || payments[i].status == PaymentStatus.Committed)) {
                pendingIds[index] = i;
                index++;
            }
        }

        return pendingIds;
    }

    /**
     * @notice Check if a payment exists
     * @param _paymentId Payment ID
     */
    function paymentExists(uint256 _paymentId) external view returns (bool) {
        return _paymentId > 0 && _paymentId <= paymentCount;
    }

    /**
     * @notice Get contract USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @notice Get remaining time until reveal is allowed
     * @param _paymentId Payment ID
     */
    function getRevealTimeRemaining(uint256 _paymentId) external view returns (uint256) {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");
        Payment storage payment = payments[_paymentId];
        if (payment.commitmentTime == 0) return 0;
        uint256 revealTime = payment.commitmentTime + COMMIT_REVEAL_DELAY;
        if (block.timestamp >= revealTime) return 0;
        return revealTime - block.timestamp;
    }
}
