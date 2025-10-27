import { PublicKey } from "@solana/web3.js";

export function findProtocolConfigPda(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([
    Buffer.from("protocol_config")
  ], programId);
}

export function findUserVaultPda(user: PublicKey, protocolConfig: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([
    Buffer.from("vault"),
    user.toBuffer(),
    protocolConfig.toBuffer()
  ], programId);
}

export function findProtocolCollateralAccountPda(protocolConfig: PublicKey, programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([
    Buffer.from("collateral_vault"),
    protocolConfig.toBuffer()
  ], programId);
}