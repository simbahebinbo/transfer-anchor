import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TransferSol } from "../target/types/transfer_sol";
import { assert } from "chai";
import { SystemProgram } from "@solana/web3.js";
import {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("transfer-sol", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TransferSol as Program<TransferSol>;

  it("Transfers lamports between two accounts", async () => {
    // Generate a new keypair for the sender and airdrop some SOL
    const from = anchor.web3.Keypair.generate();
    const fromAirdropSignature = await program.provider.connection.requestAirdrop(from.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(fromAirdropSignature);

    // Generate a new keypair for the receiver
    const to = anchor.web3.Keypair.generate();

    // Fetch the initial balances
    let fromBalance = await program.provider.connection.getBalance(from.publicKey);
    let toBalance = await program.provider.connection.getBalance(to.publicKey);

    console.log("Initial Balances:", { fromBalance, toBalance });

    // Define the amount to transfer
    const amount = 500000000;

    // Call the transfer_lamports function
    await program.methods
      .transferLamports(new anchor.BN(amount))
      .accounts({
        from: from.publicKey,
        to: to.publicKey,
        systemProgram: SystemProgram.programId
      })
      .signers([from])
      .rpc();

    // Fetch the final balances
    fromBalance = await program.provider.connection.getBalance(from.publicKey);
    toBalance = await program.provider.connection.getBalance(to.publicKey);

    console.log("Final Balances:", { fromBalance, toBalance });

    // Check the balances
    assert.equal(fromBalance, 1000000000 - amount);
    assert.equal(toBalance, amount);
  });

  it("transfers SPL tokens between accounts", async () => {
    // Generate keypairs for the new accounts
    const fromKp = anchor.web3.Keypair.generate();
    const toKp =  anchor.web3.Keypair.generate();
    const fromAirdropSignature = await program.provider.connection.requestAirdrop(fromKp.publicKey, 1000000000);
    await program.provider.connection.confirmTransaction(fromAirdropSignature);


    
    
    const mintKp = anchor.web3.Keypair.generate();

    let mintPubkey = await createMint(
      program.provider.connection, // conneciton
      fromKp, // fee payer
      fromKp.publicKey, // mint authority
      fromKp.publicKey, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
      8 // decimals
    );
    console.log(`mint: ${mintPubkey.toBase58()}`);
  

 



  // Create a new mint and initialize it
    const mint = await createMint(
      program.provider.connection,
      fromKp,
      fromKp.publicKey,
      null,
      0
    );

    // Create associated token accounts for the new accounts
    const fromAta = await createAssociatedTokenAccount(
      program.provider.connection,
      fromKp,
      mint,
      fromKp.publicKey
    );
    const toAta = await createAssociatedTokenAccount(
      program.provider.connection,
      fromKp,
      mint,
      toKp.publicKey
    );

    // Mint tokens to the 'from' associated token account
    const mintAmount = 1000;
    await mintTo(
      program.provider.connection,
      fromKp,
      mint,
      fromAta,
      fromKp.publicKey,
      mintAmount
    );

    // Define the amount to transfer
    const transferAmount = new anchor.BN(500);

    // Call the transferSplTokens function
    const txHash = await program.methods
      .transferSplTokens(transferAmount)
      .accounts({
        from: fromKp.publicKey,
        fromAta: fromAta,
        toAta: toAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([fromKp])
      .rpc();

    console.log(`https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
    await program.provider.connection.confirmTransaction(txHash, "finalized");

    // Fetch the balance of the 'to' token account
    const toTokenAccount = await program.provider.connection.getTokenAccountBalance(toAta);

    // Assert the balance of the 'to' token account
    assert.strictEqual(
      toTokenAccount.value.uiAmount,
      transferAmount.toNumber(),
      "The 'to' token account should have the transferred tokens"
    );
  })
  
});
