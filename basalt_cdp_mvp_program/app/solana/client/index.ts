import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { createSolanaConnection, defaultConnection } from '../connection';
import { SOLANA_CONFIG } from '../config';

export const PROGRAM_ID = new PublicKey('8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3');

export const getProgram = (
  connection: Connection = defaultConnection, 
  wallet: any
): Program<any> => {
  const provider = new AnchorProvider(
    connection, 
    wallet, 
    {
      ...AnchorProvider.defaultOptions(),
      commitment: SOLANA_CONFIG.commitment,
      preflightCommitment: SOLANA_CONFIG.commitment,
    }
  );
  const program = new Program<any>(
    IDL,
    provider
  );
  return program;
};

/**
 * Create a program instance with a specific connection
 * Useful for testing or connecting to different clusters
 */
export const createProgram = (
  cluster: 'devnet' | 'testnet' | 'mainnet-beta' | 'localnet',
  wallet: any
): Program<any> => {
  const connection = createSolanaConnection(cluster);
  return getProgram(connection, wallet);
};

export const getVaultPda = (user: PublicKey, protocolConfig: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), user.toBuffer(), protocolConfig.toBuffer()],
    PROGRAM_ID
  );
};

export const getProtocolConfigPda = (): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('protocol_config')],
    PROGRAM_ID
  );
};

export const getCollateralVaultPda = (protocolConfig: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('collateral_vault'), protocolConfig.toBuffer()],
    PROGRAM_ID
  );
};

// IDL (Interface Definition Language) for the program
export const IDL = {
  "version": "0.1.0",
  "name": "basalt_cdp_mvp",
  "instructions": [
    {
      "name": "initializeProtocol",
      "accounts": [
        {
          "name": "owner",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "protocolConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collateralMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "usdrwMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "collateralMint",
          "type": "publicKey"
        },
        {
          "name": "usdrwMint",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "mintUsdrw",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "protocolConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userUsdrwAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "usdrwMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "redeemCollateral",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "protocolConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userUsdrwAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "usdrwMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "liquidateVault",
      "accounts": [
        {
          "name": "liquidator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "protocolConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "liquidatorCollateralAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "usdrwMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "vault",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "calculateInterest",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "protocolConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "ProtocolConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "collateralMint",
            "type": "publicKey"
          },
          {
            "name": "usdrwMint",
            "type": "publicKey"
          },
          {
            "name": "collateralRatio",
            "type": "u64"
          },
          {
            "name": "interestRate",
            "type": "u64"
          },
          {
            "name": "liquidationThreshold",
            "type": "u64"
          },
          {
            "name": "lastInterestUpdate",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UserVault",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "publicKey"
          },
          {
            "name": "protocolConfig",
            "type": "publicKey"
          },
          {
            "name": "collateralAmount",
            "type": "u64"
          },
          {
            "name": "debtAmount",
            "type": "u64"
          },
          {
            "name": "lastInterestUpdate",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InsufficientCollateralRatio",
      "msg": "Insufficient collateral ratio"
    },
    {
      "code": 6001,
      "name": "Undercollateralized",
      "msg": "Vault is undercollateralized"
    },
    {
      "code": 6002,
      "name": "VaultAlreadyLiquidated",
      "msg": "Vault is already liquidated"
    },
    {
      "code": 6003,
      "name": "ExceedsMintLimit",
      "msg": "Mint amount exceeds allowed limit"
    },
    {
      "code": 6004,
      "name": "ExceedsDebt",
      "msg": "Redeem amount exceeds debt"
    },
    {
      "code": 6005,
      "name": "BelowMinimumCollateral",
      "msg": "Collateral amount below minimum"
    },
    {
      "code": 6006,
      "name": "MaxVaultsExceeded",
      "msg": "Maximum vaults per user exceeded"
    },
    {
      "code": 6007,
      "name": "NoDebtToRedeem",
      "msg": "Vault has no debt to redeem"
    },
    {
      "code": 6008,
      "name": "NoCollateralToLiquidate",
      "msg": "Vault has no collateral to liquidate"
    },
    {
      "code": 6009,
      "name": "NotUndercollateralized",
      "msg": "Vault is not undercollateralized"
    },
    {
      "code": 6010,
      "name": "InterestCalculationFailed",
      "msg": "Interest calculation failed"
    },
    {
      "code": 6011,
      "name": "ProtocolNotInitialized",
      "msg": "Protocol not initialized"
    },
    {
      "code": 6012,
      "name": "VaultNotFound",
      "msg": "Vault not found"
    },
    {
      "code": 6013,
      "name": "CannotLiquidateOwnVault",
      "msg": "Cannot liquidate your own vault"
    },
    {
      "code": 6014,
      "name": "InsufficientCollateralForMint",
      "msg": "Insufficient collateral for minting"
    }
  ]
};