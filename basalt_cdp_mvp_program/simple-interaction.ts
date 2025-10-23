/**
 * Simple Program Interaction Example
 * This shows you how to interact with your Basalt CDP program
 */

import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Program configuration
const PROGRAM_ID = new PublicKey("8S5e9SrQyDgWvtXaaEpKLyoC46QEqBuDP9xjdx8K5az3");
const RPC_URL = "http://127.0.0.1:8899"; // Localnet

async function main() {
    console.log("🚀 Starting Basalt CDP Program Interaction");
    console.log("=" .repeat(50));

    try {
        // 1. Connect to localnet
        const connection = new Connection(RPC_URL, "confirmed");
        console.log("✅ Connected to localnet");

        // 2. Create a demo wallet (avoiding fs import issues)
        const demoWallet = Keypair.generate();
        console.log(`👛 Demo Wallet: ${demoWallet.publicKey.toString()}`);

        // 3. Airdrop SOL to demo wallet
        console.log("💸 Requesting airdrop...");
        const airdropSignature = await connection.requestAirdrop(
            demoWallet.publicKey,
            2 * LAMPORTS_PER_SOL
        );
        await connection.confirmTransaction(airdropSignature);

        // 4. Check wallet balance
        const balance = await connection.getBalance(demoWallet.publicKey);
        console.log(`💰 Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

        // 5. Check program info
        const programInfo = await connection.getAccountInfo(PROGRAM_ID);
        if (programInfo) {
            console.log("📋 Program Info:");
            console.log(`   - Executable: ${programInfo.executable}`);
            console.log(`   - Data Length: ${programInfo.data.length} bytes`);
            console.log(`   - Owner: ${programInfo.owner.toString()}`);
            console.log(`   - Lamports: ${programInfo.lamports}`);
        }

        // 6. Check current slot (network activity)
        const slot = await connection.getSlot();
        console.log(`🔄 Current Slot: ${slot}`);

        // 7. Create a test account to demonstrate interaction
        console.log("\n🧪 Creating test account...");
        const testAccount = Keypair.generate();
        console.log(`   Test Account: ${testAccount.publicKey.toString()}`);

        // 8. Airdrop to test account
        const testAirdropSignature = await connection.requestAirdrop(
            testAccount.publicKey,
            LAMPORTS_PER_SOL
        );
        await connection.confirmTransaction(testAirdropSignature);
        
        const testBalance = await connection.getBalance(testAccount.publicKey);
        console.log(`   Test Balance: ${testBalance / LAMPORTS_PER_SOL} SOL`);

        console.log("\n✨ Program interaction demo completed!");
        console.log("\n📝 Next Steps:");
        console.log("   1. Use 'anchor test' to run full tests");
        console.log("   2. Call specific program functions");
        console.log("   3. Monitor program logs with 'solana logs'");

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// Run the demo
main().catch(console.error);