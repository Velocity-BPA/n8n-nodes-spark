/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Network Configuration for Spark Protocol
 *
 * Spark Protocol is deployed on Ethereum Mainnet and Gnosis Chain.
 * Each network has its own set of contracts and configuration.
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer: string;
  subgraphUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/messari/spark-ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  gnosis: {
    name: 'Gnosis Chain',
    chainId: 100,
    rpcUrl: 'https://rpc.gnosischain.com',
    blockExplorer: 'https://gnosisscan.io',
    subgraphUrl: 'https://api.thegraph.com/subgraphs/name/messari/spark-gnosis',
    nativeCurrency: {
      name: 'xDAI',
      symbol: 'xDAI',
      decimals: 18,
    },
  },
};

export const DEFAULT_NETWORK = 'ethereum';

export const CHAIN_ID_TO_NETWORK: Record<number, string> = {
  1: 'ethereum',
  100: 'gnosis',
};

/**
 * Spark Protocol Contract Addresses
 */
export interface SparkContracts {
  pool: string;
  poolDataProvider: string;
  oracle: string;
  poolAddressesProvider: string;
  wethGateway: string;
  rewardsController: string;
  sDAI?: string;
  DAI?: string;
  WETH?: string;
}

export const SPARK_CONTRACTS: Record<string, SparkContracts> = {
  ethereum: {
    pool: '0xC13e21B648A5Ee794902342038FF3aDAB66BE987',
    poolDataProvider: '0xFc21d6d146E6086B8359705C8b28512a983db0cb',
    oracle: '0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9',
    poolAddressesProvider: '0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE',
    wethGateway: '0xBD7D6a9ad7865463DE44B05F04559f65e3B11704',
    rewardsController: '0x4370D3b6C9588E02ce9D22e684387859c7Ff5b34',
    sDAI: '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
    DAI: '0x6B175474E89094C44Da98b954EesDecF55C02Af5',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  gnosis: {
    pool: '0x2Dae5307c5E3FD1CF5A72Cb6F698f915860607e0',
    poolDataProvider: '0x501B4c19dd9C2e06E94dA7b6D5Ed4ddA013EC741',
    oracle: '0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9',
    poolAddressesProvider: '0xA98DaC106F4894e29f66C9e2f5FF8A614D468c11',
    wethGateway: '0xBD7D6a9ad7865463DE44B05F04559f65e3B11704',
    rewardsController: '0x98e6BcBA7d5daFbfa4a92dAF08d3d7512820c30C',
    DAI: '0x44fA8E6588e7a9ad869837d09621Dc9D5E5C6F30',
    WETH: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
  },
};

export const SPARK_NETWORKS = NETWORKS;

/**
 * Get network configuration by network name or chain ID
 */
export function getNetworkConfig(networkOrChainId: string | number): NetworkConfig {
  if (typeof networkOrChainId === 'number') {
    const networkName = CHAIN_ID_TO_NETWORK[networkOrChainId];
    if (!networkName) {
      throw new Error(`Unsupported chain ID: ${networkOrChainId}`);
    }
    return NETWORKS[networkName];
  }
  const config = NETWORKS[networkOrChainId];
  if (!config) {
    throw new Error(`Unsupported network: ${networkOrChainId}`);
  }
  return config;
}
