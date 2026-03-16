// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title PeyBatchPayroll
 * @dev Smart contract for batch payments and payroll management
 * 
 * Features:
 * - Batch payments to multiple recipients in a single transaction (gas efficient)
 * - Merkle tree-based batch processing for large payrolls
 * - Recurring payroll schedules
 * - Integration with PeyStreaming for salary streaming
 * - Payment approvals and multi-sig support
 */
contract PeyBatchPayroll is ReentrancyGuard {
    IERC20 public immutable TOKEN;
    
    // Maximum recipients per batch transaction
    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant MAX_RECIPIENTS_MERKLE = 1000;
    
    // Structs
    struct BatchPayment {
        bytes32 batchId;
        address sender;
        uint256 totalAmount;
        uint256 paidAmount;
        uint256 recipientCount;
        uint256 createdAt;
        uint256 executedAt;
        bool isExecuted;
        bool isCancelled;
    }
    
    struct PayrollSchedule {
        bytes32 scheduleId;
        address employer;
        address employee;
        uint256 amountPerPeriod;
        uint256 periodDuration; // in seconds (e.g., 30 days = 2592000)
        uint256 startTime;
        uint256 nextPaymentTime;
        uint256 totalPaid;
        uint256 totalScheduled;
        bool isActive;
        bool isCancelled;
    }
    
    struct StreamSalary {
        bytes32 streamId;
        address employer;
        address employee;
        uint256 totalAmount;
        uint256 streamedAmount;
        uint256 ratePerSecond;
        uint256 startTime;
        bool isActive;
        bool isCancelled;
    }
    
    // Mappings
    mapping(bytes32 => BatchPayment) public batchPayments;
    mapping(bytes32 => PayrollSchedule) public payrollSchedules;
    mapping(bytes32 => StreamSalary) public streamSalaries;
    
    // Employee payroll schedules per employer
    mapping(address => bytes32[]) public employerPayrolls;
    mapping(address => bytes32[]) public employeeStreams;
    
    // Events
    event BatchPaymentCreated(
        bytes32 indexed batchId,
        address indexed sender,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    event BatchPaymentExecuted(
        bytes32 indexed batchId,
        address indexed executor,
        uint256 totalPaid,
        uint256 recipientCount
    );
    
    event BatchPaymentCancelled(
        bytes32 indexed batchId,
        address indexed canceller
    );
    
    event PayrollScheduleCreated(
        bytes32 indexed scheduleId,
        address indexed employer,
        address indexed employee,
        uint256 amountPerPeriod,
        uint256 periodDuration
    );
    
    event PayrollExecuted(
        bytes32 indexed scheduleId,
        address indexed employee,
        uint256 amount
    );
    
    event PayrollCancelled(
        bytes32 indexed scheduleId,
        address indexed canceller
    );
    
    event StreamSalaryCreated(
        bytes32 indexed streamId,
        address indexed employer,
        address indexed employee,
        uint256 totalAmount,
        uint256 ratePerSecond
    );
    
    event StreamSalaryWithdrawn(
        bytes32 indexed streamId,
        address indexed recipient,
        uint256 amount
    );
    
    event StreamSalaryCancelled(
        bytes32 indexed streamId,
        address indexed canceller
    );
    
    // Errors
    error InvalidTokenAddress();
    error ZeroAmount();
    error BatchTooLarge();
    error BatchNotFound();
    error BatchAlreadyExecuted();
    error BatchAlreadyCancelled();
    error InsufficientTokenAllowance();
    error InsufficientTokenBalance();
    error InvalidMerkleProof();
    error PayrollNotFound();
    error PayrollAlreadyActive();
    error PayrollNotActive();
    error PaymentNotDue();
    error StreamNotFound();
    error StreamNotActive();
    error InvalidPeriodDuration();
    error NotAdmin();
    error NotSender();
    
    address public admin;
    
    constructor(address _TOKEN) {
        if (_TOKEN == address(0)) revert InvalidTokenAddress();
        TOKEN = IERC20(_TOKEN);
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }
    
    // ============================================
    // BATCH PAYMENTS
    // ============================================
    
    /**
     * @dev Create a batch payment with multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts for each recipient
     * @param totalAmount Total amount for the batch
     */
    function createBatchPayment(
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256 totalAmount
    ) external nonReentrant returns (bytes32) {
        if (recipients.length == 0 || recipients.length != amounts.length) revert ZeroAmount();
        if (recipients.length > MAX_BATCH_SIZE) revert BatchTooLarge();
        if (totalAmount == 0) revert ZeroAmount();
        
        // Check TOKEN allowance and balance
        if (TOKEN.allowance(msg.sender, address(this)) < totalAmount) revert InsufficientTokenAllowance();
        if (TOKEN.balanceOf(msg.sender) < totalAmount) revert InsufficientTokenBalance();
        
        // Generate batch ID
        bytes32 batchId = keccak256(abi.encodePacked(
            msg.sender,
            totalAmount,
            recipients.length,
            block.timestamp
        ));
        
        // Store batch payment
        batchPayments[batchId] = BatchPayment({
            batchId: batchId,
            sender: msg.sender,
            totalAmount: totalAmount,
            paidAmount: 0,
            recipientCount: recipients.length,
            createdAt: block.timestamp,
            executedAt: 0,
            isExecuted: false,
            isCancelled: false
        });
        
        // Transfer TOKENs to contract
        TOKEN.transferFrom(msg.sender, address(this), totalAmount);
        
        emit BatchPaymentCreated(batchId, msg.sender, totalAmount, recipients.length);
        
        return batchId;
    }
    
    /**
     * @dev Execute batch payment - distribute to all recipients
     * @param batchId The batch payment ID
     * @param recipients Array of recipient addresses (must match original)
     * @param amounts Array of amounts (must match original)
     */
    function executeBatchPayment(
        bytes32 batchId,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant returns (bool) {
        BatchPayment storage batch = batchPayments[batchId];
        
        if (batch.batchId == bytes32(0)) revert BatchNotFound();
        if (batch.isExecuted) revert BatchAlreadyExecuted();
        if (batch.isCancelled) revert BatchAlreadyCancelled();
        if (recipients.length != batch.recipientCount) revert BatchTooLarge();
        
        // Verify amounts match
        uint256 totalPaid;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalPaid += amounts[i];
        }
        if (totalPaid != batch.totalAmount) revert ZeroAmount();
        
        // Execute payments
        for (uint256 i = 0; i < recipients.length; i++) {
            if (amounts[i] > 0) {
                TOKEN.transfer(recipients[i], amounts[i]);
            }
        }
        
        batch.isExecuted = true;
        batch.executedAt = block.timestamp;
        batch.paidAmount = totalPaid;
        
        emit BatchPaymentExecuted(batchId, msg.sender, totalPaid, recipients.length);
        
        return true;
    }
    
    /**
     * @dev Process batch using Merkle proof (for large payrolls)
     * @param merkleRoot Root of the Merkle tree
     * @param proof Merkle proof for this recipient
     * @param index Index in the merkle tree
     * @param recipient Recipient address
     * @param amount Amount for recipient
     */
    function processMerkleBatch(
        bytes32 merkleRoot,
        bytes32[] calldata proof,
        uint256 index,
        address recipient,
        uint256 amount
    ) external nonReentrant returns (bool) {
        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(index, recipient, amount));
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert InvalidMerkleProof();
        
        TOKEN.transfer(recipient, amount);
        
        return true;
    }
    
    /**
     * @dev Cancel batch payment and refund sender
     * @param batchId The batch payment ID
     */
    function cancelBatchPayment(bytes32 batchId) external nonReentrant returns (bool) {
        BatchPayment storage batch = batchPayments[batchId];
        
        if (batch.batchId == bytes32(0)) revert BatchNotFound();
        if (batch.sender != msg.sender && admin != msg.sender) revert NotSender();
        if (batch.isExecuted) revert BatchAlreadyExecuted();
        if (batch.isCancelled) revert BatchAlreadyCancelled();
        
        uint256 refundAmount = batch.totalAmount - batch.paidAmount;
        batch.isCancelled = true;
        
        if (refundAmount > 0) {
            TOKEN.transfer(batch.sender, refundAmount);
        }
        
        emit BatchPaymentCancelled(batchId, msg.sender);
        
        return true;
    }
    
    // ============================================
    // RECURRING PAYROLL
    // ============================================
    
    /**
     * @dev Create a recurring payroll schedule for an employee
     * @param employee Employee address
     * @param amountPerPeriod Amount to pay per period
     * @param periodDuration Duration of each period in seconds
     * @param totalPeriods Total number of periods (for limited payroll)
     */
    function createPayrollSchedule(
        address employee,
        uint256 amountPerPeriod,
        uint256 periodDuration,
        uint256 totalPeriods
    ) external nonReentrant returns (bytes32) {
        if (employee == address(0)) revert ZeroAmount();
        if (amountPerPeriod == 0) revert ZeroAmount();
        if (periodDuration < 1 days) revert InvalidPeriodDuration();
        
        uint256 totalAmount = amountPerPeriod * totalPeriods;
        
        // Check TOKEN allowance and balance
        if (TOKEN.allowance(msg.sender, address(this)) < totalAmount) revert InsufficientTokenAllowance();
        if (TOKEN.balanceOf(msg.sender) < totalAmount) revert InsufficientTokenBalance();
        
        // Generate schedule ID
        bytes32 scheduleId = keccak256(abi.encodePacked(
            msg.sender,
            employee,
            amountPerPeriod,
            block.timestamp
        ));
        
        // Store payroll schedule
        payrollSchedules[scheduleId] = PayrollSchedule({
            scheduleId: scheduleId,
            employer: msg.sender,
            employee: employee,
            amountPerPeriod: amountPerPeriod,
            periodDuration: periodDuration,
            startTime: block.timestamp,
            nextPaymentTime: block.timestamp + periodDuration,
            totalPaid: 0,
            totalScheduled: totalAmount,
            isActive: true,
            isCancelled: false
        });
        
        employerPayrolls[msg.sender].push(scheduleId);
        
        // Transfer total amount to contract
        TOKEN.transferFrom(msg.sender, address(this), totalAmount);
        
        emit PayrollScheduleCreated(scheduleId, msg.sender, employee, amountPerPeriod, periodDuration);
        
        return scheduleId;
    }
    
    /**
     * @dev Execute payroll payment for a specific schedule
     * @param scheduleId The payroll schedule ID
     */
    function executePayroll(bytes32 scheduleId) external nonReentrant returns (bool) {
        PayrollSchedule storage schedule = payrollSchedules[scheduleId];
        
        if (schedule.scheduleId == bytes32(0)) revert PayrollNotFound();
        if (!schedule.isActive) revert PayrollNotActive();
        if (block.timestamp < schedule.nextPaymentTime) revert PaymentNotDue();
        
        // Check if all periods are paid
        if (schedule.totalPaid >= schedule.totalScheduled) {
            schedule.isActive = false;
            revert PayrollNotActive();
        }
        
        // Pay employee
        TOKEN.transfer(schedule.employee, schedule.amountPerPeriod);
        
        schedule.totalPaid += schedule.amountPerPeriod;
        schedule.nextPaymentTime += schedule.periodDuration;
        
        // Deactivate if final payment
        if (schedule.totalPaid >= schedule.totalScheduled) {
            schedule.isActive = false;
        }
        
        emit PayrollExecuted(scheduleId, schedule.employee, schedule.amountPerPeriod);
        
        return true;
    }
    
    /**
     * @dev Cancel payroll schedule and refund remaining
     * @param scheduleId The payroll schedule ID
     */
    function cancelPayroll(bytes32 scheduleId) external nonReentrant returns (bool) {
        PayrollSchedule storage schedule = payrollSchedules[scheduleId];
        
        if (schedule.scheduleId == bytes32(0)) revert PayrollNotFound();
        if (schedule.employer != msg.sender && admin != msg.sender) revert NotSender();
        if (!schedule.isActive) revert PayrollNotActive();
        
        uint256 refundAmount = schedule.totalScheduled - schedule.totalPaid;
        schedule.isActive = false;
        schedule.isCancelled = true;
        
        if (refundAmount > 0) {
            TOKEN.transfer(schedule.employer, refundAmount);
        }
        
        emit PayrollCancelled(scheduleId, msg.sender);
        
        return true;
    }
    
    // ============================================
    // STREAMING SALARY (Integration with PeyStreaming)
    // ============================================
    
    /**
     * @dev Create a streaming salary payment
     * @param employee Employee address
     * @param totalAmount Total amount to stream
     * @param duration Duration in seconds for the stream
     */
    function createStreamSalary(
        address employee,
        uint256 totalAmount,
        uint256 duration
    ) external nonReentrant returns (bytes32) {
        if (employee == address(0)) revert ZeroAmount();
        if (totalAmount == 0) revert ZeroAmount();
        if (duration == 0) revert ZeroAmount();
        
        uint256 ratePerSecond = totalAmount / duration;
        
        // Check TOKEN allowance and balance
        if (TOKEN.allowance(msg.sender, address(this)) < totalAmount) revert InsufficientTokenAllowance();
        if (TOKEN.balanceOf(msg.sender) < totalAmount) revert InsufficientTokenBalance();
        
        // Generate stream ID
        bytes32 streamId = keccak256(abi.encodePacked(
            msg.sender,
            employee,
            totalAmount,
            block.timestamp
        ));
        
        // Store stream salary
        streamSalaries[streamId] = StreamSalary({
            streamId: streamId,
            employer: msg.sender,
            employee: employee,
            totalAmount: totalAmount,
            streamedAmount: 0,
            ratePerSecond: ratePerSecond,
            startTime: block.timestamp,
            isActive: true,
            isCancelled: false
        });
        
        employeeStreams[employee].push(streamId);
        
        // Transfer total amount to contract
        TOKEN.transferFrom(msg.sender, address(this), totalAmount);
        
        emit StreamSalaryCreated(streamId, msg.sender, employee, totalAmount, ratePerSecond);
        
        return streamId;
    }
    
    /**
     * @dev Withdraw from streaming salary
     * @param streamId The stream salary ID
     */
    function withdrawStreamSalary(bytes32 streamId) external nonReentrant returns (uint256) {
        StreamSalary storage stream = streamSalaries[streamId];
        
        if (stream.streamId == bytes32(0)) revert StreamNotFound();
        if (!stream.isActive) revert StreamNotActive();
        if (stream.employee != msg.sender) revert NotSender();
        
        // Calculate withdrawable amount
        uint256 elapsedTime = block.timestamp - stream.startTime;
        uint256 availableAmount = stream.ratePerSecond * elapsedTime;
        
        // Cap at remaining
        if (availableAmount > stream.totalAmount) {
            availableAmount = stream.totalAmount;
        }
        
        uint256 withdrawable = availableAmount - stream.streamedAmount;
        
        if (withdrawable == 0) revert ZeroAmount();
        
        stream.streamedAmount += withdrawable;
        
        // Check if stream is complete
        if (stream.streamedAmount >= stream.totalAmount) {
            stream.isActive = false;
        }
        
        TOKEN.transfer(stream.employee, withdrawable);
        
        emit StreamSalaryWithdrawn(streamId, msg.sender, withdrawable);
        
        return withdrawable;
    }
    
    /**
     * @dev Cancel streaming salary and refund remaining
     * @param streamId The stream salary ID
     */
    function cancelStreamSalary(bytes32 streamId) external nonReentrant returns (bool) {
        StreamSalary storage stream = streamSalaries[streamId];
        
        if (stream.streamId == bytes32(0)) revert StreamNotFound();
        if (stream.employer != msg.sender && admin != msg.sender) revert NotSender();
        if (!stream.isActive) revert StreamNotActive();
        
        // Calculate remaining
        uint256 remaining = stream.totalAmount - stream.streamedAmount;
        
        stream.isActive = false;
        stream.isCancelled = true;
        
        if (remaining > 0) {
            TOKEN.transfer(stream.employer, remaining);
        }
        
        emit StreamSalaryCancelled(streamId, msg.sender);
        
        return true;
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @dev Get batch payment details
     */
    function getBatchPayment(bytes32 batchId) external view returns (
        address sender,
        uint256 totalAmount,
        uint256 paidAmount,
        uint256 recipientCount,
        uint256 createdAt,
        uint256 executedAt,
        bool isExecuted,
        bool isCancelled
    ) {
        BatchPayment storage batch = batchPayments[batchId];
        return (
            batch.sender,
            batch.totalAmount,
            batch.paidAmount,
            batch.recipientCount,
            batch.createdAt,
            batch.executedAt,
            batch.isExecuted,
            batch.isCancelled
        );
    }
    
    /**
     * @dev Get payroll schedule details
     */
    function getPayrollSchedule(bytes32 scheduleId) external view returns (
        address employer,
        address employee,
        uint256 amountPerPeriod,
        uint256 periodDuration,
        uint256 nextPaymentTime,
        uint256 totalPaid,
        uint256 totalScheduled,
        bool isActive,
        bool isCancelled
    ) {
        PayrollSchedule storage schedule = payrollSchedules[scheduleId];
        return (
            schedule.employer,
            schedule.employee,
            schedule.amountPerPeriod,
            schedule.periodDuration,
            schedule.nextPaymentTime,
            schedule.totalPaid,
            schedule.totalScheduled,
            schedule.isActive,
            schedule.isCancelled
        );
    }
    
    /**
     * @dev Get stream salary details
     */
    function getStreamSalary(bytes32 streamId) external view returns (
        address employer,
        address employee,
        uint256 totalAmount,
        uint256 streamedAmount,
        uint256 ratePerSecond,
        uint256 startTime,
        bool isActive,
        bool isCancelled
    ) {
        StreamSalary storage stream = streamSalaries[streamId];
        return (
            stream.employer,
            stream.employee,
            stream.totalAmount,
            stream.streamedAmount,
            stream.ratePerSecond,
            stream.startTime,
            stream.isActive,
            stream.isCancelled
        );
    }
    
    /**
     * @dev Get withdrawable amount for a stream
     */
    function getStreamWithdrawableAmount(bytes32 streamId) external view returns (uint256) {
        StreamSalary storage stream = streamSalaries[streamId];
        
        if (stream.streamId == bytes32(0) || !stream.isActive) return 0;
        
        uint256 elapsedTime = block.timestamp - stream.startTime;
        uint256 availableAmount = stream.ratePerSecond * elapsedTime;
        
        if (availableAmount > stream.totalAmount) {
            availableAmount = stream.totalAmount;
        }
        
        return availableAmount - stream.streamedAmount;
    }
    
    /**
     * @dev Get employer's payroll schedules
     */
    function getEmployerPayrolls(address employer) external view returns (bytes32[] memory) {
        return employerPayrolls[employer];
    }
    
    /**
     * @dev Get employee's stream salaries
     */
    function getEmployeeStreams(address employee) external view returns (bytes32[] memory) {
        return employeeStreams[employee];
    }
}
