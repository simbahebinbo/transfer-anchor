import * as anchor from "@coral-xyz/anchor";
import {Transfer} from "../target/types/transfer";
import {assert} from "chai";
import {createAssociatedTokenAccount, createMint, mintTo, TOKEN_PROGRAM_ID} from "@solana/spl-token";

describe("transfer", () => {
    // Configure the client to use the local cluster.
    let provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Transfer as anchor.Program<Transfer>;

    it("Transfer SOL between two accounts", async () => {
        // Generate a new keypair for the sender and airdrop some SOL
        const fromKp = anchor.web3.Keypair.generate();

        const airdrop_tx = await provider.connection.requestAirdrop(fromKp.publicKey, 1000000000);

        // 获取最新的区块哈希
        const latestBlockHash = await provider.connection.getLatestBlockhash();

        // 确认每个空投交易
        await provider.connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: airdrop_tx
        }).then((confirmation) => {
            console.log(`Airdrop to ${fromKp.publicKey.toBase58()} confirmed`, confirmation);
            return confirmation;
        }).catch((error) => {
            console.error(`Error confirming airdrop to ${fromKp.publicKey.toBase58()}`, error);
            throw error;
        })

        // Generate a new keypair for the receiver
        const toKp = anchor.web3.Keypair.generate();

        // Fetch the initial balances
        let fromInitialBalance = await provider.connection.getBalance(fromKp.publicKey);
        let toInitialBalance = await provider.connection.getBalance(toKp.publicKey);

        console.log("Initial Balances:", {fromInitialBalance, toInitialBalance});

        // Define the amount to transfer
        const amount = 500000000;

        // Call the transfer_sol function
        // @ts-ignore
        await program.methods
            .transferSol(new anchor.BN(amount))
            .accounts({
                from: fromKp.publicKey,
                to: toKp.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId
            })
            .signers([fromKp])
            .rpc();

        // Fetch the final balances
        let fromFinalBalance = await provider.connection.getBalance(fromKp.publicKey);
        let toFinalBalance = await provider.connection.getBalance(toKp.publicKey);

        console.log("Final Balances:", {fromFinalBalance, toFinalBalance});

        // Check the balances
        assert.equal(fromFinalBalance, 1000000000 - amount);
        assert.equal(toFinalBalance, amount);
    });

    it("Transfer SPL between accounts", async () => {
        // Generate keypairs for the new accounts
        const fromKp = anchor.web3.Keypair.generate();
        const toKp = anchor.web3.Keypair.generate();
        const airdrop_tx = await provider.connection.requestAirdrop(fromKp.publicKey, 1000000000);

        // 获取最新的区块哈希
        const latestBlockHash = await provider.connection.getLatestBlockhash();

        // 确认每个空投交易
        await provider.connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: airdrop_tx
        }).then((confirmation) => {
            console.log(`Airdrop to ${fromKp.publicKey.toBase58()} confirmed`, confirmation);
            return confirmation;
        }).catch((error) => {
            console.error(`Error confirming airdrop to ${fromKp.publicKey.toBase58()}`, error);
            throw error;
        })

        const mintKp = anchor.web3.Keypair.generate();

        let mintPubkey = await createMint(
            provider.connection, // conneciton
            fromKp, // fee payer
            fromKp.publicKey, // mint authority
            fromKp.publicKey, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
            8 // decimals
        );
        console.log(`mint: ${mintPubkey.toBase58()}`);


        // Create a new mint and initialize it
        const mint = await createMint(
            provider.connection,
            fromKp,
            fromKp.publicKey,
            null,
            0
        );

        // Create associated token accounts for the new accounts
        const fromAta = await createAssociatedTokenAccount(
            provider.connection,
            fromKp,
            mint,
            fromKp.publicKey
        );
        const toAta = await createAssociatedTokenAccount(
            provider.connection,
            fromKp,
            mint,
            toKp.publicKey
        );

        // Mint tokens to the 'from' associated token account
        const mintAmount = 1000;
        await mintTo(
            provider.connection,
            fromKp,
            mint,
            fromAta,
            fromKp.publicKey,
            mintAmount
        );

        // Define the amount to transfer
        const transferAmount = new anchor.BN(500);

        // Call the transferSplTokens function
        await program.methods
            .transferSpl(transferAmount)
            .accounts({
                from: fromKp.publicKey,
                fromAta: fromAta,
                toAta: toAta,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .signers([fromKp])
            .rpc();

        // Fetch the balance of the 'to' token account
        const toTokenAccount = await provider.connection.getTokenAccountBalance(toAta);

        // Assert the balance of the 'to' token account
        assert.equal(
            toTokenAccount.value.uiAmount,
            transferAmount.toNumber(),
            "The 'to' token account should have the transferred tokens"
        );
    })
});
