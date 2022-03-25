import type { NextPage } from "next";
import Head from "next/head";
import { TradeView } from "../views";

const Trade: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Fortune</title>
        <meta name="description" content="More liquid and fun NFT sales" />
      </Head>
      <TradeView />
    </div>
  );
};

export default Trade;
