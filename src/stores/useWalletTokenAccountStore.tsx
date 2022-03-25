// State
import create, { State } from "zustand";
// Anchor
import { Program } from "@project-serum/anchor";
// Solana Web3
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

interface UserNFTStore extends State {
  tokenAccounts: any[];
  getWalletTokenAccounts: (
    publicKey: PublicKey,
    connection: Connection
  ) => void;
}

const useWalletTokenAccountStore = create<UserNFTStore>((set, _get) => ({
  tokenAccounts: [],
  getWalletTokenAccounts: async (publicKey, connection) => {
    let tokenAccounts = [];
    // Get the Wallet token accounts
    try {
      let accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });
      for (let j = 0; accounts.value.length > j; j++) {
        tokenAccounts.push(accounts.value[j]);
      }
    } catch (error) {
      console.log(error);
    }
    set((state) => {
      state.tokenAccounts = tokenAccounts;
      console.log(`Wallet token accounts updated, `, tokenAccounts);
    });
  },
}));

export default useWalletTokenAccountStore;
