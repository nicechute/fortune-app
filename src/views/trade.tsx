// React
import { FC, useEffect, useState } from "react";
//Headless
import { Dialog } from "@headlessui/react";
// Components
import { PoolCard } from "components/PoolCard";
// Stores
import usePoolStore from "stores/usePoolsStore";
// Wallet adapter
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
// Anchor
import { Program, Provider, BN } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
// IDL
import idl from "../utils/fortune.json";
// Solana Web3
import { PublicKey, ConfirmOptions } from "@solana/web3.js";

export const TradeView: FC = ({}) => {
  // Wallet NFTs
  const pools = usePoolStore((s) => s.pools);
  const { getPools } = usePoolStore();

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
      getPools(program, connection);
    }
  }, [wallet, connection, usePoolStore]);

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-3xl font-bold text-transparent bg-clip-text bg-black">
          Stochastic pools
        </h1>
        <p className="text-black text-xl">
          Purchase probability to win the underlying
        </p>
        <div className="flex flex-cols flex-wrap justify-center">
          {pools.map((pool, index) => {
            return (
              <div key={index} className="">
                <PoolCard props={pool}></PoolCard>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
