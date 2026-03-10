# Peys Smart Contracts

This directory contains the PeysEscrow smart contracts for multi-chain magic link payments.

## Structure

```
contracts/
├── src/
│   └── PeysEscrow.sol      # Main escrow contract
├── test/
│   └── PeysEscrow.t.sol    # Foundry tests
├── script/
│   ├── Deploy.s.sol        # Polkadot deployment
│   ├── DeployCelo.s.sol    # Celo deployment
│   └── DeployBase.s.sol    # Base deployment
└── out/                    # Compiled artifacts (generated)
```

## Contract Features

- **Multi-chain compatible**: Works on any EVM-compatible chain
- **Magic link payments**: Create payments with claimable links
- **ERC20 support**: Supports USDC, USDT, and any ERC20 token
- **Time-locked refunds**: Automatic refunds after expiry
- **Gas efficient**: Optimized for low gas costs

## Functions

### `createPaymentExternal`
Creates a new payment with custom expiry time.

```solidity
function createPaymentExternal(
    address token,
    uint256 amount,
    bytes32 claimHash,
    uint256 expiry,
    string calldata memo
) external returns (bytes32 paymentId)
```

### `createPaymentWithDefaultExpiry`
Creates a payment with 7-day default expiry.

```solidity
function createPaymentWithDefaultExpiry(
    address token,
    uint256 amount,
    bytes32 claimHash,
    string calldata memo
) external returns (bytes32 paymentId)
```

### `claim`
Claims a payment using the secret hash.

```solidity
function claim(
    bytes32 paymentId,
    bytes32 secretHash,
    address recipient
) external onlyActivePayment(paymentId) returns (uint256)
```

### `refundAfterExpiry`
Refunds unclaimed payments after expiry time.

```solidity
function refundAfterExpiry(bytes32 paymentId) external
```

## Deployment

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Testing

Run Foundry tests:

```bash
forge test
```

Run with verbosity:

```bash
forge test -vv
```

## Verification

After deployment, verify the contract on the block explorer:

```bash
forge verify-contract <CONTRACT_ADDRESS> PeysEscrow --chain-id <CHAIN_ID>
```

## Security

- Audited for reentrancy attacks
- Uses Check-Effects-Interactions pattern
- Input validation on all parameters
- Access control on sensitive functions
