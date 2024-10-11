use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("AMXANSzuTYvXaYEC3Hwbn3Nx2fiGJFj9LEzXvVXvRQFX");

#[program]
pub mod transfer {
    use super::*;

    pub fn transfer_sol(ctx: Context<TransferSOL>, amount: u64) -> Result<()> {
        let from_account = &ctx.accounts.from;
        let to_account = &ctx.accounts.to;

        // Create the transfer instruction
        let transfer_instruction =
            anchor_lang::solana_program::system_instruction::transfer(from_account.key, to_account.key, amount);

        // Invoke the transfer instruction
        anchor_lang::solana_program::program::invoke_signed(
            &transfer_instruction,
            &[
                from_account.to_account_info(),
                to_account.clone(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[],
        )?;

        Ok(())
    }

    pub fn transfer_spl(ctx: Context<TransferSPL>, amount: u64) -> Result<()> {
        let destination = &ctx.accounts.to_ata;
        let source = &ctx.accounts.from_ata;
        let token_program = &ctx.accounts.token_program;
        let authority = &ctx.accounts.from;

        // Transfer tokens from taker to initializer
        let cpi_accounts = anchor_spl::token::Transfer {
            from: source.to_account_info().clone(),
            to: destination.to_account_info().clone(),
            authority: authority.to_account_info().clone(),
        };
        let cpi_program = token_program.to_account_info();

        token::transfer(
            CpiContext::new(cpi_program, cpi_accounts),
            amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct TransferSOL<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub to: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferSPL<'info> {
    pub from: Signer<'info>,
    #[account(mut)]
    pub from_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
