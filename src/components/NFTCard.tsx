// React
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
// Utils
import { shortAddr } from "utils/address";
// Metaplex
import { Connection, programs } from "@metaplex/js";
const {
  metadata: { Metadata },
} = programs;
// Wallet adapter
import { useConnection } from "@solana/wallet-adapter-react";

export const NFTCard = ({ tokenAccount }) => {
  // Metaplex metadata
  const [metadata, setMetadata] = useState({});
  const [image, setImage] = useState("normal2.png");
  // Wallet connection
  const { connection } = useConnection();
  // Account info
  let account = tokenAccount.account;
  let pubkey = tokenAccount.pubkey;
  let decimals = account["data"]["parsed"]["info"]["tokenAmount"]["decimals"];
  let amount = account["data"]["parsed"]["info"]["tokenAmount"]["uiAmount"];
  let mint = account["data"]["parsed"]["info"]["mint"];

  // Get Metaplex metadata
  const getMetaplexData = useCallback(async () => {
    try {
      const metadata = await Metadata.load(connection, mint);
      console.log(metadata);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    try {
      getMetaplexData();
    } catch (err) {}
  }, [getMetaplexData]);

  // No props
  if (!tokenAccount) {
    return null;
  }
  // Not an NFT
  if (decimals > 0) {
    return null;
  }
  // No balance
  if (amount == 0) {
    return null;
  }
  // Return card
  return (
    <Link href={"/create/" + pubkey.toString()}>
      <a>
        <div className="card w-72 bg-black m-4 border-4 border-black hover:brightness-75">
          <figure>
            <img src={image} alt="" />
          </figure>
          <div className="card-body">
            <h2 className="card-title text-pink">
              {shortAddr(pubkey.toString())}
            </h2>
          </div>
        </div>
      </a>
    </Link>
  );
};
