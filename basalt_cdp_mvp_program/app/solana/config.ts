/// <reference types="vite/client" />
import { PublicKey } from "@solana/web3.js";

// Default to Devnet. Override via VITE_RPC_URL
export const RPC_URL: string = import.meta.env.VITE_RPC_URL || "https://api.devnet.solana.com";

// Program ID from Anchor-generated types (target/types/basalt_cdp_mvp.ts)
export const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID || "8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3"
);

// Collateral and USD_RW mint addresses: MUST be provided via env for real use
export const COLLATERAL_MINT = (() => {
  const v = import.meta.env.VITE_COLLATERAL_MINT as string | undefined;
  return v ? new PublicKey(v) : null;
})();

export const USDRW_MINT = (() => {
  const v = import.meta.env.VITE_USDRW_MINT as string | undefined;
  return v ? new PublicKey(v) : null;
})();

// Optional admin; used for protocol initialization UX gating
export const PROTOCOL_ADMIN = (() => {
  const v = import.meta.env.VITE_PROTOCOL_ADMIN as string | undefined;
  return v ? new PublicKey(v) : null;
})();

// If decimals differ, override via env vars
export const COLLATERAL_DECIMALS: number = Number(import.meta.env.VITE_COLLATERAL_DECIMALS || 9);
export const USDRW_DECIMALS: number = Number(import.meta.env.VITE_USDRW_DECIMALS || 6);

export function toU64Le(amount: number | string, decimals: number): Buffer {
  const n = typeof amount === "string" ? Number(amount) : amount;
  const scaled = BigInt(Math.round(n * 10 ** decimals));
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(scaled);
  return buf;
}