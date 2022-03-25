//React
import { useEffect, useState, useCallback } from "react";
// Wallet adapter
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// Metaplex
import { programs } from "@metaplex/js";
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

export const CreateView = ({ pubkey }) => {
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

  // Input state
  const [solAmount, setSolAmount] = useState(0);
  const [ptokenAmount, setPtokenAmount] = useState(0);
  const [winCalc, setWinCalc] = useState(0);
  const [ptokenBurn, setPtokenBurn] = useState(0);
  const [ptokenWeight, setPtokenWeight] = useState(0);

  // Get Metaplex metadata
  const getMetaplexData = useCallback(async () => {
    try {
      let pk = new PublicKey(pubkey);
      let info = await connection.getParsedAccountInfo(pk);
      let mint = info.value.data["parsed"]["info"]["mint"];
      setMint(mint);
      const metadata = await Metadata.load(connection, mint);
      console.log(metadata);
    } catch (err) {
      console.log(err);
    }
  }, [pubkey]);

  useEffect(() => {
    if (pubkey) {
      try {
        getMetaplexData();
      } catch (err) {}
    }
  }, [getMetaplexData]);

  // Input values
  const getLamportValue = (event) => {
    let input = event.target.value;
    setSolAmount(input);
  };
  const getPtokenValue = (event) => {
    let input = event.target.value;
    setPtokenAmount(input);
  };
  const getPtokenBurnValue = (event) => {
    let input = event.target.value;
    setPtokenBurn(input);
  };

  useEffect(() => {
    getProfitCalc();
  }, [ptokenAmount, solAmount, ptokenBurn]);

  // Calculate the profit for an amount of ptoken burnt
  const getProfitCalc = () => {
    let k = solAmount * ptokenAmount;
    let new_ptoken = ptokenAmount * (1 - ptokenBurn / 100);
    let new_sol = k / new_ptoken;
    setWinCalc(Math.round((new_sol - solAmount) * 100000) / 100000);
    setPtokenWeight(Math.round((100.0 / new_ptoken) * 100000) / 100000);
  };

  // Create a new stochastic pool
  const CreatePool = ({ props }) => {
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

        const signature = await program.rpc.createPool(
          splAmount,
          ptokenAmount,
          {
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
          }
        );
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
        console.log(
          "error",
          `Transaction failed! ${error?.message}`,
          signature
        );
        return;
      }
    }, [publicKey, notify, connection]);

    return (
      <button
        className="rounded-lg p-2 bg-black text-pink pl-8 pr-8 font-bold shadow-xl shadow-pink hover:brightness-200 border-pink border-2"
        onClick={onClick}
      >
        <span className="block group-disabled:hidden">Create Pool</span>
      </button>
    );
  };

  // Pubkey is no loaded
  if (!pubkey) {
    return null;
  }

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-2xl font-bold text-transparent bg-clip-text bg-black">
          Create stochastic pool
        </h1>
        <div className="w-full card lg:card-side bg-black shadow-black border-4 border-black">
          <div className="w-full">
            <figure>
              <img src={image} alt=""></img>
            </figure>
          </div>
          <div className="card-body w-full">
            <h2 className="card-title">Title</h2>
            <p>Account: {shortAddr(pubkey)}</p>
            <p>Mint: {shortAddr(mint)}</p>
          </div>
        </div>
        <div className="w-full bg-black rounded-lg p-4">
          <div className="mt-2">
            <label className="label">
              <span className="p-2 label-text text-pink font-bold text-md">
                Expected Value
              </span>
            </label>
            <input
              type="number"
              placeholder="SOL"
              className="input bg-black w-full max-w-xs border-none focus:ring-0"
              onChange={getLamportValue}
            ></input>
            <label className="label">
              <span className="label-text text-pink p-2 font-bold text-md">
                Probability to Mint
              </span>
            </label>
            <input
              type="number"
              placeholder="pTokens"
              className="input bg-black w-full max-w-xs border-none focus:ring-0"
              onChange={getPtokenValue}
            ></input>
          </div>
          <div className="text-center">
            <CreatePool
              props={{
                solAmount: solAmount,
                ptokenAmount: ptokenAmount,
                pubkey: pubkey,
                mint: mint,
              }}
            ></CreatePool>
          </div>
        </div>
        <div className="w-full card lg:card-side bg-black shadow-black border-4 border-black m-2">
          <div className="card-body w-full">
            <h2 className="w-72 card-title text-white">Profit Simulator</h2>
            <div>
              <input
                type="range"
                min="0"
                max="100"
                value={ptokenBurn}
                className="w-full range-secondary"
                onChange={getPtokenBurnValue}
              ></input>
            </div>
            <p>
              <span className="text-pink">Probability burnt: </span>
              {ptokenBurn} %
            </p>
            <p>
              <span className="text-pink">Sol earned: </span>
              {winCalc} SOL
            </p>
            <p>
              <span className="text-pink"> Probability weight: </span>
              {ptokenWeight} %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
