
// Summarize a pubkey address for ui
export const shortAddr = (addr) => {
     return addr.substring(0,4) + "..." + addr.substring(addr.length -4);
 }