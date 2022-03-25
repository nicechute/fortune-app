//React
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
import usePoolStore from "stores/usePoolsStore";
import { isTargetLikeServerless } from "next/dist/server/config";
import { tryGetPreviewData } from "next/dist/server/api-utils";

export const PoolCard = ({ props }) => {
  console.log(props);
  // Metaplex metadata
  const [metadata, setMetadata] = useState({});
  const [image, setImage] = useState("../normal2.png");
  // Input state for buy
  const [input, setInput] = useState(1);
  // Buy preview
  const [price, setPrice] = useState(0);
  const [weight, setWeight] = useState(0);

  // Pool store
  const { getPools } = usePoolStore();

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

  // Props
  let pubkey = props.pubkey;
  let pool = props.pool;

  // Get Metaplex metadata
  const getMetaplexData = useCallback(async () => {
    try {
      const metadata = await Metadata.load(connection, pool.nftMint);
      console.log(metadata);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    try {
      getMetaplexData();
      updateBuyPreview();
    } catch (err) {}
  }, [getMetaplexData, weight, price, input]);

  // ptoken amount to buy
  const updateInput = (event) => {
    let input = event.target.value;
    setInput(Number(input));
    updateBuyPreview();
  };

  // Preview the cost and % chance from buying ptokens
  const updateBuyPreview = () => {
    // AMM
    let k = pool.lamportSupply.toNumber() * pool.ptokenSupply.toNumber();
    let new_spl = k / (pool.ptokenSupply.toNumber() - input);
    let price = new_spl - pool.lamportSupply.toNumber();
    // Probability of one token winning the NFT
    let pweight = input / (pool.ptokenSupply.toNumber() - input);
    // Set initial buy preview
    setWeight(pweight);
    setPrice(price / LAMPORTS_PER_SOL);
  };

  const onClick = useCallback(async () => {
    if (!publicKey) {
      notify({ type: "error", message: `Wallet not connected!` });
      console.log("error", `Send Transaction: Wallet not connected!`);
      return;
    }

    let signature: TransactionSignature = "";

    try {
      // Cannot buy decimal amounts. If using contract directly, you will need to specify an u64.
      if (input % 1 != 0) {
        notify({
          type: "error",
          message: `Transaction failed!`,
          description:
            "Probability tokens are discrete, cannot buy decimals amounts. Try buying a whole number.",
        });
        return;
      }
      // BN buy amount
      const buyAmount = new anchor.BN(input);

      // ptoken mint PDA
      let [ptokenMint, ptokenMintBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("mint")),
          pubkey.toBuffer(),
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
          pubkey.toBuffer(),
        ],
        program.programId
      );
      // SPL vault PDA
      let [splVault, splVaultBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
          NATIVE_MINT.toBuffer(),
          pubkey.toBuffer(),
        ],
        program.programId
      );
      // Fortune Vault
      let [fortuneVault, fortuneVaultBump] = await PublicKey.findProgramAddress(
        [
          Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
          NATIVE_MINT.toBuffer(),
        ],
        program.programId
      );
      // User pool ptoken vault
      let [userPtokenVault, userPtokenVaultBump] =
        await PublicKey.findProgramAddress(
          [
            Buffer.from(anchor.utils.bytes.utf8.encode("vault")),
            ptokenMint.toBuffer(),
            publicKey.toBuffer(),
          ],
          program.programId
        );

      const signature = await program.rpc.buy(buyAmount, {
        accounts: {
          signer: publicKey,
          poolLamportVault: splVault,
          poolPtokenVault: ptokenVault,
          probPool: pubkey,
          fortuneLamportVault: fortuneVault,
          userPtokenVault: userPtokenVault,
          ptokenMint: ptokenMint,
          nativeMint: NATIVE_MINT,
          state: state,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [],
      });
      getPools(program, connection);
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
  }, [publicKey, notify, connection, input]);

  // Return card
  return (
    <div className="card bg-black m-4 border-4 border-black">
      <div className="flex flex-cols justify-center">
        <div className="flex flex-row justify-center m-2 mt-6 mb-6 items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 fill-red-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
              clipRule="evenodd"
            />
          </svg>
          <span className="inline-block pl-1">burn</span>
        </div>
        <div className="flex flex-row justify-center m-2 items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 fill-gold"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
          <span className="inline-block pl-1">
            {pool.ptokenSupply.toString()}
          </span>
        </div>
      </div>
      <figure>
        <img src={image} alt="" />
      </figure>
      <div className="card-body">
        <Link href={"/pool/" + pubkey.toString()}>
          <a>
            <h2 className="card-title text-pink underline">
              {shortAddr(pubkey.toString())}
            </h2>
          </a>
        </Link>
        <div className="flex flex-cols justify-center mt-4">
          <div className="flex flex-row justify-start items-center">
            <span className="inline-block pr-1 text-xl">
              {price.toFixed(5)}
            </span>
            <svg
              className="h-3 w-3"
              viewBox="0 0 101 88"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100.48 69.3817L83.8068 86.8015C83.4444 87.1799 83.0058 87.4816 82.5185 87.6878C82.0312 87.894 81.5055 88.0003 80.9743 88H1.93563C1.55849 88 1.18957 87.8926 0.874202 87.6912C0.558829 87.4897 0.31074 87.2029 0.160416 86.8659C0.0100923 86.529 -0.0359181 86.1566 0.0280382 85.7945C0.0919944 85.4324 0.263131 85.0964 0.520422 84.8278L17.2061 67.408C17.5676 67.0306 18.0047 66.7295 18.4904 66.5234C18.9762 66.3172 19.5002 66.2104 20.0301 66.2095H99.0644C99.4415 66.2095 99.8104 66.3169 100.126 66.5183C100.441 66.7198 100.689 67.0067 100.84 67.3436C100.99 67.6806 101.036 68.0529 100.972 68.415C100.908 68.7771 100.737 69.1131 100.48 69.3817ZM83.8068 34.3032C83.4444 33.9248 83.0058 33.6231 82.5185 33.4169C82.0312 33.2108 81.5055 33.1045 80.9743 33.1048H1.93563C1.55849 33.1048 1.18957 33.2121 0.874202 33.4136C0.558829 33.6151 0.31074 33.9019 0.160416 34.2388C0.0100923 34.5758 -0.0359181 34.9482 0.0280382 35.3103C0.0919944 35.6723 0.263131 36.0083 0.520422 36.277L17.2061 53.6968C17.5676 54.0742 18.0047 54.3752 18.4904 54.5814C18.9762 54.7875 19.5002 54.8944 20.0301 54.8952H99.0644C99.4415 54.8952 99.8104 54.7879 100.126 54.5864C100.441 54.3849 100.689 54.0981 100.84 53.7612C100.99 53.4242 101.036 53.0518 100.972 52.6897C100.908 52.3277 100.737 51.9917 100.48 51.723L83.8068 34.3032ZM1.93563 21.7905H80.9743C81.5055 21.7907 82.0312 21.6845 82.5185 21.4783C83.0058 21.2721 83.4444 20.9704 83.8068 20.592L100.48 3.17219C100.737 2.90357 100.908 2.56758 100.972 2.2055C101.036 1.84342 100.99 1.47103 100.84 1.13408C100.689 0.79713 100.441 0.510296 100.126 0.308823C99.8104 0.107349 99.4415 1.24074e-05 99.0644 0L20.0301 0C19.5002 0.000878397 18.9762 0.107699 18.4904 0.313848C18.0047 0.519998 17.5676 0.821087 17.2061 1.19848L0.524723 18.6183C0.267681 18.8866 0.0966198 19.2223 0.0325185 19.5839C-0.0315829 19.9456 0.0140624 20.3177 0.163856 20.6545C0.31365 20.9913 0.561081 21.2781 0.875804 21.4799C1.19053 21.6817 1.55886 21.7896 1.93563 21.7905Z"
                fill="url(#paint0_linear_174_4403)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_174_4403"
                  x1="8.52558"
                  y1="90.0973"
                  x2="88.9933"
                  y2="-3.01622"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.08" stopColor="#9945FF" />
                  <stop offset="0.3" stopColor="#8752F3" />
                  <stop offset="0.5" stopColor="#5497D5" />
                  <stop offset="0.6" stopColor="#43B4CA" />
                  <stop offset="0.72" stopColor="#28E0B9" />
                  <stop offset="0.97" stopColor="#19FB9B" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex flex-row justify-start items-center pl-4">
            <span className="inline-block pr-1 text-xl">
              {(weight * 100.0).toFixed(5)}
            </span>
            <svg
              className="h-4 w-4 fill-blue-500"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g>
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M17.5 21a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm0-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm-11-9a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm0-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm12.571-4.485l1.414 1.414L4.93 20.485l-1.414-1.414L19.07 3.515z" />
              </g>
            </svg>
          </div>
        </div>
        <div className="w-full form-control mt-4">
          <label className="label">
            <span className="label-text">Enter amount</span>
          </label>
          <label className="input-group">
            <input
              type="number"
              min="0"
              className="input bg-black border-pink"
              onChange={updateInput}
            ></input>
            <button
              onClick={onClick}
              className="p-2 bg-black text-pink pl-8 pr-8 font-bold shadow-xl shadow-pink hover:brightness-200 border-pink border-2"
            >
              BUY
            </button>
          </label>
        </div>
      </div>
    </div>
  );
};
