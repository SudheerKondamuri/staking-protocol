import { ethers } from "ethers";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";

export const getBrowserProvider = () => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  throw new Error("MetaMask not found");
};

export const getReadOnlyProvider = () => {
  return new ethers.JsonRpcProvider(RPC_URL);
};