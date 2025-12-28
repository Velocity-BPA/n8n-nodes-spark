/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';

/**
 * Interest Rate Utilities
 *
 * Spark Protocol (like Aave V3) uses RAY precision (27 decimals) for interest rates.
 * Rates are expressed as per-second rates that compound continuously.
 *
 * Key concepts:
 * - RAY = 10^27 (27 decimals)
 * - Rates are per-second compounding rates
 * - APY = (1 + rate/seconds_per_year)^seconds_per_year - 1
 */

// Constants
const RAY = new BigNumber(10).pow(27);
const WAD = new BigNumber(10).pow(18);
const SECONDS_PER_YEAR = 31536000; // 365 days
const BASIS_POINTS = 10000;

/**
 * Convert RAY rate to APY percentage
 */
export function rayToApy(rayRate: string | bigint): number {
  const rate = new BigNumber(rayRate.toString());
  const ratePerSecond = rate.dividedBy(RAY);

  // APY = (1 + rate)^seconds_per_year - 1
  const apy = ratePerSecond.plus(1).pow(SECONDS_PER_YEAR).minus(1);

  return apy.multipliedBy(100).toNumber();
}

/**
 * Convert RAY rate to APR percentage (simple rate, no compounding)
 */
export function rayToApr(rayRate: string | bigint): number {
  const rate = new BigNumber(rayRate.toString());
  const ratePerSecond = rate.dividedBy(RAY);

  // APR = rate * seconds_per_year
  const apr = ratePerSecond.multipliedBy(SECONDS_PER_YEAR);

  return apr.multipliedBy(100).toNumber();
}

/**
 * Format rate as percentage string
 */
export function formatRate(rayRate: string | bigint, useApy: boolean = true): string {
  const percentage = useApy ? rayToApy(rayRate) : rayToApr(rayRate);
  return `${percentage.toFixed(2)}%`;
}

/**
 * Calculate utilization rate
 * Utilization = Total Borrowed / (Total Supplied)
 */
export function calculateUtilization(
  totalBorrowed: string | bigint,
  totalSupplied: string | bigint,
): number {
  const borrowed = new BigNumber(totalBorrowed.toString());
  const supplied = new BigNumber(totalSupplied.toString());

  if (supplied.isZero()) {
    return 0;
  }

  return borrowed.dividedBy(supplied).multipliedBy(100).toNumber();
}

/**
 * Calculate supply APY from borrow APY and utilization
 * Supply APY = Borrow APY * Utilization * (1 - Reserve Factor)
 */
export function calculateSupplyApy(
  borrowApy: number,
  utilization: number,
  reserveFactor: number = 0, // In percentage (e.g., 10 for 10%)
): number {
  const utilizationDecimal = utilization / 100;
  const reserveFactorDecimal = reserveFactor / 100;

  return borrowApy * utilizationDecimal * (1 - reserveFactorDecimal);
}

/**
 * Calculate borrow rate using the interest rate strategy
 *
 * Spark uses a two-slope interest rate model:
 * - Below optimal utilization: base rate + (utilization / optimal) * slope1
 * - Above optimal utilization: base rate + slope1 + ((utilization - optimal) / (1 - optimal)) * slope2
 */
export function calculateBorrowRate(
  utilization: number, // 0-100
  baseRate: number, // In percentage
  slope1: number, // In percentage
  slope2: number, // In percentage
  optimalUtilization: number = 80, // In percentage
): number {
  const utilizationDecimal = utilization / 100;
  const optimalDecimal = optimalUtilization / 100;

  if (utilization <= optimalUtilization) {
    const utilizationRatio = utilizationDecimal / optimalDecimal;
    return baseRate + utilizationRatio * slope1;
  }

  const excessUtilization = utilizationDecimal - optimalDecimal;
  const excessCapacity = 1 - optimalDecimal;
  const excessRate = (excessUtilization / excessCapacity) * slope2;

  return baseRate + slope1 + excessRate;
}

/**
 * Calculate accrued interest over time
 */
export function calculateAccruedInterest(
  principal: string | bigint,
  rayRate: string | bigint,
  secondsElapsed: number,
): string {
  const principalBN = new BigNumber(principal.toString());
  const rate = new BigNumber(rayRate.toString()).dividedBy(RAY);

  // Interest = Principal * ((1 + rate)^time - 1)
  const multiplier = rate.plus(1).pow(secondsElapsed).minus(1);
  const interest = principalBN.multipliedBy(multiplier);

  return interest.integerValue(BigNumber.ROUND_DOWN).toString();
}

/**
 * Calculate future balance with compounding
 */
export function calculateFutureBalance(
  principal: string | bigint,
  rayRate: string | bigint,
  secondsInFuture: number,
): string {
  const principalBN = new BigNumber(principal.toString());
  const rate = new BigNumber(rayRate.toString()).dividedBy(RAY);

  // Future Balance = Principal * (1 + rate)^time
  const multiplier = rate.plus(1).pow(secondsInFuture);
  const futureBalance = principalBN.multipliedBy(multiplier);

  return futureBalance.integerValue(BigNumber.ROUND_DOWN).toString();
}

/**
 * Calculate Net APY (weighted average of supply and borrow rates)
 */
export function calculateNetApy(
  supplyBalances: Array<{ amount: string; apy: number }>,
  borrowBalances: Array<{ amount: string; apy: number }>,
): number {
  let totalSupplyValue = new BigNumber(0);
  let totalBorrowValue = new BigNumber(0);
  let weightedSupplyApy = new BigNumber(0);
  let weightedBorrowApy = new BigNumber(0);

  for (const supply of supplyBalances) {
    const amount = new BigNumber(supply.amount);
    totalSupplyValue = totalSupplyValue.plus(amount);
    weightedSupplyApy = weightedSupplyApy.plus(amount.multipliedBy(supply.apy));
  }

  for (const borrow of borrowBalances) {
    const amount = new BigNumber(borrow.amount);
    totalBorrowValue = totalBorrowValue.plus(amount);
    weightedBorrowApy = weightedBorrowApy.plus(amount.multipliedBy(borrow.apy));
  }

  const netPosition = totalSupplyValue.minus(totalBorrowValue);

  if (netPosition.isZero()) {
    return 0;
  }

  const supplyYield = totalSupplyValue.isZero()
    ? new BigNumber(0)
    : weightedSupplyApy.dividedBy(totalSupplyValue).multipliedBy(totalSupplyValue);

  const borrowCost = totalBorrowValue.isZero()
    ? new BigNumber(0)
    : weightedBorrowApy.dividedBy(totalBorrowValue).multipliedBy(totalBorrowValue);

  const netYield = supplyYield.minus(borrowCost);
  const netApy = netYield.dividedBy(netPosition.abs());

  return netApy.toNumber();
}

/**
 * Convert basis points to percentage
 */
export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / BASIS_POINTS * 100;
}

/**
 * Convert percentage to basis points
 */
export function percentToBasisPoints(percent: number): number {
  return (percent / 100) * BASIS_POINTS;
}

/**
 * Format APY for display
 */
export function formatApy(apy: number): string {
  if (apy < 0.01 && apy > 0) {
    return '<0.01%';
  }
  if (apy > 1000) {
    return `${(apy / 1000).toFixed(1)}K%`;
  }
  return `${apy.toFixed(2)}%`;
}
