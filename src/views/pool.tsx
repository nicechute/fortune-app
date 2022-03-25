//React
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
// Wallet adapter
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// Metaplex
import { programs } from "@metaplex/js";
// Components
import { PoolCard } from "components/PoolCard";
const {
  metadata: { Metadata },
} = programs;
// Utils
import { shortAddr } from "utils/address";
import { notify } from "../utils/notifications";
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
// Anchor
import { Program, Provider, BN } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
// IDL
import idl from "../utils/fortune.json";
// Stores
import useUserNFTStore from "stores/useWalletTokenAccountStore";

export const PoolView = ({ pubkey }) => {
  // Metaplex metadata
  const [metadata, setMetadata] = useState({});
  const [image, setImage] = useState("../normal2.png");
  // Mint for NFT to create pool for
  const [mint, setMint] = useState("");

  // Connections, programs
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

  // Pool info
  let [pool, setPool] = useState(null);

  // Get Pool info
  const getPoolInfo = async () => {
    if (pubkey) {
      let pk = new PublicKey(pubkey);
      let info = await program.account.probPool.fetch(pk);
      setPool(info);
    }
  };

  useEffect(() => {
    getPoolInfo();
  }, [wallet, connection]);

  // No pool info available
  if (!pool) {
    return <div className="text-black text-center text-2xl">LOADING...</div>;
  }
  // Pool info available
  else {
    return (
      <div className="md:hero mx-auto p-4">
        <div className="md:hero-content flex flex-col">
          <Link
            href={
              "https://explorer.solana.com/address/" +
              pubkey.toString() +
              "?cluster=devnet"
            }
          >
            <a>
              <div className="w-full flex flex-rows text-center text-2xl font-bold text-pink pl-4 pr-4 font-bold p-4 bg-black items-center">
                <h1 className="pr-4">{shortAddr(pubkey)}</h1>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </div>
            </a>
          </Link>
          <PoolCard
            props={{ pubkey: new PublicKey(pubkey), pool: pool }}
          ></PoolCard>
          <div className="bg-black w-full p-6 rounded-lg">
            <h1 className="text-center text-2xl mb-2 text-pink">Metadata</h1>
            <p className="font-bold m-2">
              Creator:{" "}
              <Link
                href={
                  "https://explorer.solana.com/address/" +
                  pool.authority.toString() +
                  "?cluster=devnet"
                }
              >
                <a>
                  <span className="text-blue underline">
                    {shortAddr(pool.authority.toString())}{" "}
                  </span>
                </a>
              </Link>
            </p>
            <p className="font-bold m-2">
              NFT Mint:{" "}
              <Link
                href={
                  "https://explorer.solana.com/address/" +
                  pool.nftMint.toString() +
                  "?cluster=devnet"
                }
              >
                <a>
                  <span className="text-blue underline">
                    {shortAddr(pool.nftMint.toString())}{" "}
                  </span>
                </a>
              </Link>
            </p>
            <p className="font-bold m-2">
              pToken Mint:{" "}
              <Link
                href={
                  "https://explorer.solana.com/address/" +
                  pool.ptokenMint.toString() +
                  "?cluster=devnet"
                }
              >
                <a>
                  <span className="text-blue underline">
                    {shortAddr(pool.ptokenMint.toString())}{" "}
                  </span>
                </a>
              </Link>
            </p>
            <p className="font-bold m-2">
              Outstanding pTokens:{" "}
              <span className="text-blue">
                {pool.outstandingPtokens.toString()}{" "}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }
};
