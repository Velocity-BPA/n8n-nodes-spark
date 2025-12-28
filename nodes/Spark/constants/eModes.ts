/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * E-Mode (Efficiency Mode) Configurations
 *
 * E-Mode allows users to achieve higher capital efficiency when
 * borrowing assets that are correlated in price (e.g., stablecoins or ETH derivatives).
 *
 * When E-Mode is enabled for a user, the LTV and liquidation thresholds
 * are increased for the correlated assets in that category.
 */

export interface EModeConfig {
  id: number;
  label: string;
  ltv: number; // In basis points (10000 = 100%)
  liquidationThreshold: number; // In basis points
  liquidationBonus: number; // In basis points (10200 = 2% bonus)
  priceSource: string; // Oracle price source
  assets: string[]; // Token symbols included in this E-Mode
}

export const E_MODES: Record<string, Record<number, EModeConfig>> = {
  ethereum: {
    0: {
      id: 0,
      label: 'No E-Mode',
      ltv: 0,
      liquidationThreshold: 0,
      liquidationBonus: 0,
      priceSource: '0x0000000000000000000000000000000000000000',
      assets: [],
    },
    1: {
      id: 1,
      label: 'Stablecoins',
      ltv: 9700, // 97%
      liquidationThreshold: 9750, // 97.5%
      liquidationBonus: 10100, // 1% bonus
      priceSource: '0x0000000000000000000000000000000000000000', // Uses individual asset oracles
      assets: ['DAI', 'USDC', 'USDT', 'sDAI'],
    },
    2: {
      id: 2,
      label: 'ETH Correlated',
      ltv: 9300, // 93%
      liquidationThreshold: 9500, // 95%
      liquidationBonus: 10100, // 1% bonus
      priceSource: '0x0000000000000000000000000000000000000000',
      assets: ['WETH', 'wstETH', 'rETH', 'cbETH'],
    },
  },
  gnosis: {
    0: {
      id: 0,
      label: 'No E-Mode',
      ltv: 0,
      liquidationThreshold: 0,
      liquidationBonus: 0,
      priceSource: '0x0000000000000000000000000000000000000000',
      assets: [],
    },
    1: {
      id: 1,
      label: 'Stablecoins',
      ltv: 9700,
      liquidationThreshold: 9750,
      liquidationBonus: 10100,
      priceSource: '0x0000000000000000000000000000000000000000',
      assets: ['WXDAI', 'sDAI', 'USDC'],
    },
  },
};

/**
 * Get E-Mode configuration by network and category ID
 */
export function getEModeConfig(network: string, categoryId: number): EModeConfig | undefined {
  return E_MODES[network]?.[categoryId];
}

/**
 * Get all E-Mode categories for a network
 */
export function getNetworkEModes(network: string): EModeConfig[] {
  const modes = E_MODES[network];
  return modes ? Object.values(modes) : [];
}

/**
 * Check if an asset is part of an E-Mode category
 */
export function isAssetInEMode(network: string, categoryId: number, assetSymbol: string): boolean {
  const config = getEModeConfig(network, categoryId);
  return config ? config.assets.includes(assetSymbol) : false;
}

/**
 * Get E-Mode category for a user based on their holdings
 * Returns the E-Mode ID if all assets are in the same category, 0 otherwise
 */
export function suggestEMode(network: string, assetSymbols: string[]): number {
  if (assetSymbols.length === 0) return 0;

  const modes = E_MODES[network];
  if (!modes) return 0;

  for (const [id, config] of Object.entries(modes)) {
    if (Number(id) === 0) continue;
    const allInCategory = assetSymbols.every((symbol) => config.assets.includes(symbol));
    if (allInCategory) return config.id;
  }

  return 0;
}

/**
 * E-Mode Benefits Explanation
 */
export const E_MODE_BENEFITS = {
  HIGHER_LTV: 'Increased Loan-to-Value ratio for correlated assets',
  HIGHER_LIQUIDATION_THRESHOLD: 'Higher liquidation threshold provides more buffer before liquidation',
  LOWER_LIQUIDATION_BONUS: 'Lower liquidation bonus means less penalty if liquidated',
  CAPITAL_EFFICIENCY: 'Borrow more against your collateral with correlated assets',
} as const;
