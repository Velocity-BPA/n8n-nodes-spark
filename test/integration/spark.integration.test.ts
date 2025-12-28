/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { ethers } from 'ethers';

/**
 * Integration tests for Spark Protocol node
 * 
 * These tests require network connectivity and may take longer to run.
 * Run with: npm run test:integration
 * 
 * Note: Some tests may require an RPC endpoint with archive data access
 */

describe('Spark Protocol Integration Tests', () => {
	const ETHEREUM_RPC = process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';
	const GNOSIS_RPC = process.env.GNOSIS_RPC_URL || 'https://rpc.gnosischain.com';
	
	// Spark Protocol Ethereum Mainnet addresses
	const SPARK_POOL = '0xC13e21B648A5Ee794902342038FF3aDAB66BE987';
	const SPARK_ORACLE = '0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9';
	const SPARK_DATA_PROVIDER = '0xFc21d6d146E6086B8359705C8b28512a983db0cb';
	const SDAI_ADDRESS = '0x83F20F44975D03b1b09e64809B757c47f942BEeA';
	const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EesDecF55C02Af5';
	
	let provider: ethers.JsonRpcProvider;
	
	beforeAll(() => {
		provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
	});
	
	afterAll(() => {
		provider.destroy();
	});
	
	describe('Network Connectivity', () => {
		it('should connect to Ethereum mainnet', async () => {
			const network = await provider.getNetwork();
			expect(network.chainId).toBe(BigInt(1));
		}, 10000);
		
		it('should get current block number', async () => {
			const blockNumber = await provider.getBlockNumber();
			expect(blockNumber).toBeGreaterThan(0);
		}, 10000);
	});
	
	describe('Pool Contract Integration', () => {
		const POOL_ABI = [
			'function getReservesList() view returns (address[])',
			'function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))',
			'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
		];
		
		let poolContract: ethers.Contract;
		
		beforeAll(() => {
			poolContract = new ethers.Contract(SPARK_POOL, POOL_ABI, provider);
		});
		
		it('should fetch reserves list', async () => {
			const reserves = await poolContract.getReservesList();
			expect(reserves).toBeInstanceOf(Array);
			expect(reserves.length).toBeGreaterThan(0);
			
			// All reserves should be valid addresses
			reserves.forEach((reserve: string) => {
				expect(ethers.isAddress(reserve)).toBe(true);
			});
		}, 15000);
		
		it('should fetch reserve data for DAI', async () => {
			const reserveData = await poolContract.getReserveData(DAI_ADDRESS);
			expect(reserveData).toBeDefined();
			expect(reserveData.aTokenAddress).toBeDefined();
			expect(ethers.isAddress(reserveData.aTokenAddress)).toBe(true);
		}, 15000);
		
		it('should fetch user account data', async () => {
			// Use a known address with positions (example)
			const testUser = '0x0000000000000000000000000000000000000001';
			const accountData = await poolContract.getUserAccountData(testUser);
			
			expect(accountData).toBeDefined();
			expect(accountData.totalCollateralBase).toBeDefined();
			expect(accountData.totalDebtBase).toBeDefined();
			expect(accountData.healthFactor).toBeDefined();
		}, 15000);
	});
	
	describe('Oracle Contract Integration', () => {
		const ORACLE_ABI = [
			'function getAssetPrice(address asset) view returns (uint256)',
			'function getAssetsPrices(address[] assets) view returns (uint256[])',
			'function BASE_CURRENCY() view returns (address)',
			'function BASE_CURRENCY_UNIT() view returns (uint256)',
		];
		
		let oracleContract: ethers.Contract;
		
		beforeAll(() => {
			oracleContract = new ethers.Contract(SPARK_ORACLE, ORACLE_ABI, provider);
		});
		
		it('should fetch DAI price', async () => {
			const price = await oracleContract.getAssetPrice(DAI_ADDRESS);
			expect(price).toBeGreaterThan(BigInt(0));
			
			// DAI should be ~$1 (8 decimals in oracle = 1e8)
			const priceUSD = Number(price) / 1e8;
			expect(priceUSD).toBeGreaterThan(0.9);
			expect(priceUSD).toBeLessThan(1.1);
		}, 15000);
		
		it('should fetch base currency unit', async () => {
			const unit = await oracleContract.BASE_CURRENCY_UNIT();
			expect(unit).toBe(BigInt(100000000)); // 1e8
		}, 15000);
	});
	
	describe('sDAI Contract Integration', () => {
		const SDAI_ABI = [
			'function totalAssets() view returns (uint256)',
			'function totalSupply() view returns (uint256)',
			'function convertToAssets(uint256 shares) view returns (uint256)',
			'function convertToShares(uint256 assets) view returns (uint256)',
		];
		
		let sdaiContract: ethers.Contract;
		
		beforeAll(() => {
			sdaiContract = new ethers.Contract(SDAI_ADDRESS, SDAI_ABI, provider);
		});
		
		it('should fetch total assets', async () => {
			const totalAssets = await sdaiContract.totalAssets();
			expect(totalAssets).toBeGreaterThan(BigInt(0));
		}, 15000);
		
		it('should fetch sDAI/DAI exchange rate', async () => {
			// 1 sDAI should convert to > 1 DAI due to accrued interest
			const oneShare = ethers.parseEther('1');
			const assets = await sdaiContract.convertToAssets(oneShare);
			
			// sDAI always increases in DAI value
			expect(assets).toBeGreaterThan(oneShare);
		}, 15000);
	});
	
	describe('Data Provider Integration', () => {
		const DATA_PROVIDER_ABI = [
			'function getAllReservesTokens() view returns (tuple(string symbol, address tokenAddress)[])',
			'function getReserveConfigurationData(address asset) view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)',
		];
		
		let dataProvider: ethers.Contract;
		
		beforeAll(() => {
			dataProvider = new ethers.Contract(SPARK_DATA_PROVIDER, DATA_PROVIDER_ABI, provider);
		});
		
		it('should fetch all reserve tokens', async () => {
			const tokens = await dataProvider.getAllReservesTokens();
			expect(tokens).toBeInstanceOf(Array);
			expect(tokens.length).toBeGreaterThan(0);
			
			// Should include DAI
			const daiToken = tokens.find((t: { symbol: string }) => t.symbol === 'DAI');
			expect(daiToken).toBeDefined();
		}, 15000);
		
		it('should fetch reserve configuration', async () => {
			const config = await dataProvider.getReserveConfigurationData(DAI_ADDRESS);
			
			expect(config.decimals).toBe(BigInt(18));
			expect(config.isActive).toBe(true);
			expect(Number(config.ltv)).toBeGreaterThan(0);
			expect(Number(config.liquidationThreshold)).toBeGreaterThan(0);
		}, 15000);
	});
	
	describe('Gnosis Chain Integration', () => {
		const GNOSIS_SPARK_POOL = '0x2Dae5307c5E3FD1CF5A72Cb6F698f915860607e0';
		
		let gnosisProvider: ethers.JsonRpcProvider;
		
		beforeAll(() => {
			gnosisProvider = new ethers.JsonRpcProvider(GNOSIS_RPC);
		});
		
		afterAll(() => {
			gnosisProvider.destroy();
		});
		
		it('should connect to Gnosis chain', async () => {
			const network = await gnosisProvider.getNetwork();
			expect(network.chainId).toBe(BigInt(100));
		}, 15000);
		
		it('should verify Spark pool exists on Gnosis', async () => {
			const code = await gnosisProvider.getCode(GNOSIS_SPARK_POOL);
			expect(code).not.toBe('0x');
		}, 15000);
	});
	
	describe('Event Queries', () => {
		it('should query Supply events', async () => {
			const poolContract = new ethers.Contract(
				SPARK_POOL,
				['event Supply(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referralCode)'],
				provider,
			);
			
			const currentBlock = await provider.getBlockNumber();
			const fromBlock = currentBlock - 1000; // Last 1000 blocks
			
			const filter = poolContract.filters.Supply();
			const events = await poolContract.queryFilter(filter, fromBlock, currentBlock);
			
			// There should be some supply events in the last 1000 blocks
			expect(events).toBeInstanceOf(Array);
		}, 30000);
	});
	
	describe('Gas Estimation', () => {
		it('should estimate gas for view calls', async () => {
			const poolContract = new ethers.Contract(
				SPARK_POOL,
				['function getReservesList() view returns (address[])'],
				provider,
			);
			
			// View calls don't consume gas, but we can estimate
			const gasEstimate = await provider.estimateGas({
				to: SPARK_POOL,
				data: poolContract.interface.encodeFunctionData('getReservesList'),
			});
			
			expect(gasEstimate).toBeGreaterThan(BigInt(0));
		}, 15000);
	});
});

describe('Error Handling Tests', () => {
	it('should handle invalid RPC URL', async () => {
		const invalidProvider = new ethers.JsonRpcProvider('https://invalid-rpc-url.example.com');
		
		await expect(invalidProvider.getBlockNumber()).rejects.toThrow();
		invalidProvider.destroy();
	}, 10000);
	
	it('should handle invalid contract address', async () => {
		const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
		const invalidAddress = '0x0000000000000000000000000000000000000000';
		
		const contract = new ethers.Contract(
			invalidAddress,
			['function getReservesList() view returns (address[])'],
			provider,
		);
		
		// Calling a function on an EOA or empty address should fail
		await expect(contract.getReservesList()).rejects.toThrow();
		provider.destroy();
	}, 15000);
});
