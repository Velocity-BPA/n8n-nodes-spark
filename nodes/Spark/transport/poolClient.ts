/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import type { SparkClient } from './sparkClient';
import {
  requireSigner,
  waitForTransaction,
  formatTransactionResult,
  getErc20Contract,
} from './sparkClient';
import { INTEREST_RATE_MODE } from '../constants/reserves';
import { parseAmount, formatAmount, MAX_UINT256 } from '../utils/tokenUtils';

/**
 * Pool Client
 *
 * Handles operations on the Spark Lending Pool including supply, borrow,
 * withdraw, repay, and collateral management.
 */

export interface UserAccountData {
  totalCollateralBase: string;
  totalDebtBase: string;
  availableBorrowsBase: string;
  currentLiquidationThreshold: string;
  ltv: string;
  healthFactor: string;
}

export interface ReserveData {
  configuration: string;
  liquidityIndex: string;
  currentLiquidityRate: string;
  variableBorrowIndex: string;
  currentVariableBorrowRate: string;
  currentStableBorrowRate: string;
  lastUpdateTimestamp: number;
  id: number;
  aTokenAddress: string;
  stableDebtTokenAddress: string;
  variableDebtTokenAddress: string;
  interestRateStrategyAddress: string;
  accruedToTreasury: string;
  unbacked: string;
  isolationModeTotalDebt: string;
}

export interface UserReserveData {
  currentATokenBalance: string;
  currentStableDebt: string;
  currentVariableDebt: string;
  principalStableDebt: string;
  scaledVariableDebt: string;
  stableBorrowRate: string;
  liquidityRate: string;
  stableRateLastUpdated: number;
  usageAsCollateralEnabled: boolean;
}

/**
 * Get user account data (overall position)
 */
export async function getUserAccountData(
  client: SparkClient,
  userAddress: string,
): Promise<UserAccountData> {
  const result = await client.contracts.pool.getUserAccountData(userAddress);

  return {
    totalCollateralBase: result[0].toString(),
    totalDebtBase: result[1].toString(),
    availableBorrowsBase: result[2].toString(),
    currentLiquidationThreshold: result[3].toString(),
    ltv: result[4].toString(),
    healthFactor: result[5].toString(),
  };
}

/**
 * Get reserve data for an asset
 */
export async function getReserveData(
  client: SparkClient,
  assetAddress: string,
): Promise<ReserveData> {
  const result = await client.contracts.pool.getReserveData(assetAddress);

  return {
    configuration: result.configuration.toString(),
    liquidityIndex: result.liquidityIndex.toString(),
    currentLiquidityRate: result.currentLiquidityRate.toString(),
    variableBorrowIndex: result.variableBorrowIndex.toString(),
    currentVariableBorrowRate: result.currentVariableBorrowRate.toString(),
    currentStableBorrowRate: result.currentStableBorrowRate.toString(),
    lastUpdateTimestamp: Number(result.lastUpdateTimestamp),
    id: Number(result.id),
    aTokenAddress: result.aTokenAddress,
    stableDebtTokenAddress: result.stableDebtTokenAddress,
    variableDebtTokenAddress: result.variableDebtTokenAddress,
    interestRateStrategyAddress: result.interestRateStrategyAddress,
    accruedToTreasury: result.accruedToTreasury.toString(),
    unbacked: result.unbacked.toString(),
    isolationModeTotalDebt: result.isolationModeTotalDebt.toString(),
  };
}

/**
 * Get user's data for a specific reserve
 */
export async function getUserReserveData(
  client: SparkClient,
  assetAddress: string,
  userAddress: string,
): Promise<UserReserveData> {
  const result = await client.contracts.poolDataProvider.getUserReserveData(
    assetAddress,
    userAddress,
  );

  return {
    currentATokenBalance: result[0].toString(),
    currentStableDebt: result[1].toString(),
    currentVariableDebt: result[2].toString(),
    principalStableDebt: result[3].toString(),
    scaledVariableDebt: result[4].toString(),
    stableBorrowRate: result[5].toString(),
    liquidityRate: result[6].toString(),
    stableRateLastUpdated: Number(result[7]),
    usageAsCollateralEnabled: result[8],
  };
}

/**
 * Supply assets to the pool
 */
export async function supply(
  client: SparkClient,
  assetAddress: string,
  amount: string,
  onBehalfOf?: string,
  referralCode: number = 0,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'supply');
  const userAddress = await signer.getAddress();
  const recipient = onBehalfOf || userAddress;

  // Check and approve token allowance
  const token = getErc20Contract(assetAddress, signer);
  const allowance = await token.allowance(userAddress, client.addresses.pool);

  if (BigInt(allowance.toString()) < BigInt(amount)) {
    const approveTx = await token.approve(client.addresses.pool, MAX_UINT256);
    await waitForTransaction(approveTx);
  }

  // Supply to pool
  const tx = await client.contracts.pool.supply(
    assetAddress,
    amount,
    recipient,
    referralCode,
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Supply ETH to the pool (uses WETH Gateway)
 */
export async function supplyETH(
  client: SparkClient,
  amount: string,
  onBehalfOf?: string,
  referralCode: number = 0,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'supplyETH');
  const userAddress = await signer.getAddress();
  const recipient = onBehalfOf || userAddress;

  const tx = await client.contracts.wethGateway.depositETH(
    client.addresses.pool,
    recipient,
    referralCode,
    { value: amount },
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Withdraw assets from the pool
 */
export async function withdraw(
  client: SparkClient,
  assetAddress: string,
  amount: string,
  to?: string,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'withdraw');
  const userAddress = await signer.getAddress();
  const recipient = to || userAddress;

  const tx = await client.contracts.pool.withdraw(assetAddress, amount, recipient);
  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Withdraw ETH from the pool (uses WETH Gateway)
 */
export async function withdrawETH(
  client: SparkClient,
  amount: string,
  to?: string,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'withdrawETH');
  const userAddress = await signer.getAddress();
  const recipient = to || userAddress;

  const tx = await client.contracts.wethGateway.withdrawETH(
    client.addresses.pool,
    amount,
    recipient,
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Borrow assets from the pool
 */
export async function borrow(
  client: SparkClient,
  assetAddress: string,
  amount: string,
  interestRateMode: number = INTEREST_RATE_MODE.VARIABLE,
  onBehalfOf?: string,
  referralCode: number = 0,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'borrow');
  const userAddress = await signer.getAddress();
  const borrower = onBehalfOf || userAddress;

  const tx = await client.contracts.pool.borrow(
    assetAddress,
    amount,
    interestRateMode,
    referralCode,
    borrower,
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Borrow ETH from the pool
 */
export async function borrowETH(
  client: SparkClient,
  amount: string,
  interestRateMode: number = INTEREST_RATE_MODE.VARIABLE,
  referralCode: number = 0,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'borrowETH');

  const tx = await client.contracts.wethGateway.borrowETH(
    client.addresses.pool,
    amount,
    interestRateMode,
    referralCode,
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Repay borrowed assets
 */
export async function repay(
  client: SparkClient,
  assetAddress: string,
  amount: string,
  interestRateMode: number = INTEREST_RATE_MODE.VARIABLE,
  onBehalfOf?: string,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'repay');
  const userAddress = await signer.getAddress();
  const borrower = onBehalfOf || userAddress;

  // Approve token
  const token = getErc20Contract(assetAddress, signer);
  const allowance = await token.allowance(userAddress, client.addresses.pool);

  if (BigInt(allowance.toString()) < BigInt(amount)) {
    const approveTx = await token.approve(client.addresses.pool, MAX_UINT256);
    await waitForTransaction(approveTx);
  }

  const tx = await client.contracts.pool.repay(
    assetAddress,
    amount,
    interestRateMode,
    borrower,
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Repay borrowed ETH
 */
export async function repayETH(
  client: SparkClient,
  amount: string,
  rateMode: number = INTEREST_RATE_MODE.VARIABLE,
  onBehalfOf?: string,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'repayETH');
  const userAddress = await signer.getAddress();
  const borrower = onBehalfOf || userAddress;

  const tx = await client.contracts.wethGateway.repayETH(
    client.addresses.pool,
    amount,
    rateMode,
    borrower,
    { value: amount },
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Set/unset asset as collateral
 */
export async function setUserUseReserveAsCollateral(
  client: SparkClient,
  assetAddress: string,
  useAsCollateral: boolean,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'setCollateral');

  const tx = await client.contracts.pool.setUserUseReserveAsCollateral(
    assetAddress,
    useAsCollateral,
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Get user's E-Mode category
 */
export async function getUserEMode(
  client: SparkClient,
  userAddress: string,
): Promise<number> {
  const result = await client.contracts.pool.getUserEMode(userAddress);
  return Number(result);
}

/**
 * Set user's E-Mode category
 */
export async function setUserEMode(
  client: SparkClient,
  categoryId: number,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'setEMode');

  const tx = await client.contracts.pool.setUserEMode(categoryId);
  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Get E-Mode category data
 */
export async function getEModeCategoryData(
  client: SparkClient,
  categoryId: number,
): Promise<{
  ltv: number;
  liquidationThreshold: number;
  liquidationBonus: number;
  priceSource: string;
  label: string;
}> {
  const result = await client.contracts.pool.getEModeCategoryData(categoryId);

  return {
    ltv: Number(result[0]),
    liquidationThreshold: Number(result[1]),
    liquidationBonus: Number(result[2]),
    priceSource: result[3],
    label: result[4],
  };
}

/**
 * Execute flash loan
 */
export async function flashLoan(
  client: SparkClient,
  receiverAddress: string,
  assets: string[],
  amounts: string[],
  modes: number[],
  onBehalfOf: string,
  params: string = '0x',
  referralCode: number = 0,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'flashLoan');

  const tx = await client.contracts.pool.flashLoan(
    receiverAddress,
    assets,
    amounts,
    modes,
    onBehalfOf,
    params,
    referralCode,
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Execute simple flash loan (single asset)
 */
export async function flashLoanSimple(
  client: SparkClient,
  receiverAddress: string,
  asset: string,
  amount: string,
  params: string = '0x',
  referralCode: number = 0,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'flashLoanSimple');

  const tx = await client.contracts.pool.flashLoanSimple(
    receiverAddress,
    asset,
    amount,
    params,
    referralCode,
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}

/**
 * Liquidate an undercollateralized position
 */
export async function liquidationCall(
  client: SparkClient,
  collateralAsset: string,
  debtAsset: string,
  user: string,
  debtToCover: string,
  receiveAToken: boolean = false,
): Promise<Record<string, unknown>> {
  const signer = requireSigner(client, 'liquidationCall');
  const userAddress = await signer.getAddress();

  // Approve debt token
  const token = getErc20Contract(debtAsset, signer);
  const allowance = await token.allowance(userAddress, client.addresses.pool);

  if (BigInt(allowance.toString()) < BigInt(debtToCover)) {
    const approveTx = await token.approve(client.addresses.pool, MAX_UINT256);
    await waitForTransaction(approveTx);
  }

  const tx = await client.contracts.pool.liquidationCall(
    collateralAsset,
    debtAsset,
    user,
    debtToCover,
    receiveAToken,
  );

  const receipt = await waitForTransaction(tx);
  return formatTransactionResult(receipt, client.network);
}
