// Wallet adapter
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// Stores
import useUserNFTStore from "stores/useWalletTokenAccountStore";
// Solana Web3
import {
  Keypair,
  SystemProgram,
  Transaction,
  TransactionSignature,
  ConfirmOptions,
  PublicKey,
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, NATIVE_MINT } from "@solana/spl-token";
// React
import { FC, useCallback, useEffect } from "react";
// IDL
import idl from "../utils/fortune.json";
// Utils
import { notify } from "../utils/notifications";
// Anchor
import { Program, Provider, BN } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";

// Create a new stochastic pool
export const CreatePool = ({ props }) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const wallet = useWallet();
  const programId = new PublicKey(idl.metadata.address);

  // Provider
  const opts = { preflightCommitment: "processed" };
  const provider = new Provider(
    connection,
    wallet,
    opts.preflightCommitment as ConfirmOptions
  );
  // Program
  const program = new Program(idl as anchor.Idl, programId, provider);

  // Store
  const { getWalletTokenAccounts } = useUserNFTStore();

  const onClick = useCallback(async () => {
    console.log(props);
    if (!publicKey) {
      notify({ type: "error", message: `Wallet not connected!` });
      console.log("error", `Send Transaction: Wallet not connected!`);
      return;
    }

    let signature: TransactionSignature = "";

    try {
      // Initial pool assets
      const splAmount = new anchor.BN(
        LAMPORTS_PER_SOL * Number(props.solAmount)
      );
      const ptokenAmount = new anchor.BN(Number(props.ptokenAmount));
      let nftAccount = new PublicKey(props.pubkey);
      const probPool = Keypair.generate();
      let nftMint = new PublicKey(props.mint);

      // ptoken mint PDA
      let [ptokenMint, ptokenMintBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("mint")),
          probPool.publicKey.toBuffer(),
        ],
        program.programId
      );
      // nft vault pda
      let [nftVault, nftVaultBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
          nftMint.toBuffer(),
          probPool.publicKey.toBuffer(),
        ],
        program.programId
      );
      // Fortune state
      let [state, stateBump] = await PublicKey.findProgramAddress(
        [Buffer.from(anchor.utils.bytes.utf8.encode("fortune"))],
        program.programId
      );
      // ptoken vault PDA
      let [ptokenVault, ptokenVaultBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
          ptokenMint.toBuffer(),
          probPool.publicKey.toBuffer(),
        ],
        program.programId
      );
      // SPL vault PDA
      let [splVault, splVaultBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
          NATIVE_MINT.toBuffer(),
          probPool.publicKey.toBuffer(),
        ],
        program.programId
      );

      const signature = await program.rpc.createPool(splAmount, ptokenAmount, {
        accounts: {
          signer: publicKey,
          nftAccount: nftAccount,
          probPool: probPool.publicKey,
          ptokenMint: ptokenMint,
          nftVault: nftVault,
          lamportVault: splVault,
          ptokenVault: ptokenVault,
          nftMint: nftMint,
          nativeMint: NATIVE_MINT,
          state: state,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [probPool],
      });
      getWalletTokenAccounts(publicKey, connection);
      await connection.confirmTransaction(signature, "confirmed");
      notify({
        type: "success",
        message: "Transaction successful!",
        txid: signature,
      });
    } catch (error: any) {
      console.log(error);
      notify({
        type: "error",
        message: `Transaction failed!`,
        description: error?.message,
        txid: signature,
      });
      console.log("error", `Transaction failed! ${error?.message}`, signature);
      return;
    }
  }, [publicKey, notify, connection]);

  return (
    <button
      className="p-2 bg-black text-pink pl-8 pr-8 font-bold shadow-xl shadow-pink hover:brightness-200 border-pink border-2"
      onClick={onClick}
    >
      <span className="block group-disabled:hidden">Create Pool</span>
    </button>
  );
};
