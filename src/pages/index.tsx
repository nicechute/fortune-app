import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Fortune</title>
        <meta name="description" content="More liquid and fun NFT sales" />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
