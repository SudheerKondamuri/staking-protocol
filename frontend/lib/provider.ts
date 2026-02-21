import { ethers } from "ethers";

export const getBrowserProvider = () => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  throw new Error("MetaMask not found");
};