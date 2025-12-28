/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';

/**
 * Math Utilities for DeFi Calculations
 *
 * Provides precision-safe mathematical operations commonly used
 * in DeFi protocols like Spark.
 */

// Configure BigNumber for maximum precision
BigNumber.config({
  DECIMAL_PLACES: 27,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  EXPONENTIAL_AT: [-50, 50],
});

// Constants
export const RAY = new BigNumber(10).pow(27);
export const WAD = new BigNumber(10).pow(18);
export const HALF_RAY = RAY.dividedBy(2);
export const HALF_WAD = WAD.dividedBy(2);
export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

/**
 * Multiply two WAD values and return a WAD result
 * Result = (a * b + HALF_WAD) / WAD
 */
export function wadMul(a: string | bigint, b: string | bigint): string {
  const aBN = new BigNumber(a.toString());
  const bBN = new BigNumber(b.toString());

  if (aBN.isZero() || bBN.isZero()) {
    return '0';
  }

  return aBN.multipliedBy(bBN).plus(HALF_WAD).dividedBy(WAD).integerValue().toString();
}

/**
 * Divide two WAD values and return a WAD result
 * Result = (a * WAD + b/2) / b
 */
export function wadDiv(a: string | bigint, b: string | bigint): string {
  const aBN = new BigNumber(a.toString());
  const bBN = new BigNumber(b.toString());

  if (bBN.isZero()) {
    throw new Error('Division by zero');
  }

  return aBN.multipliedBy(WAD).plus(bBN.dividedBy(2)).dividedBy(bBN).integerValue().toString();
}

/**
 * Multiply two RAY values and return a RAY result
 * Result = (a * b + HALF_RAY) / RAY
 */
export function rayMul(a: string | bigint, b: string | bigint): string {
  const aBN = new BigNumber(a.toString());
  const bBN = new BigNumber(b.toString());

  if (aBN.isZero() || bBN.isZero()) {
    return '0';
  }

  return aBN.multipliedBy(bBN).plus(HALF_RAY).dividedBy(RAY).integerValue().toString();
}

/**
 * Divide two RAY values and return a RAY result
 * Result = (a * RAY + b/2) / b
 */
export function rayDiv(a: string | bigint, b: string | bigint): string {
  const aBN = new BigNumber(a.toString());
  const bBN = new BigNumber(b.toString());

  if (bBN.isZero()) {
    throw new Error('Division by zero');
  }

  return aBN.multipliedBy(RAY).plus(bBN.dividedBy(2)).dividedBy(bBN).integerValue().toString();
}

/**
 * Convert RAY to WAD
 */
export function rayToWad(ray: string | bigint): string {
  const rayBN = new BigNumber(ray.toString());
  const wad = rayBN.dividedBy(new BigNumber(10).pow(9));
  return wad.integerValue().toString();
}

/**
 * Convert WAD to RAY
 */
export function wadToRay(wad: string | bigint): string {
  const wadBN = new BigNumber(wad.toString());
  return wadBN.multipliedBy(new BigNumber(10).pow(9)).toString();
}

/**
 * Calculate percentage of a value
 * @param value - The base value
 * @param percentage - Percentage in basis points (10000 = 100%)
 */
export function percentOf(value: string | bigint, percentage: number): string {
  const valueBN = new BigNumber(value.toString());
  return valueBN.multipliedBy(percentage).dividedBy(10000).integerValue().toString();
}

/**
 * Calculate the minimum of two values
 */
export function min(a: string | bigint, b: string | bigint): string {
  const aBN = new BigNumber(a.toString());
  const bBN = new BigNumber(b.toString());
  return BigNumber.min(aBN, bBN).toString();
}

/**
 * Calculate the maximum of two values
 */
export function max(a: string | bigint, b: string | bigint): string {
  const aBN = new BigNumber(a.toString());
  const bBN = new BigNumber(b.toString());
  return BigNumber.max(aBN, bBN).toString();
}

/**
 * Scale a value by token decimals
 */
export function scaleToDecimals(value: string | number, decimals: number): string {
  const valueBN = new BigNumber(value.toString());
  return valueBN.multipliedBy(new BigNumber(10).pow(decimals)).integerValue().toString();
}

/**
 * Unscale a value from token decimals
 */
export function unscaleFromDecimals(value: string | bigint, decimals: number): string {
  const valueBN = new BigNumber(value.toString());
  return valueBN.dividedBy(new BigNumber(10).pow(decimals)).toString();
}

/**
 * Format value with decimals for display
 */
export function formatWithDecimals(
  value: string | bigint,
  decimals: number,
  displayDecimals: number = 4,
): string {
  const valueBN = new BigNumber(value.toString());
  const scaled = valueBN.dividedBy(new BigNumber(10).pow(decimals));
  return scaled.toFixed(displayDecimals);
}

/**
 * Check if value is within slippage tolerance
 */
export function isWithinSlippage(
  expected: string | bigint,
  actual: string | bigint,
  slippageBps: number = 50, // 0.5% default
): boolean {
  const expectedBN = new BigNumber(expected.toString());
  const actualBN = new BigNumber(actual.toString());

  if (expectedBN.isZero()) {
    return actualBN.isZero();
  }

  const difference = expectedBN.minus(actualBN).abs();
  const maxSlippage = expectedBN.multipliedBy(slippageBps).dividedBy(10000);

  return difference.lte(maxSlippage);
}

/**
 * Calculate value with slippage
 */
export function withSlippage(
  value: string | bigint,
  slippageBps: number,
  direction: 'increase' | 'decrease' = 'decrease',
): string {
  const valueBN = new BigNumber(value.toString());
  const slippageAmount = valueBN.multipliedBy(slippageBps).dividedBy(10000);

  if (direction === 'increase') {
    return valueBN.plus(slippageAmount).integerValue().toString();
  }

  return valueBN.minus(slippageAmount).integerValue().toString();
}

/**
 * Validate that a value is a valid uint256
 */
export function isValidUint256(value: string | bigint): boolean {
  try {
    const valueBN = new BigNumber(value.toString());
    return valueBN.isInteger() && valueBN.gte(0) && valueBN.lte(MAX_UINT256);
  } catch {
    return false;
  }
}

/**
 * Compare two values
 * Returns: -1 if a < b, 0 if a = b, 1 if a > b
 */
export function compare(a: string | bigint, b: string | bigint): number {
  const aBN = new BigNumber(a.toString());
  const bBN = new BigNumber(b.toString());
  return aBN.comparedTo(bBN);
}

/**
 * Check if value is zero
 */
export function isZero(value: string | bigint): boolean {
  return new BigNumber(value.toString()).isZero();
}

/**
 * Add two values
 */
export function add(a: string | bigint, b: string | bigint): string {
  return new BigNumber(a.toString()).plus(b.toString()).toString();
}

/**
 * Subtract two values
 */
export function sub(a: string | bigint, b: string | bigint): string {
  return new BigNumber(a.toString()).minus(b.toString()).toString();
}

/**
 * Multiply two values
 */
export function mul(a: string | bigint, b: string | bigint): string {
  return new BigNumber(a.toString()).multipliedBy(b.toString()).toString();
}

/**
 * Divide two values
 */
export function div(a: string | bigint, b: string | bigint): string {
  const bBN = new BigNumber(b.toString());
  if (bBN.isZero()) {
    throw new Error('Division by zero');
  }
  return new BigNumber(a.toString()).dividedBy(bBN).integerValue().toString();
}
