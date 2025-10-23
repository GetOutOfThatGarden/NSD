import {PublicKey} from "@solana/web3.js";
import BN from "bn.js";

export const deriveProtocolConfigPDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("protocol_config"),
        ],
        programId,
    )
};

export type UserVaultSeeds = {
    user: PublicKey, 
};

export const deriveUserVaultPDA = (
    seeds: UserVaultSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("vault"),
            seeds.user.toBuffer(),
        ],
        programId,
    )
};

export const deriveVaultAuthorityPDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("vault_authority"),
        ],
        programId,
    )
};

export module TokenProgramPDAs {
    export type AccountSeeds = {
        wallet: PublicKey, 
        tokenProgram: PublicKey, 
        mint: PublicKey, 
    };
    
    export const deriveAccountPDA = (
        seeds: AccountSeeds,
        programId: PublicKey
    ): [PublicKey, number] => {
        return PublicKey.findProgramAddressSync(
            [
                seeds.wallet.toBuffer(),
                seeds.tokenProgram.toBuffer(),
                seeds.mint.toBuffer(),
            ],
            programId,
        )
    };
    
}

