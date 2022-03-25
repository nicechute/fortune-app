import type { NextPage } from "next";
import Head from "next/head";
import { WalletView } from "../views";

const Wallet: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Fortune</title>
        <meta name="description" content="More liquid and fun NFT sales" />
      </Head>
      <WalletView />
    </div>
  );
};

export default Wallet;
