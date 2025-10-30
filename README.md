# Basalt Protocol  
Safe, Cheap RWA-Backed Leverage on Solana

---

## Table of Contents
- [Overview](#overview)  
- [Features](#features)  
- [Mechanics](#mechanics)  
  - [Peg](#peg)  
  - [Minting](#minting)  
  - [Liquidation](#liquidation)  
  - [Fees](#fees)  
- [Competitive Positioning](#competitive-positioning)  
- [User Stories](#user-stories)  
- [Getting Started](#getting-started)  
- [Contributing & License](#contributing--license)  

---

## Overview
Basalt (USDrw) is a collateralized stablecoin built on Solana, designed to unlock safe and efficient leverage using Real-World Assets (RWAs).  
Users deposit tokenized S&P 500 ETFs (SPYx) as collateral and mint USDrw, enabling capital efficiency while maintaining exposure to traditional market assets.  

Basalt addresses two structural issues in current CDP protocols:
1. High liquidation risk from volatile crypto collateral.  
2. Capital inefficiency of tokenized RWAs that cannot otherwise be leveraged.  

---

## Features
- **Dollar Peg:** USDrw maintains a strict $1.00 peg through mint/redeem arbitrage.  
- **RWA Collateral:** Backed by tokenized S&P 500 ETFs (SPYx).  
- **High Efficiency:** Loan-to-Value (LTV) ratios up to 90%.  
- **Risk Controls:** Oracle-based pricing with circuit breakers for stale data.  
- **Low Stability Fees:** Minimal borrowing costs due to low-risk collateral.  

---

## Mechanics

### Peg
- USDrw is pegged 1:1 to the U.S. Dollar.  
- Maintained by mint/redeem arbitrage against overcollateralized vaults.  

### Minting
- Users deposit SPYx tokens into Basalt vaults.  
- Up to the vault’s LTV limit, USDrw can be minted.  
- Example: Deposit $1,000 SPYx → mint up to $900 USDrw (90% LTV).  

### Liquidation
- Triggered when collateral value falls below the liquidation threshold.  
- Liquidators repay USDrw and seize collateral.  
- Protocol uses oracle pricing with circuit breakers during market closures.  

### Fees
- Revenue is derived exclusively from Stability Fees (interest on outstanding USDrw debt).  
- Low fixed-rate fees maximize borrowing demand while ensuring protocol sustainability.  

---

## Competitive Positioning

| Protocol            | Peg Target | Collateral Type       | LTV       | Positioning                                      |
|---------------------|------------|-----------------------|-----------|--------------------------------------------------|
| **Basalt (USDrw)**  | $1.00      | SPYx (RWA)            | High (≤90%) | Activates Solana-native RWA capital.             |
| Hubble (USDH)       | $1.00      | Volatile crypto (SOL, ETH) | Medium    | For leveraging volatile assets, high liquidation risk. |
| MakerDAO / Sky (DAI/USDS) | $1.00 | Mixed crypto + RWAs   | Medium/High | Asset mix, savings focus, higher volatility risk. |

---

## User Stories

**1. The Volatility Tamer**  
- Portfolio concentrated in volatile crypto (BTC, SOL).  
- Buys SPYx, deposits into Basalt, mints USDrw at 70% LTV.  
- Gains Solana exposure while stabilizing portfolio risk with SPYx.  

**2. The Capital Maximizer**  
- DAO treasury holds $500k in tokenized S&P 500 ETFs.  
- Deposits SPYx, mints $375k USDrw at 75% LTV.  
- Unlocks liquidity for new initiatives without selling core holdings.  

---

## Getting Started

### Repository Setup
```bash
# Clone the repo
git clone https://github.com/<org>/basalt-protocol.git
cd basalt-protocol

# Install dependencies
npm install   # or yarn install

# Build
npm run build

# Run tests
npm test
