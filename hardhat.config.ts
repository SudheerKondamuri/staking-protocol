import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy"; // This is required for deploy scripts

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  paths: {
    deploy: 'deploy',
    deployments: 'deployments',
  },
  external: {
    deployments: {}
  }
};

export default config;