# NSD Minting Program

This is a Solana program for minting and managing NSD tokens. It provides functionality for initializing configurations, minting tokens, updating configurations, and setting token metadata.

## Features

- Initialize NSD minting configuration
- Mint NSD tokens for users
- Update minting configuration (max supply, price, active status)
- Set token metadata (name, symbol, URI)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://book.anchor-lang.com/getting_started/installation.html)
- [Node.js](https://nodejs.org/en/download/)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Running Locally

1. Start a local Solana cluster:
   ```bash
   solana-test-validator
   ```

2. Deploy the program:
   ```bash
   anchor deploy
   ```

3. Run tests:
   ```bash
   anchor test
   ```

## Program Instructions

### 1. Initialize Config
Initializes the NSD minting configuration.

**Accounts:**
- `fee_payer` - Writable, signer
- `config` - Writable
- `admin` - Signer
- `system_program` - System program

**Data:**
- `token_mint` - Mint address for NSD token
- `max_supply` - Maximum supply of NSD tokens
- `mint_price` - Price per NSD token in lamports

### 2. Mint Tokens
Mints NSD tokens for a user.

**Accounts:**
- `fee_payer` - Writable, signer
- `config` - Writable
- `user_token_account` - Writable
- `user` - Signer
- `user_account` - Writable
- `token_mint` - Mint
- `system_program` - System program
- `mint` - Mint
- `assoc_token_account` - Token account
- `owner` - Signer
- `wallet` - Wallet address
- `token_program` - SPL Token program

**Data:**
- `mint_amount` - Number of tokens to mint

### 3. Update Config
Updates the NSD minting configuration.

**Accounts:**
- `fee_payer` - Writable, signer
- `config` - Writable
- `admin` - Signer

**Data:**
- `max_supply` - New maximum supply (optional)
- `mint_price` - New mint price (optional)
- `is_active` - New active status (optional)

### 4. Set Token Metadata
Sets metadata for NSD tokens.

**Accounts:**
- `fee_payer` - Writable, signer 
- `config` - Writable
- `metadata` - Writable
- `admin` - Signer
- `system_program` - System program

**Data:**
- `token_mint` - Mint address for NSD token
- `name` - Name of the token
- `symbol` - Symbol of the token
- `uri` - URI for token metadata

## Testing

To run tests:
```bash
anchor test
```

## Frontend Integration

The frontend can interact with this program using the `useProgram` hook located in `app/solana/useProgram.ts`.

## Deployment

To deploy to a testnet or mainnet:
1. Update `Anchor.toml` with the correct cluster configuration
2. Run `anchor deploy --provider.cluster <cluster>`