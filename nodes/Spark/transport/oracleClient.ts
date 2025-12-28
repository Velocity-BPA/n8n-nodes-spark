/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import type { SparkClient } from './sparkClient';
import BigNumber from 'bignumber.js';

/**
 * Oracle Client
 *
 * Handles price feed operations for the Spark Protocol.
 * All prices are returned in base currency (typically USD) with 8 decimals.
 */

export interface AssetPrice {
  asset: string;
  price: string;
  priceFormatted: string;
  decimals: number;
}

export interface PriceValidation {
  isValid: boolean;
  price: string;
  source: string;
  staleness?: number;
  deviation?: number;
}

// Price precision (8 decimals for USD)
const PRICE_DECIMALS = 8;

/**
 * Get price for a single asset
 */
export async function getAssetPrice(
  client: SparkClient,
  assetAddress: string,
): Promise<AssetPrice> {
  const price = await client.contracts.oracle.getAssetPrice(assetAddress);
  const priceBN = new BigNumber(price.toString());
  const priceFormatted = priceBN.dividedBy(10 ** PRICE_DECIMALS).toString();

  return {
    asset: assetAddress,
    price: price.toString(),
    priceFormatted,
    decimals: PRICE_DECIMALS,
  };
}

/**
 * Get prices for multiple assets
 */
export async function getAssetsPrices(
  client: SparkClient,
  assetAddresses: string[],
): Promise<AssetPrice[]> {
  const prices = await client.contracts.oracle.getAssetsPrices(assetAddresses);

  return assetAddresses.map((asset, index) => {
    const price = prices[index];
    const priceBN = new BigNumber(price.toString());
    const priceFormatted = priceBN.dividedBy(10 ** PRICE_DECIMALS).toString();

    return {
      asset,
      price: price.toString(),
      priceFormatted,
      decimals: PRICE_DECIMALS,
    };
  });
}

/**
 * Get the price source (oracle address) for an asset
 */
export async function getSourceOfAsset(
  client: SparkClient,
  assetAddress: string,
): Promise<string> {
  return await client.contracts.oracle.getSourceOfAsset(assetAddress);
}

/**
 * Get the fallback oracle address
 */
export async function getFallbackOracle(client: SparkClient): Promise<string> {
  return await client.contracts.oracle.getFallbackOracle();
}

/**
 * Calculate USD value of token amount
 */
export async function calculateUsdValue(
  client: SparkClient,
  assetAddress: string,
  amount: string,
  tokenDecimals: number,
): Promise<{
  amount: string;
  price: string;
  usdValue: string;
}> {
  const priceData = await getAssetPrice(client, assetAddress);

  const amountBN = new BigNumber(amount);
  const priceBN = new BigNumber(priceData.price);

  // USD value = (amount / 10^tokenDecimals) * (price / 10^priceDecimals)
  const tokenValue = amountBN.dividedBy(10 ** tokenDecimals);
  const priceValue = priceBN.dividedBy(10 ** PRICE_DECIMALS);
  const usdValue = tokenValue.multipliedBy(priceValue);

  return {
    amount,
    price: priceData.priceFormatted,
    usdValue: usdValue.toFixed(2),
  };
}

/**
 * Convert amount from one asset to another using oracle prices
 */
export async function convertAmount(
  client: SparkClient,
  fromAsset: string,
  toAsset: string,
  amount: string,
  fromDecimals: number,
  toDecimals: number,
): Promise<{
  inputAmount: string;
  outputAmount: string;
  fromPrice: string;
  toPrice: string;
  exchangeRate: string;
}> {
  const [fromPrice, toPrice] = await getAssetsPrices(client, [fromAsset, toAsset]);

  const fromPriceBN = new BigNumber(fromPrice.price);
  const toPriceBN = new BigNumber(toPrice.price);
  const amountBN = new BigNumber(amount);

  // Calculate exchange rate: fromPrice / toPrice
  const exchangeRate = fromPriceBN.dividedBy(toPriceBN);

  // Convert: (amount / 10^fromDecimals) * exchangeRate * 10^toDecimals
  const outputAmount = amountBN
    .dividedBy(10 ** fromDecimals)
    .multipliedBy(exchangeRate)
    .multipliedBy(10 ** toDecimals)
    .integerValue();

  return {
    inputAmount: amount,
    outputAmount: outputAmount.toString(),
    fromPrice: fromPrice.priceFormatted,
    toPrice: toPrice.priceFormatted,
    exchangeRate: exchangeRate.toString(),
  };
}

/**
 * Calculate liquidation price for a position
 */
export async function calculateLiquidationPrice(
  client: SparkClient,
  collateralAsset: string,
  debtAsset: string,
  collateralAmount: string,
  debtAmount: string,
  collateralDecimals: number,
  debtDecimals: number,
  liquidationThreshold: number, // In basis points (8000 = 80%)
): Promise<{
  liquidationPrice: string;
  currentPrice: string;
  priceDropPercent: string;
  isAtRisk: boolean;
}> {
  const [collateralPriceData, debtPriceData] = await getAssetsPrices(client, [
    collateralAsset,
    debtAsset,
  ]);

  const collateralPrice = new BigNumber(collateralPriceData.price);
  const debtPrice = new BigNumber(debtPriceData.price);
  const collateralAmt = new BigNumber(collateralAmount);
  const debtAmt = new BigNumber(debtAmount);
  const threshold = new BigNumber(liquidationThreshold).dividedBy(10000);

  // Current collateral value in base currency
  const collateralValue = collateralAmt
    .dividedBy(10 ** collateralDecimals)
    .multipliedBy(collateralPrice);

  // Debt value in base currency
  const debtValue = debtAmt.dividedBy(10 ** debtDecimals).multipliedBy(debtPrice);

  // Liquidation happens when: collateralValue * liquidationThreshold = debtValue
  // So liquidation price = (debtValue / (collateralAmount * liquidationThreshold)) * priceDecimals
  const liquidationPriceRaw = debtValue
    .dividedBy(collateralAmt.dividedBy(10 ** collateralDecimals).multipliedBy(threshold));

  const currentPriceFormatted = new BigNumber(collateralPriceData.priceFormatted);
  const liquidationPriceFormatted = liquidationPriceRaw.dividedBy(10 ** PRICE_DECIMALS);

  // Calculate how much the price needs to drop
  const priceDropPercent = currentPriceFormatted
    .minus(liquidationPriceFormatted)
    .dividedBy(currentPriceFormatted)
    .multipliedBy(100);

  return {
    liquidationPrice: liquidationPriceFormatted.toFixed(2),
    currentPrice: collateralPriceData.priceFormatted,
    priceDropPercent: priceDropPercent.toFixed(2),
    isAtRisk: priceDropPercent.lt(20), // Less than 20% buffer
  };
}

/**
 * Validate price is within acceptable bounds
 */
export async function validatePrice(
  client: SparkClient,
  assetAddress: string,
  expectedPrice?: string,
  maxDeviation: number = 500, // 5% in basis points
): Promise<PriceValidation> {
  const priceData = await getAssetPrice(client, assetAddress);
  const source = await getSourceOfAsset(client, assetAddress);

  // Check if price is zero (invalid)
  if (priceData.price === '0') {
    return {
      isValid: false,
      price: priceData.price,
      source,
    };
  }

  // If expected price provided, check deviation
  if (expectedPrice) {
    const expected = new BigNumber(expectedPrice);
    const actual = new BigNumber(priceData.price);
    const deviation = actual.minus(expected).abs().dividedBy(expected).multipliedBy(10000);

    return {
      isValid: deviation.lte(maxDeviation),
      price: priceData.priceFormatted,
      source,
      deviation: deviation.toNumber(),
    };
  }

  return {
    isValid: true,
    price: priceData.priceFormatted,
    source,
  };
}

/**
 * Get historical price from block number (requires archive node)
 */
export async function getHistoricalPrice(
  client: SparkClient,
  assetAddress: string,
  blockNumber: number,
): Promise<AssetPrice> {
  const price = await client.contracts.oracle.getAssetPrice(assetAddress, {
    blockTag: blockNumber,
  });

  const priceBN = new BigNumber(price.toString());
  const priceFormatted = priceBN.dividedBy(10 ** PRICE_DECIMALS).toString();

  return {
    asset: assetAddress,
    price: price.toString(),
    priceFormatted,
    decimals: PRICE_DECIMALS,
  };
}

/**
 * Format price for display
 */
export function formatPrice(
  price: string | bigint,
  symbol: string = 'USD',
  decimals: number = PRICE_DECIMALS,
): string {
  const priceBN = new BigNumber(price.toString());
  const formatted = priceBN.dividedBy(10 ** decimals);

  if (formatted.gte(1000000)) {
    return `$${formatted.dividedBy(1000000).toFixed(2)}M`;
  }
  if (formatted.gte(1000)) {
    return `$${formatted.dividedBy(1000).toFixed(2)}K`;
  }
  if (formatted.lt(0.01)) {
    return `$${formatted.toFixed(6)}`;
  }

  return `$${formatted.toFixed(2)}`;
}
