// React
import { FC, useEffect } from "react";
// Components
import { NFTCard } from "components/NFTCard";
// Stores
import useUserNFTStore from "stores/useWalletTokenAccountStore";
// Wallet adapter
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
// Anchor
import { Program, Provider, BN } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
// IDL
import idl from "../utils/fortune.json";
// Solana Web3
import { PublicKey, ConfirmOptions } from "@solana/web3.js";

export const WalletView: FC = ({}) => {
  // Wallet NFTs
  const tokenAccounts = useUserNFTStore((s) => s.tokenAccounts);
  const { getWalletTokenAccounts } = useUserNFTStore();

  // Wallet connection
  const programId = new PublicKey(idl.metadata.address);
  const { connection } = useConnection();
  const wallet = useWallet();
  // Provider
  const opts = { preflightCommitment: "processed" };
  const provider = new Provider(
    connection,
    wallet,
    opts.preflightCommitment as ConfirmOptions
  );
  // Program
  const program = new Program(idl as anchor.Idl, programId, provider);

  // Get wallet NFTs
  useEffect(() => {
    if (wallet.publicKey) {
      getWalletTokenAccounts(wallet.publicKey, connection);
    }
  }, [wallet, connection, useUserNFTStore]);

  if (!tokenAccounts) {
    return null;
  }

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-3xl font-bold text-transparent bg-clip-text bg-black">
          Wallet Holdings
        </h1>
        <p className="text-black text-xl">
          Select an NFT to create a stochastic pool
        </p>
        <div className="flex flex-cols flex-wrap justify-center">
          {tokenAccounts.map((tokenAccount, index) => {
            return (
              <div key={index} className="">
                <NFTCard tokenAccount={tokenAccount}></NFTCard>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
