/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import BigNumber from 'bignumber.js';

/**
 * Health Factor Utilities
 *
 * Health Factor is a key metric in DeFi lending that indicates the safety
 * of a position. It's calculated as:
 *
 * Health Factor = (Total Collateral * Weighted Avg Liquidation Threshold) / Total Debt
 *
 * - Health Factor > 1: Position is safe
 * - Health Factor = 1: Position can be liquidated
 * - Health Factor < 1: Position is underwater (can be fully liquidated)
 *
 * Spark Protocol uses 18 decimal precision for health factor.
 */

// Constants
const HEALTH_FACTOR_DECIMALS = 18;
const HEALTH_FACTOR_ONE = new BigNumber(10).pow(HEALTH_FACTOR_DECIMALS);
const BASIS_POINTS = 10000;

export interface HealthFactorStatus {
  value: string;
  numericValue: number;
  status: 'safe' | 'warning' | 'danger' | 'liquidatable';
  description: string;
  percentToLiquidation: number;
}

/**
 * Parse health factor from raw value (18 decimals)
 */
export function parseHealthFactor(rawValue: string | bigint): number {
  const bn = new BigNumber(rawValue.toString());
  return bn.dividedBy(HEALTH_FACTOR_ONE).toNumber();
}

/**
 * Format health factor for display
 */
export function formatHealthFactor(rawValue: string | bigint): string {
  const numeric = parseHealthFactor(rawValue);
  if (!isFinite(numeric) || numeric > 1000000) {
    return '∞'; // Infinite health factor (no debt)
  }
  return numeric.toFixed(2);
}

/**
 * Get health factor status with description
 */
export function getHealthFactorStatus(rawValue: string | bigint): HealthFactorStatus {
  const numeric = parseHealthFactor(rawValue);
  const formatted = formatHealthFactor(rawValue);

  // No debt = infinite health factor
  if (!isFinite(numeric) || numeric > 1000000) {
    return {
      value: formatted,
      numericValue: Infinity,
      status: 'safe',
      description: 'No debt - position is completely safe',
      percentToLiquidation: 100,
    };
  }

  // Calculate percentage to liquidation
  const percentToLiquidation = Math.max(0, ((numeric - 1) / numeric) * 100);

  if (numeric > 2) {
    return {
      value: formatted,
      numericValue: numeric,
      status: 'safe',
      description: 'Position is healthy with significant buffer',
      percentToLiquidation,
    };
  }

  if (numeric > 1.5) {
    return {
      value: formatted,
      numericValue: numeric,
      status: 'safe',
      description: 'Position is safe but monitor regularly',
      percentToLiquidation,
    };
  }

  if (numeric > 1.1) {
    return {
      value: formatted,
      numericValue: numeric,
      status: 'warning',
      description: 'Position is approaching danger zone - consider reducing debt',
      percentToLiquidation,
    };
  }

  if (numeric > 1) {
    return {
      value: formatted,
      numericValue: numeric,
      status: 'danger',
      description: 'Position is at risk of liquidation - immediate action recommended',
      percentToLiquidation,
    };
  }

  return {
    value: formatted,
    numericValue: numeric,
    status: 'liquidatable',
    description: 'Position can be liquidated immediately',
    percentToLiquidation: 0,
  };
}

/**
 * Calculate health factor from collateral and debt
 */
export function calculateHealthFactor(
  totalCollateralBase: string | bigint,
  totalDebtBase: string | bigint,
  liquidationThreshold: number, // In basis points (e.g., 8000 = 80%)
): string {
  const collateral = new BigNumber(totalCollateralBase.toString());
  const debt = new BigNumber(totalDebtBase.toString());

  if (debt.isZero()) {
    return 'Infinity';
  }

  const threshold = new BigNumber(liquidationThreshold).dividedBy(BASIS_POINTS);
  const healthFactor = collateral.multipliedBy(threshold).dividedBy(debt);

  return healthFactor.toString();
}

/**
 * Calculate maximum borrowable amount while maintaining target health factor
 */
export function calculateMaxBorrow(
  totalCollateralBase: string | bigint,
  totalDebtBase: string | bigint,
  ltv: number, // In basis points
  targetHealthFactor: number = 1.5,
): string {
  const collateral = new BigNumber(totalCollateralBase.toString());
  const currentDebt = new BigNumber(totalDebtBase.toString());
  const ltvDecimal = new BigNumber(ltv).dividedBy(BASIS_POINTS);

  // Max borrow = (Collateral * LTV / Target HF) - Current Debt
  const maxTotalDebt = collateral.multipliedBy(ltvDecimal).dividedBy(targetHealthFactor);
  const maxNewBorrow = maxTotalDebt.minus(currentDebt);

  return maxNewBorrow.isPositive() ? maxNewBorrow.toString() : '0';
}

/**
 * Calculate amount to repay to reach target health factor
 */
export function calculateRepayForHealthFactor(
  totalCollateralBase: string | bigint,
  totalDebtBase: string | bigint,
  liquidationThreshold: number, // In basis points
  targetHealthFactor: number,
): string {
  const collateral = new BigNumber(totalCollateralBase.toString());
  const currentDebt = new BigNumber(totalDebtBase.toString());
  const threshold = new BigNumber(liquidationThreshold).dividedBy(BASIS_POINTS);

  // Target debt = Collateral * Threshold / Target HF
  const targetDebt = collateral.multipliedBy(threshold).dividedBy(targetHealthFactor);
  const amountToRepay = currentDebt.minus(targetDebt);

  return amountToRepay.isPositive() ? amountToRepay.toString() : '0';
}

/**
 * Calculate liquidation price for a position
 */
export function calculateLiquidationPrice(
  collateralAmount: string | bigint,
  collateralPrice: string | bigint,
  debtAmount: string | bigint,
  liquidationThreshold: number, // In basis points
): string {
  const collateral = new BigNumber(collateralAmount.toString());
  const debt = new BigNumber(debtAmount.toString());
  const threshold = new BigNumber(liquidationThreshold).dividedBy(BASIS_POINTS);

  if (collateral.isZero()) {
    return '0';
  }

  // Liquidation price = Debt / (Collateral * Liquidation Threshold)
  const liquidationPrice = debt.dividedBy(collateral.multipliedBy(threshold));

  return liquidationPrice.toString();
}

/**
 * Check if position can be liquidated
 */
export function isLiquidatable(rawHealthFactor: string | bigint): boolean {
  const numeric = parseHealthFactor(rawHealthFactor);
  return isFinite(numeric) && numeric < 1;
}

/**
 * Calculate close factor (percentage of debt that can be liquidated)
 */
export function calculateCloseFactor(rawHealthFactor: string | bigint): number {
  const numeric = parseHealthFactor(rawHealthFactor);

  if (!isFinite(numeric) || numeric >= 1) {
    return 0; // Cannot liquidate
  }

  if (numeric < 0.95) {
    return 100; // Full liquidation allowed
  }

  // Partial liquidation (typically 50%)
  return 50;
}
