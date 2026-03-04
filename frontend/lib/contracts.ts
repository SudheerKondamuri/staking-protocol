import { ethers } from "ethers";
import stakingAbi from "./abi/StakingProtocol.json";
import tokenAbi from "./abi/StakingToken.json";
import { getBrowserProvider, getReadOnlyProvider } from "./provider";

/** Read-only contract (for view functions — no wallet needed) */
export const getStakingContractReadOnly = () => {
  const provider = getReadOnlyProvider();
  return new ethers.Contract(
    process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS!,
    stakingAbi.abi,
    provider
  );
};

/** Signer-attached contract (for write transactions — requires wallet) */
export const getStakingContract = async () => {
  const provider = getBrowserProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(
    process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS!,
    stakingAbi.abi,
    signer
  );
};

export const getStakingTokenContract = async () => {
  const provider = getBrowserProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(
    process.env.NEXT_PUBLIC_STAKING_TOKEN_ADDRESS!,
    tokenAbi.abi,
    signer
  );
};