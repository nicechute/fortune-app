// State
import create, { State } from "zustand";
// Anchor
import { Program } from "@project-serum/anchor";
// Solana Web3
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface PoolStore extends State {
  pools: any[];
  getPools: (program: Program, connection: Connection) => void;
}

const usePoolStore = create<PoolStore>((set, _get) => ({
  pools: [],
  getPools: async (program, connection) => {
    let pools = [];
    try {
      // Get all program accounts
      let accounts = await connection.getParsedProgramAccounts(
        program.programId
      );
      console.log(accounts);
      for (let j = 0; accounts.length > j; j++) {
        try {
          let pubkey = accounts[j].pubkey;
          // Try to get the pool
          let pool = await program.account.probPool.fetch(pubkey);
          pools.push({ pubkey: pubkey, pool: pool });
        } catch (err) {}
      }
    } catch (error) {
      console.log(error);
    }
    set((state) => {
      state.pools = pools;
      console.log(`Pools updated, `, pools);
    });
  },
}));

export default usePoolStore;
