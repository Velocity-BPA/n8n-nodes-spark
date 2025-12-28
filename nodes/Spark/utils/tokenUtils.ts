/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';

/**
 * Token Utilities
 *
 * Helper functions for working with tokens, addresses, and
 * common ERC20 operations in the Spark Protocol.
 */

// Native ETH placeholder address used in many protocols
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

// Zero address
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Max uint256 for unlimited approvals
export const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Normalize address to checksum format
 */
export function normalizeAddress(address: string): string {
  try {
    return ethers.getAddress(address);
  } catch {
    throw new Error(`Invalid address: ${address}`);
  }
}

/**
 * Check if address is the zero address
 */
export function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === ZERO_ADDRESS.toLowerCase();
}

/**
 * Check if address is the native token placeholder
 */
export function isNativeToken(address: string): boolean {
  return address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();
}

/**
 * Shorten address for display (0x1234...5678)
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidAddress(address)) {
    return address;
  }
  const normalized = normalizeAddress(address);
  return `${normalized.slice(0, chars + 2)}...${normalized.slice(-chars)}`;
}

/**
 * Parse token amount with proper decimals
 */
export function parseAmount(amount: string | number, decimals: number): string {
  try {
    const value = ethers.parseUnits(amount.toString(), decimals);
    return value.toString();
  } catch (error) {
    throw new Error(`Invalid amount: ${amount}`);
  }
}

/**
 * Format token amount from wei
 */
export function formatAmount(amount: string | bigint, decimals: number): string {
  try {
    return ethers.formatUnits(amount, decimals);
  } catch (error) {
    throw new Error(`Invalid amount: ${amount}`);
  }
}

/**
 * Format token amount for display with optional formatting
 */
export function formatDisplayAmount(
  amount: string | bigint,
  decimals: number,
  options: {
    displayDecimals?: number;
    compact?: boolean;
    symbol?: string;
  } = {},
): string {
  const { displayDecimals = 4, compact = false, symbol } = options;

  const formatted = formatAmount(amount, decimals);
  const bn = new BigNumber(formatted);

  let result: string;

  if (compact) {
    if (bn.gte(1e9)) {
      result = `${bn.dividedBy(1e9).toFixed(2)}B`;
    } else if (bn.gte(1e6)) {
      result = `${bn.dividedBy(1e6).toFixed(2)}M`;
    } else if (bn.gte(1e3)) {
      result = `${bn.dividedBy(1e3).toFixed(2)}K`;
    } else {
      result = bn.toFixed(displayDecimals);
    }
  } else {
    result = bn.toFixed(displayDecimals);
  }

  // Remove trailing zeros
  if (result.includes('.')) {
    result = result.replace(/\.?0+$/, '');
  }

  return symbol ? `${result} ${symbol}` : result;
}

/**
 * Convert between token amounts with different decimals
 */
export function convertDecimals(
  amount: string | bigint,
  fromDecimals: number,
  toDecimals: number,
): string {
  const amountBN = new BigNumber(amount.toString());

  if (fromDecimals === toDecimals) {
    return amount.toString();
  }

  if (fromDecimals > toDecimals) {
    const divisor = new BigNumber(10).pow(fromDecimals - toDecimals);
    return amountBN.dividedBy(divisor).integerValue().toString();
  }

  const multiplier = new BigNumber(10).pow(toDecimals - fromDecimals);
  return amountBN.multipliedBy(multiplier).toString();
}

/**
 * Calculate USD value of tokens
 */
export function calculateUsdValue(
  tokenAmount: string | bigint,
  tokenDecimals: number,
  priceUsd: string | number,
  priceDecimals: number = 8,
): string {
  const amount = new BigNumber(tokenAmount.toString());
  const price = new BigNumber(priceUsd.toString());

  const tokenValue = amount.dividedBy(new BigNumber(10).pow(tokenDecimals));
  const priceValue = price.dividedBy(new BigNumber(10).pow(priceDecimals));

  const usdValue = tokenValue.multipliedBy(priceValue);

  return usdValue.toFixed(2);
}

/**
 * Format USD value from base currency units (8 decimals)
 * Spark Oracle uses 8 decimals for USD prices
 */
export function formatUsdValue(value: string | bigint, decimals: number = 8): string {
  const bn = new BigNumber(value.toString());
  const formatted = bn.dividedBy(new BigNumber(10).pow(decimals));
  return formatted.toFixed(2);
}

/**
 * Get spToken symbol from underlying symbol
 */
export function getSpTokenSymbol(underlyingSymbol: string): string {
  return `sp${underlyingSymbol}`;
}

/**
 * Get variable debt token symbol from underlying symbol
 */
export function getVariableDebtSymbol(underlyingSymbol: string): string {
  return `variableDebt${underlyingSymbol}`;
}

/**
 * Get stable debt token symbol from underlying symbol
 */
export function getStableDebtSymbol(underlyingSymbol: string): string {
  return `stableDebt${underlyingSymbol}`;
}

/**
 * Extract underlying symbol from derivative token symbol
 */
export function getUnderlyingSymbol(derivativeSymbol: string): string {
  if (derivativeSymbol.startsWith('sp')) {
    return derivativeSymbol.slice(2);
  }
  if (derivativeSymbol.startsWith('variableDebt')) {
    return derivativeSymbol.slice(12);
  }
  if (derivativeSymbol.startsWith('stableDebt')) {
    return derivativeSymbol.slice(10);
  }
  return derivativeSymbol;
}

/**
 * Validate token amount is positive
 */
export function isPositiveAmount(amount: string | bigint): boolean {
  const bn = new BigNumber(amount.toString());
  return bn.isPositive() && !bn.isZero();
}

/**
 * Compare two token amounts
 */
export function compareAmounts(a: string | bigint, b: string | bigint): number {
  const aBN = new BigNumber(a.toString());
  const bBN = new BigNumber(b.toString());
  return aBN.comparedTo(bBN);
}

/**
 * Calculate percentage of token amount
 */
export function percentageOf(amount: string | bigint, percentBps: number): string {
  const amountBN = new BigNumber(amount.toString());
  return amountBN.multipliedBy(percentBps).dividedBy(10000).integerValue().toString();
}

/**
 * ERC20 Permit signature types for EIP-2612
 */
export interface PermitSignature {
  v: number;
  r: string;
  s: string;
  deadline: number;
}

/**
 * Create EIP-712 typed data for ERC20 Permit
 */
export function createPermitTypedData(
  tokenName: string,
  tokenAddress: string,
  chainId: number,
  owner: string,
  spender: string,
  value: string,
  nonce: number,
  deadline: number,
): {
  domain: ethers.TypedDataDomain;
  types: Record<string, ethers.TypedDataField[]>;
  message: Record<string, unknown>;
} {
  const domain: ethers.TypedDataDomain = {
    name: tokenName,
    version: '1',
    chainId,
    verifyingContract: tokenAddress,
  };

  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const message = {
    owner,
    spender,
    value,
    nonce,
    deadline,
  };

  return { domain, types, message };
}
