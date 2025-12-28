/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { NETWORKS, getNetworkConfig } from '../constants/networks';
import { getContractAddresses, ABI_FRAGMENTS } from '../constants/contracts';

/**
 * Spark Protocol Client
 *
 * Main client for interacting with Spark Protocol smart contracts.
 * Handles connection setup, contract instances, and common operations.
 *
 * [Velocity BPA Licensing Notice]
 *
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 *
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 *
 * For licensing information, visit https://velobpa.com/licensing
 * or contact licensing@velobpa.com.
 */

// Log licensing notice once per node load
let licensingNoticeLogged = false;
function logLicensingNotice(): void {
  if (!licensingNoticeLogged) {
    console.warn(
      '[Velocity BPA Licensing Notice] This n8n node is licensed under the Business Source License 1.1 (BSL 1.1). Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA. For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.',
    );
    licensingNoticeLogged = true;
  }
}

export interface SparkClientConfig {
  network: string;
  rpcUrl?: string;
  privateKey?: string;
  chainId?: number;
}

export interface SparkClient {
  provider: ethers.JsonRpcProvider;
  signer?: ethers.Wallet;
  network: string;
  chainId: number;
  contracts: {
    pool: ethers.Contract;
    poolDataProvider: ethers.Contract;
    oracle: ethers.Contract;
    wethGateway: ethers.Contract;
    rewardsController: ethers.Contract;
  };
  addresses: ReturnType<typeof getContractAddresses>;
}

/**
 * Create a Spark Protocol client from n8n credentials
 */
export async function createSparkClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  nodeCredentials?: SparkClientConfig,
): Promise<SparkClient> {
  logLicensingNotice();

  let config: SparkClientConfig;

  if (nodeCredentials) {
    config = nodeCredentials;
  } else {
    const credentials = await context.getCredentials('sparkNetwork');
    config = {
      network: credentials.network as string,
      rpcUrl: credentials.rpcUrl as string,
      privateKey: credentials.privateKey as string,
      chainId: credentials.chainId as number,
    };
  }

  const { network, rpcUrl, privateKey, chainId } = config;

  // Get network configuration
  let networkConfig;
  let effectiveRpcUrl: string;
  let effectiveChainId: number;

  if (network === 'custom') {
    if (!rpcUrl) {
      throw new NodeOperationError(
        context.getNode(),
        'RPC URL is required for custom network',
      );
    }
    effectiveRpcUrl = rpcUrl;
    effectiveChainId = chainId || 1;
    networkConfig = null;
  } else {
    networkConfig = getNetworkConfig(network);
    effectiveRpcUrl = rpcUrl || networkConfig.rpcUrl;
    effectiveChainId = networkConfig.chainId;
  }

  // Create provider
  const provider = new ethers.JsonRpcProvider(effectiveRpcUrl, effectiveChainId);

  // Verify connection
  try {
    const blockNumber = await provider.getBlockNumber();
    if (blockNumber === 0) {
      throw new Error('Unable to fetch block number');
    }
  } catch (error) {
    throw new NodeOperationError(
      context.getNode(),
      `Failed to connect to RPC endpoint: ${(error as Error).message}`,
    );
  }

  // Create signer if private key provided
  let signer: ethers.Wallet | undefined;
  if (privateKey) {
    try {
      signer = new ethers.Wallet(privateKey, provider);
    } catch (error) {
      throw new NodeOperationError(
        context.getNode(),
        'Invalid private key format',
      );
    }
  }

  // Get contract addresses for the network
  const addresses = getContractAddresses(network === 'custom' ? 'ethereum' : network);

  // Create contract instances
  const signerOrProvider = signer || provider;

  const pool = new ethers.Contract(
    addresses.pool,
    ABI_FRAGMENTS.pool,
    signerOrProvider,
  );

  const poolDataProvider = new ethers.Contract(
    addresses.poolDataProvider,
    ABI_FRAGMENTS.dataProvider,
    signerOrProvider,
  );

  const oracle = new ethers.Contract(
    addresses.oracle,
    ABI_FRAGMENTS.oracle,
    signerOrProvider,
  );

  const wethGateway = new ethers.Contract(
    addresses.wethGateway,
    ABI_FRAGMENTS.wethGateway,
    signerOrProvider,
  );

  const rewardsController = new ethers.Contract(
    addresses.rewardsController,
    ABI_FRAGMENTS.rewardsController,
    signerOrProvider,
  );

  return {
    provider,
    signer,
    network: network === 'custom' ? 'custom' : network,
    chainId: effectiveChainId,
    contracts: {
      pool,
      poolDataProvider,
      oracle,
      wethGateway,
      rewardsController,
    },
    addresses,
  };
}

/**
 * Get ERC20 contract instance
 */
export function getErc20Contract(
  address: string,
  signerOrProvider: ethers.Wallet | ethers.JsonRpcProvider,
): ethers.Contract {
  return new ethers.Contract(address, ABI_FRAGMENTS.erc20, signerOrProvider);
}

/**
 * Get spToken contract instance
 */
export function getSpTokenContract(
  address: string,
  signerOrProvider: ethers.Wallet | ethers.JsonRpcProvider,
): ethers.Contract {
  return new ethers.Contract(
    address,
    [...ABI_FRAGMENTS.erc20, ...ABI_FRAGMENTS.spToken],
    signerOrProvider,
  );
}

/**
 * Get variable debt token contract instance
 */
export function getVariableDebtTokenContract(
  address: string,
  signerOrProvider: ethers.Wallet | ethers.JsonRpcProvider,
): ethers.Contract {
  return new ethers.Contract(
    address,
    [...ABI_FRAGMENTS.erc20, ...ABI_FRAGMENTS.variableDebtToken],
    signerOrProvider,
  );
}

/**
 * Get stable debt token contract instance
 */
export function getStableDebtTokenContract(
  address: string,
  signerOrProvider: ethers.Wallet | ethers.JsonRpcProvider,
): ethers.Contract {
  return new ethers.Contract(
    address,
    [...ABI_FRAGMENTS.erc20, ...ABI_FRAGMENTS.stableDebtToken],
    signerOrProvider,
  );
}

/**
 * Get sDAI contract instance
 */
export function getSdaiContract(
  address: string,
  signerOrProvider: ethers.Wallet | ethers.JsonRpcProvider,
): ethers.Contract {
  return new ethers.Contract(
    address,
    [...ABI_FRAGMENTS.erc20, ...ABI_FRAGMENTS.sdai],
    signerOrProvider,
  );
}

/**
 * Ensure signer is available for write operations
 */
export function requireSigner(client: SparkClient, operation: string): ethers.Wallet {
  if (!client.signer) {
    throw new Error(
      `Private key required for ${operation}. Please add a private key to your Spark Network credentials.`,
    );
  }
  return client.signer;
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  tx: ethers.TransactionResponse,
  confirmations: number = 1,
): Promise<ethers.TransactionReceipt> {
  const receipt = await tx.wait(confirmations);
  if (!receipt) {
    throw new Error('Transaction receipt not found');
  }
  return receipt;
}

/**
 * Estimate gas with buffer
 */
export async function estimateGasWithBuffer(
  contract: ethers.Contract,
  method: string,
  args: unknown[],
  bufferPercent: number = 20,
): Promise<bigint> {
  const estimated = await contract[method].estimateGas(...args);
  const buffer = (estimated * BigInt(bufferPercent)) / BigInt(100);
  return estimated + buffer;
}

/**
 * Get current gas price with optional multiplier
 */
export async function getGasPrice(
  provider: ethers.JsonRpcProvider,
  multiplier: number = 1.1,
): Promise<bigint> {
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || BigInt(0);
  return BigInt(Math.floor(Number(gasPrice) * multiplier));
}

/**
 * Format transaction result for n8n output
 */
export function formatTransactionResult(
  receipt: ethers.TransactionReceipt,
  network: string,
): Record<string, unknown> {
  const networkConfig = NETWORKS[network];
  const explorerUrl = networkConfig?.blockExplorer || 'https://etherscan.io';

  return {
    success: receipt.status === 1,
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    blockHash: receipt.blockHash,
    gasUsed: receipt.gasUsed.toString(),
    effectiveGasPrice: receipt.gasPrice?.toString(),
    from: receipt.from,
    to: receipt.to,
    explorerUrl: `${explorerUrl}/tx/${receipt.hash}`,
  };
}
