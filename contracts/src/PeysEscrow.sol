// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PeysEscrow
 * @notice Escrow contract for Peys payment platform on Polygon Amoy
 * @dev Allows users to create payment intents, claim funds, and request refunds
 */
contract PeysEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Payment status enum
    enum PaymentStatus { Pending, Claimed, Refunded, Expired }

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
    }

    /// @notice ERC20 token interface
    IERC20 public usdc;

    /// @notice Payment counter
    uint256 public paymentCount;

    /// @notice Payments mapping
    mapping(uint256 => Payment) public payments;

    /// @notice Payment ID to index mapping
    mapping(bytes32 => uint256) public paymentIdToIndex;

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
     * @param _usdc USDC token address on Polygon Amoy
     */
    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }

    /**
     * @notice Create a new payment
     * @param _recipient Recipient address
     * @param _amount Amount to escrow
     * @param _token Token address (must be USDC)
     * @param _secretHash Hash of the secret for claiming
     * @param _duration Lock duration in seconds (default 7 days)
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
        require(_amount > 0, "Amount must be > 0");
        require(_token == address(usdc), "Only USDC accepted");
        require(_secretHash != bytes32(0), "Invalid secret hash");

        // Transfer USDC from sender to contract
        usdc.safeTransferFrom(msg.sender, address(this), _amount);

        // Create payment
        paymentCount++;
        uint256 paymentId = paymentCount;
        uint256 expiresAt = block.timestamp + (_duration > 0 ? _duration : 7 days);

        payments[paymentId] = Payment({
            sender: msg.sender,
            recipient: _recipient,
            amount: _amount,
            token: _token,
            secretHash: _secretHash,
            status: PaymentStatus.Pending,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            claimedAt: 0
        });

        paymentIdToIndex[keccak256(abi.encodePacked(_recipient, paymentId))] = paymentId;
        userPayments[msg.sender].push(paymentId);

        emit PaymentCreated(paymentId, msg.sender, _recipient, _amount, _token, expiresAt);

        return paymentId;
    }

    /**
     * @notice Claim a payment using the secret
     * @param _paymentId Payment ID
     * @param _secret The secret to claim
     */
    function claimPayment(uint256 _paymentId, string calldata _secret) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");

        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Pending, "Payment not pending");
        require(block.timestamp <= payment.expiresAt, "Payment expired");
        require(payment.recipient == msg.sender, "Not the recipient");

        // Verify secret
        require(
            payment.secretHash == keccak256(abi.encodePacked(_secret)),
            "Invalid secret"
        );

        // Mark as claimed
        payment.status = PaymentStatus.Claimed;
        payment.claimedAt = block.timestamp;

        // Transfer funds to recipient
        usdc.safeTransfer(payment.recipient, payment.amount);

        emit PaymentClaimed(_paymentId, payment.recipient, payment.amount, payment.token);
    }

    /**
     * @notice Refund an unclaimed payment (only sender can call after expiry)
     * @param _paymentId Payment ID
     */
    function refundPayment(uint256 _paymentId) external nonReentrant {
        require(_paymentId > 0 && _paymentId <= paymentCount, "Invalid payment ID");

        Payment storage payment = payments[_paymentId];

        require(payment.status == PaymentStatus.Pending, "Payment not pending");
        require(payment.sender == msg.sender, "Not the sender");
        require(block.timestamp > payment.expiresAt, "Not expired yet");

        // Mark as refunded
        payment.status = PaymentStatus.Refunded;

        // Transfer funds back to sender
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
            if (payments[i].recipient == _recipient && payments[i].status == PaymentStatus.Pending) {
                count++;
            }
        }

        uint256[] memory pendingIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= paymentCount; i++) {
            if (payments[i].recipient == _recipient && payments[i].status == PaymentStatus.Pending) {
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
}
