// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PeyStreaming is ReentrancyGuard {
    IERC20 public immutable token;
    
    struct Stream {
        address sender;
        address recipient;
        uint256 totalAmount;
        uint256 streamedAmount;
        uint256 ratePerSecond;
        uint256 startTime;
        uint256 stopTime;
        bool isActive;
        bool isCancelled;
    }
    
    mapping(bytes32 => Stream) public streams;
    bytes32[] public streamIds;
    
    event StreamCreated(
        bytes32 indexed streamId,
        address indexed sender,
        address indexed recipient,
        uint256 totalAmount,
        uint256 ratePerSecond,
        uint256 startTime,
        uint256 stopTime
    );
    
    event StreamPaused(bytes32 indexed streamId);
    event StreamResumed(bytes32 indexed streamId);
    event StreamCancelled(bytes32 indexed streamId);
    event StreamClaimed(
        bytes32 indexed streamId,
        address indexed recipient,
        uint256 amount
    );
    
    constructor(address _token) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
    }
    
    function createStream(
        address _recipient,
        uint256 _totalAmount,
        uint256 _ratePerSecond,
        uint256 _durationSeconds
    ) external returns (bytes32 streamId) {
        require(_recipient != address(0), "Invalid recipient");
        require(_totalAmount > 0, "Amount must be > 0");
        require(_ratePerSecond > 0, "Rate must be > 0");
        require(_durationSeconds > 0, "Duration must be > 0");
        
        // Transfer tokens from sender
        require(
            token.transferFrom(msg.sender, address(this), _totalAmount),
            "Token transfer failed"
        );
        
        streamId = keccak256(
            abi.encodePacked(
                msg.sender,
                _recipient,
                _totalAmount,
                _ratePerSecond,
                block.timestamp
            )
        );
        
        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: _recipient,
            totalAmount: _totalAmount,
            streamedAmount: 0,
            ratePerSecond: _ratePerSecond,
            startTime: block.timestamp,
            stopTime: block.timestamp + _durationSeconds,
            isActive: true,
            isCancelled: false
        });
        
        streamIds.push(streamId);
        
        emit StreamCreated(
            streamId,
            msg.sender,
            _recipient,
            _totalAmount,
            _ratePerSecond,
            block.timestamp,
            block.timestamp + _durationSeconds
        );
    }
    
    function claimStream(bytes32 _streamId) external nonReentrant {
        Stream storage stream = streams[_streamId];
        require(stream.recipient == msg.sender, "Not recipient");
        require(stream.isActive, "Stream not active");
        require(!stream.isCancelled, "Stream cancelled");
        
        uint256 availableAmount = getAvailableStreamAmount(_streamId);
        require(availableAmount > 0, "Nothing to claim");
        
        stream.streamedAmount += availableAmount;
        
        require(
            token.transfer(msg.sender, availableAmount),
            "Token transfer failed"
        );
        
        // Check if stream is complete
        if (stream.streamedAmount >= stream.totalAmount || block.timestamp >= stream.stopTime) {
            stream.isActive = false;
        }
        
        emit StreamClaimed(_streamId, msg.sender, availableAmount);
    }
    
    function pauseStream(bytes32 _streamId) external {
        Stream storage stream = streams[_streamId];
        require(stream.sender == msg.sender, "Not sender");
        require(stream.isActive, "Stream not active");
        
        stream.isActive = false;
        
        emit StreamPaused(_streamId);
    }
    
    function resumeStream(bytes32 _streamId) external {
        Stream storage stream = streams[_streamId];
        require(stream.sender == msg.sender, "Not sender");
        require(!stream.isActive, "Already active");
        require(!stream.isCancelled, "Stream cancelled");
        
        stream.isActive = true;
        
        emit StreamResumed(_streamId);
    }
    
    function cancelStream(bytes32 _streamId) external nonReentrant {
        Stream storage stream = streams[_streamId];
        require(stream.sender == msg.sender, "Not sender");
        require(!stream.isCancelled, "Already cancelled");
        
        uint256 availableAmount = getAvailableStreamAmount(_streamId);
        uint256 refundAmount = stream.totalAmount - stream.streamedAmount;
        
        stream.isCancelled = true;
        stream.isActive = false;
        
        // Refund remaining tokens to sender
        if (refundAmount > 0) {
            require(
                token.transfer(msg.sender, refundAmount),
                "Refund failed"
            );
        }
        
        emit StreamCancelled(_streamId);
    }
    
    function getAvailableStreamAmount(bytes32 _streamId) public view returns (uint256) {
        Stream storage stream = streams[_streamId];
        
        if (!stream.isActive || stream.isCancelled) {
            return 0;
        }
        
        uint256 elapsedTime = block.timestamp > stream.stopTime 
            ? stream.stopTime - stream.startTime 
            : block.timestamp - stream.startTime;
        
        uint256 totalStreamed = elapsedTime * stream.ratePerSecond;
        
        if (totalStreamed <= stream.streamedAmount) {
            return 0;
        }
        
        uint256 available = totalStreamed - stream.streamedAmount;
        
        // Cap at remaining amount
        if (available > stream.totalAmount - stream.streamedAmount) {
            available = stream.totalAmount - stream.streamedAmount;
        }
        
        return available;
    }
    
    function getStreamCount() external view returns (uint256) {
        return streamIds.length;
    }
    
    function getStreamsBySender(address _sender) external view returns (bytes32[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < streamIds.length; i++) {
            if (streams[streamIds[i]].sender == _sender) {
                count++;
            }
        }
        
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < streamIds.length; i++) {
            if (streams[streamIds[i]].sender == _sender) {
                result[index++] = streamIds[i];
            }
        }
        
        return result;
    }
}
