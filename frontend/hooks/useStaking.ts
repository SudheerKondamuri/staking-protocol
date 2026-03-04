import { useQuery } from "@tanstack/react-query";
import { getStakingContractReadOnly } from "@/lib/contracts";
import { ethers } from "ethers";

export const usePools = () => {
  return useQuery({
    queryKey: ["pools"],
    queryFn: async () => {
      const contract = getStakingContractReadOnly();
      const count = await contract.poolCount();

      const pools = [];

      for (let i = 0; i < Number(count); i++) {
        const pool = await contract.getPoolInfo(i);

        pools.push({
          id: i,
          apyRate: pool.apyRate ?? pool[0],
          lockDuration: pool.lockDuration ?? pool[1],
          isFlexible: pool.isFlexible ?? pool[2],
          totalStaked: pool.totalStaked ?? pool[3],
        });
      }

      return pools;
    },
  });
};

export const useTVL = () => {
  return useQuery({
    queryKey: ["tvl"],
    queryFn: async () => {
      const contract = getStakingContractReadOnly();
      const tvl = await contract.totalValueLocked();
      return ethers.formatUnits(tvl, 18);
    },
  });
};