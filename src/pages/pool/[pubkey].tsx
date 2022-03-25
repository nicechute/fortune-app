import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { PoolView } from "../../views";

const Pool: NextPage = (props) => {
  const router = useRouter();
  const { pubkey } = router.query;
  return (
    <div>
      <Head>
        <title>Fortune</title>
        <meta name="description" content="More liquid and fun NFT sales" />
      </Head>
      <PoolView pubkey={pubkey} />
    </div>
  );
};

export default Pool;
