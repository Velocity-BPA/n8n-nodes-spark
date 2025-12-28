/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

// Mock the utility functions since we're testing the logic
describe('Spark Protocol Utility Tests', () => {
	describe('Health Factor Calculations', () => {
		const calculateHealthFactor = (
			totalCollateralUSD: number,
			totalDebtUSD: number,
			liquidationThreshold: number,
		): number => {
			if (totalDebtUSD === 0) return Infinity;
			return (totalCollateralUSD * liquidationThreshold) / totalDebtUSD;
		};

		it('should calculate health factor correctly', () => {
			const collateral = 10000; // $10,000
			const debt = 5000; // $5,000
			const threshold = 0.85; // 85%

			const hf = calculateHealthFactor(collateral, debt, threshold);
			expect(hf).toBe(1.7);
		});

		it('should return Infinity when no debt', () => {
			const collateral = 10000;
			const debt = 0;
			const threshold = 0.85;

			const hf = calculateHealthFactor(collateral, debt, threshold);
			expect(hf).toBe(Infinity);
		});

		it('should indicate liquidation risk when HF < 1', () => {
			const collateral = 5000;
			const debt = 5000;
			const threshold = 0.85;

			const hf = calculateHealthFactor(collateral, debt, threshold);
			expect(hf).toBeLessThan(1);
		});
	});

	describe('Rate Calculations', () => {
		const RAY = BigInt('1000000000000000000000000000'); // 1e27

		const rayToPercent = (ray: bigint): number => {
			return Number(ray * BigInt(10000) / RAY) / 100;
		};

		const calculateAPY = (apr: number): number => {
			const secondsPerYear = 31536000;
			const ratePerSecond = apr / secondsPerYear;
			return Math.pow(1 + ratePerSecond, secondsPerYear) - 1;
		};

		it('should convert RAY to percentage', () => {
			const rayValue = BigInt('50000000000000000000000000'); // 5% in RAY
			const percent = rayToPercent(rayValue);
			expect(percent).toBeCloseTo(5, 1);
		});

		it('should convert APR to APY correctly', () => {
			const apr = 0.05; // 5% APR
			const apy = calculateAPY(apr);
			expect(apy).toBeGreaterThan(apr);
			expect(apy).toBeCloseTo(0.0513, 3); // ~5.13% APY
		});

		it('should handle zero rate', () => {
			const rayValue = BigInt(0);
			const percent = rayToPercent(rayValue);
			expect(percent).toBe(0);
		});
	});

	describe('Max Borrow Calculations', () => {
		const calculateMaxBorrow = (
			collateralValueUSD: number,
			currentDebtUSD: number,
			ltv: number,
		): number => {
			const maxBorrowable = collateralValueUSD * ltv;
			return Math.max(0, maxBorrowable - currentDebtUSD);
		};

		it('should calculate max borrow correctly', () => {
			const collateral = 10000;
			const currentDebt = 2000;
			const ltv = 0.8; // 80% LTV

			const maxBorrow = calculateMaxBorrow(collateral, currentDebt, ltv);
			expect(maxBorrow).toBe(6000);
		});

		it('should return 0 when debt exceeds borrowing capacity', () => {
			const collateral = 10000;
			const currentDebt = 9000;
			const ltv = 0.8;

			const maxBorrow = calculateMaxBorrow(collateral, currentDebt, ltv);
			expect(maxBorrow).toBe(0);
		});
	});

	describe('Liquidation Price Calculations', () => {
		const calculateLiquidationPrice = (
			debtUSD: number,
			collateralAmount: number,
			liquidationThreshold: number,
		): number => {
			if (collateralAmount === 0) return Infinity;
			return debtUSD / (collateralAmount * liquidationThreshold);
		};

		it('should calculate liquidation price correctly', () => {
			const debt = 5000;
			const collateralAmount = 2; // 2 ETH
			const threshold = 0.85;

			const liqPrice = calculateLiquidationPrice(debt, collateralAmount, threshold);
			expect(liqPrice).toBeCloseTo(2941.18, 1);
		});

		it('should return Infinity when no collateral', () => {
			const debt = 5000;
			const collateralAmount = 0;
			const threshold = 0.85;

			const liqPrice = calculateLiquidationPrice(debt, collateralAmount, threshold);
			expect(liqPrice).toBe(Infinity);
		});
	});

	describe('Token Amount Formatting', () => {
		it('should format token amounts correctly', () => {
			const amount = BigInt('1000000000000000000'); // 1 ETH in wei
			const decimals = 18;
			const formatted = ethers.formatUnits(amount, decimals);
			expect(formatted).toBe('1.0');
		});

		it('should parse token amounts correctly', () => {
			const amount = '1.5';
			const decimals = 18;
			const parsed = ethers.parseUnits(amount, decimals);
			expect(parsed.toString()).toBe('1500000000000000000');
		});

		it('should handle USDC with 6 decimals', () => {
			const amount = BigInt('1000000'); // 1 USDC
			const decimals = 6;
			const formatted = ethers.formatUnits(amount, decimals);
			expect(formatted).toBe('1.0');
		});
	});

	describe('Address Validation', () => {
		it('should validate correct Ethereum address', () => {
			// Using a well-known valid address (Vitalik's address)
			const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
			expect(ethers.isAddress(address)).toBe(true);
		});

		it('should reject invalid address', () => {
			const address = '0xinvalid';
			expect(ethers.isAddress(address)).toBe(false);
		});

		it('should accept checksummed addresses', () => {
			// Using the zero address which has a known valid checksum
			const address = '0x0000000000000000000000000000000000000000';
			const checksummed = ethers.getAddress(address);
			expect(ethers.isAddress(checksummed)).toBe(true);
		});
	});

	describe('E-Mode Validation', () => {
		const EMODE_CATEGORIES = {
			0: { label: 'None', ltv: 0, liquidationThreshold: 0, liquidationBonus: 0 },
			1: { label: 'ETH Correlated', ltv: 90, liquidationThreshold: 93, liquidationBonus: 1 },
			2: { label: 'Stablecoins', ltv: 97, liquidationThreshold: 97.5, liquidationBonus: 1 },
		};

		it('should get E-Mode category info', () => {
			const category = EMODE_CATEGORIES[1];
			expect(category.label).toBe('ETH Correlated');
			expect(category.ltv).toBe(90);
		});

		it('should validate E-Mode category exists', () => {
			const validCategory = 1;
			const invalidCategory = 99;
			expect(EMODE_CATEGORIES[validCategory as keyof typeof EMODE_CATEGORIES]).toBeDefined();
			expect(EMODE_CATEGORIES[invalidCategory as keyof typeof EMODE_CATEGORIES]).toBeUndefined();
		});
	});

	describe('Utilization Rate Calculations', () => {
		const calculateUtilization = (totalBorrow: number, totalSupply: number): number => {
			if (totalSupply === 0) return 0;
			return (totalBorrow / totalSupply) * 100;
		};

		it('should calculate utilization correctly', () => {
			const borrow = 8000;
			const supply = 10000;
			const utilization = calculateUtilization(borrow, supply);
			expect(utilization).toBe(80);
		});

		it('should return 0 when no supply', () => {
			const utilization = calculateUtilization(0, 0);
			expect(utilization).toBe(0);
		});
	});
});

describe('Spark Protocol Network Tests', () => {
	describe('Network Configuration', () => {
		const SPARK_NETWORKS = {
			ethereum: {
				chainId: 1,
				name: 'Ethereum Mainnet',
				rpcUrl: 'https://eth.llamarpc.com',
			},
			gnosis: {
				chainId: 100,
				name: 'Gnosis Chain',
				rpcUrl: 'https://rpc.gnosischain.com',
			},
		};

		it('should have correct Ethereum chain ID', () => {
			expect(SPARK_NETWORKS.ethereum.chainId).toBe(1);
		});

		it('should have correct Gnosis chain ID', () => {
			expect(SPARK_NETWORKS.gnosis.chainId).toBe(100);
		});
	});

	describe('Contract Addresses', () => {
		const SPARK_CONTRACTS = {
			ethereum: {
				pool: '0xC13e21B648A5Ee794902342038FF3aDAB66BE987',
				oracle: '0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9',
			},
		};

		it('should have valid pool address', () => {
			expect(ethers.isAddress(SPARK_CONTRACTS.ethereum.pool)).toBe(true);
		});

		it('should have valid oracle address', () => {
			expect(ethers.isAddress(SPARK_CONTRACTS.ethereum.oracle)).toBe(true);
		});
	});
});

describe('Token Decimals', () => {
	const TOKEN_DECIMALS: Record<string, number> = {
		ETH: 18,
		WETH: 18,
		DAI: 18,
		USDC: 6,
		USDT: 6,
		WBTC: 8,
		sDAI: 18,
	};

	it('should have correct decimals for ETH', () => {
		expect(TOKEN_DECIMALS.ETH).toBe(18);
	});

	it('should have correct decimals for USDC', () => {
		expect(TOKEN_DECIMALS.USDC).toBe(6);
	});

	it('should have correct decimals for WBTC', () => {
		expect(TOKEN_DECIMALS.WBTC).toBe(8);
	});
});
