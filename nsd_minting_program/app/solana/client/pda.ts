import {PublicKey} from "@solana/web3.js";
import BN from "bn.js";

export const deriveNsdConfigPDA = (programId: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("nsd_config"),
        ],
        programId,
    )
};

export type NsdTokenSeeds = {
    mint: PublicKey, 
};

export const deriveNsdTokenPDA = (
    seeds: NsdTokenSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("nsd_token"),
            seeds.mint.toBuffer(),
        ],
        programId,
    )
};

export type NsdUserSeeds = {
    user: PublicKey, 
};

export const deriveNsdUserPDA = (
    seeds: NsdUserSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("nsd_user"),
            seeds.user.toBuffer(),
        ],
        programId,
    )
};

export type NsdTokenMetadataSeeds = {
    mint: PublicKey, 
};

export const deriveNsdTokenMetadataPDA = (
    seeds: NsdTokenMetadataSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("metadata"),
            seeds.mint.toBuffer(),
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

