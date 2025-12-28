/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Token Type Definitions
 */

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUri?: string;
}

/**
 * Token Types in Spark Protocol
 */
export const TOKEN_TYPES = {
  UNDERLYING: 'underlying', // Original token (DAI, WETH, etc.)
  SP_TOKEN: 'spToken', // Interest-bearing supply token (spDAI, spWETH)
  VARIABLE_DEBT: 'variableDebt', // Variable rate debt token (variableDebtDAI)
  STABLE_DEBT: 'stableDebt', // Stable rate debt token (stableDebtDAI)
} as const;

export type TokenType = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

/**
 * Common tokens used across networks
 */
export const COMMON_TOKENS: Record<string, Record<string, TokenInfo>> = {
  ethereum: {
    ETH: {
      symbol: 'ETH',
      name: 'Ether',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Virtual address for native ETH
      decimals: 18,
    },
    WETH: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      decimals: 18,
    },
    DAI: {
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      address: '0x6B175474E89094C44Da98b954EescdeCB5BE3830',
      decimals: 18,
    },
    sDAI: {
      symbol: 'sDAI',
      name: 'Savings Dai',
      address: '0x83F20F44975D03b1b09e64809B757c47f942BEea',
      decimals: 18,
    },
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
    },
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
    },
    WBTC: {
      symbol: 'WBTC',
      name: 'Wrapped BTC',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
    },
    wstETH: {
      symbol: 'wstETH',
      name: 'Wrapped stETH',
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      decimals: 18,
    },
    rETH: {
      symbol: 'rETH',
      name: 'Rocket Pool ETH',
      address: '0xae78736Cd615f374D3085123A210448E74Fc6393',
      decimals: 18,
    },
    GNO: {
      symbol: 'GNO',
      name: 'Gnosis Token',
      address: '0x6810e776880C02933D47DB1b9fc05908e5386b96',
      decimals: 18,
    },
  },
  gnosis: {
    xDAI: {
      symbol: 'xDAI',
      name: 'xDAI',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      decimals: 18,
    },
    WXDAI: {
      symbol: 'WXDAI',
      name: 'Wrapped xDAI',
      address: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
      decimals: 18,
    },
    sDAI: {
      symbol: 'sDAI',
      name: 'Savings Dai',
      address: '0xaf204776c7245bF4147c2612BF6e5972Ee483701',
      decimals: 18,
    },
    WETH: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1',
      decimals: 18,
    },
    GNO: {
      symbol: 'GNO',
      name: 'Gnosis Token',
      address: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb',
      decimals: 18,
    },
  },
};

/**
 * Get token info by network and symbol
 */
export function getTokenInfo(network: string, symbol: string): TokenInfo | undefined {
  return COMMON_TOKENS[network]?.[symbol];
}

/**
 * Get all tokens for a network
 */
export function getNetworkTokens(network: string): TokenInfo[] {
  const tokens = COMMON_TOKENS[network];
  return tokens ? Object.values(tokens) : [];
}

/**
 * Check if address is native ETH/xDAI
 */
export function isNativeToken(address: string): boolean {
  return address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: string | bigint, decimals: number): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  
  if (fractionalPart === BigInt(0)) {
    return integerPart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  return `${integerPart}.${trimmedFractional}`;
}

/**
 * Parse token amount to wei
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [integerPart, fractionalPart = ''] = amount.split('.');
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const fullAmount = integerPart + paddedFractional;
  return BigInt(fullAmount);
}

// Export all constants
export * from './networks';
export * from './contracts';
export * from './reserves';
export * from './eModes';
