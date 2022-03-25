import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { CreateView } from "../../views";

const Create: NextPage = (props) => {
  const router = useRouter();
  const { pubkey } = router.query;
  return (
    <div>
      <Head>
        <title>Fortune</title>
        <meta name="description" content="More liquid and fun NFT sales" />
      </Head>
      <CreateView pubkey={pubkey} />
    </div>
  );
};

export default Create;
