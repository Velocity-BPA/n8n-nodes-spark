/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Spark Protocol Reserve (Token) Configurations
 *
 * Each reserve in Spark Protocol has specific parameters including
 * LTV, liquidation thresholds, and token addresses.
 */

export interface ReserveConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  spTokenAddress: string;
  stableDebtTokenAddress: string;
  variableDebtTokenAddress: string;
  // Collateral parameters (in basis points, 10000 = 100%)
  ltv: number;
  liquidationThreshold: number;
  liquidationBonus: number;
  // Reserve features
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
  // Caps
  supplyCap: string;
  borrowCap: string;
}

export const RESERVES: Record<string, Record<string, ReserveConfig>> = {
  ethereum: {
    DAI: {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EescdeCB5BE3830',
      decimals: 18,
      spTokenAddress: '0x4DEDf26112B3Ec8eC46e7E31EA5e123490B05B8B',
      stableDebtTokenAddress: '0xfe2B7a7F4cC0Fb76f7Fc1C6518D586F1e4559176',
      variableDebtTokenAddress: '0xf705d2B7e92B3F38e6ae7afaDAA2fEE110fE5914',
      ltv: 7700,
      liquidationThreshold: 8000,
      liquidationBonus: 10400,
      borrowingEnabled: true,
      stableBorrowRateEnabled: true,
      isActive: true,
      isFrozen: false,
      supplyCap: '0',
      borrowCap: '0',
    },
    WETH: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
      spTokenAddress: '0x59cD1C87501baa753d0B5B5Ab5D8416A45cD71DB',
      stableDebtTokenAddress: '0x4Ae5E4409C6Dbc84A00f9f89e4ba096603fb7d50',
      variableDebtTokenAddress: '0x2e7576042566f8D6990e07A1B61Ad1efd86Ae70d',
      ltv: 8000,
      liquidationThreshold: 8250,
      liquidationBonus: 10500,
      borrowingEnabled: true,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '0',
      borrowCap: '0',
    },
    sDAI: {
      symbol: 'sDAI',
      name: 'Savings Dai',
      address: '0x83F20F44975D03b1b09e64809B757c47f942BEea',
      decimals: 18,
      spTokenAddress: '0x78f897F0fE2d3B5690EbAe7f19862DEacedF10a7',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      ltv: 7700,
      liquidationThreshold: 8000,
      liquidationBonus: 10400,
      borrowingEnabled: false,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '0',
      borrowCap: '0',
    },
    wstETH: {
      symbol: 'wstETH',
      name: 'Wrapped stETH',
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      decimals: 18,
      spTokenAddress: '0x12B54025C112Aa61fAce2CDB7118740875A566E9',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0xd5c3E3B566a42A6110513Ac7670C1a86D76E13E6',
      ltv: 6850,
      liquidationThreshold: 7950,
      liquidationBonus: 10700,
      borrowingEnabled: true,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '400000',
      borrowCap: '3000',
    },
    rETH: {
      symbol: 'rETH',
      name: 'Rocket Pool ETH',
      address: '0xae78736Cd615f374D3085123A210448E74Fc6393',
      decimals: 18,
      spTokenAddress: '0x9985dF20D7e9103ECBCeb16a84956434B6f06ae8',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0x852a4599217E76aA725F0Ada8BF832a1F57a8A91',
      ltv: 6850,
      liquidationThreshold: 7950,
      liquidationBonus: 10700,
      borrowingEnabled: true,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '60000',
      borrowCap: '2400',
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      spTokenAddress: '0x377C3bd93f2a2984E1E7bE6A5C22c525eD4A4815',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0x7B70D04099CB9cfb1Db7B6820baDAfB4C5C70A67',
      ltv: 7700,
      liquidationThreshold: 8000,
      liquidationBonus: 10400,
      borrowingEnabled: true,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '60000000',
      borrowCap: '57000000',
    },
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
      spTokenAddress: '0xE5E4D25415Cc80fC7d1D64a48d33b6A92CD4bB42',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0x529B2C73b88B9E1e0B3A6C971E1D3b0E95e8b8e8',
      ltv: 0,
      liquidationThreshold: 0,
      liquidationBonus: 0,
      borrowingEnabled: true,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '10000000',
      borrowCap: '9000000',
    },
    WBTC: {
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      spTokenAddress: '0x4197ba364AE6698015AE5c1468f54087602715b2',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0xA1773F1ccF6DB192Ad8FE826D15fe1d328B03284',
      ltv: 7000,
      liquidationThreshold: 7500,
      liquidationBonus: 10600,
      borrowingEnabled: true,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '5000',
      borrowCap: '2500',
    },
    GNO: {
      symbol: 'GNO',
      name: 'Gnosis Token',
      address: '0x6810e776880C02933D47DB1b9fc05908e5386b96',
      decimals: 18,
      spTokenAddress: '0x7b481aCC9fDADDc9af2cBa4167B05f52A7B7d211',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0xf8Ff4c2f6dB89E2b7d5A0C0d5B8A9D5C9E8F7A6B',
      ltv: 4800,
      liquidationThreshold: 6300,
      liquidationBonus: 11000,
      borrowingEnabled: false,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '100000',
      borrowCap: '0',
    },
  },
  gnosis: {
    WXDAI: {
      symbol: 'WXDAI',
      name: 'Wrapped xDAI',
      address: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
      decimals: 18,
      spTokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      ltv: 7700,
      liquidationThreshold: 8000,
      liquidationBonus: 10400,
      borrowingEnabled: true,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '0',
      borrowCap: '0',
    },
    sDAI: {
      symbol: 'sDAI',
      name: 'Savings Dai',
      address: '0xaf204776c7245bF4147c2612BF6e5972Ee483701',
      decimals: 18,
      spTokenAddress: '0x234567890abcdef1234567890abcdef123456789',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      ltv: 7700,
      liquidationThreshold: 8000,
      liquidationBonus: 10400,
      borrowingEnabled: false,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '0',
      borrowCap: '0',
    },
    WETH: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
      decimals: 18,
      spTokenAddress: '0x34567890abcdef1234567890abcdef1234567890',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0xbcdef1234567890abcdef1234567890abcdef123',
      ltv: 8000,
      liquidationThreshold: 8250,
      liquidationBonus: 10500,
      borrowingEnabled: true,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '0',
      borrowCap: '0',
    },
    GNO: {
      symbol: 'GNO',
      name: 'Gnosis Token',
      address: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb',
      decimals: 18,
      spTokenAddress: '0x4567890abcdef1234567890abcdef12345678901',
      stableDebtTokenAddress: '0x0000000000000000000000000000000000000000',
      variableDebtTokenAddress: '0xcdef1234567890abcdef1234567890abcdef1234',
      ltv: 4800,
      liquidationThreshold: 6300,
      liquidationBonus: 11000,
      borrowingEnabled: false,
      stableBorrowRateEnabled: false,
      isActive: true,
      isFrozen: false,
      supplyCap: '100000',
      borrowCap: '0',
    },
  },
};

/**
 * Get reserve configuration by symbol and network
 */
export function getReserveConfig(network: string, symbol: string): ReserveConfig | undefined {
  return RESERVES[network]?.[symbol];
}

/**
 * Get all reserves for a network
 */
export function getNetworkReserves(network: string): ReserveConfig[] {
  const reserves = RESERVES[network];
  return reserves ? Object.values(reserves) : [];
}

/**
 * Interest Rate Modes
 * 1 = Stable (fixed rate)
 * 2 = Variable (floating rate)
 */
export const INTEREST_RATE_MODE = {
  NONE: 0,
  STABLE: 1,
  VARIABLE: 2,
} as const;

export type InterestRateMode = (typeof INTEREST_RATE_MODE)[keyof typeof INTEREST_RATE_MODE];

/**
 * Standard decimals for different value types
 */
export const DECIMALS = {
  RAY: 27, // Interest rates (1e27)
  WAD: 18, // Token amounts (1e18)
  USD: 8, // USD prices (1e8)
  PERCENT: 4, // Percentages in basis points (1e4)
} as const;
