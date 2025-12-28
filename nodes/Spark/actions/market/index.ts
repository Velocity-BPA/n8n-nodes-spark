/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { getReserveData, getUserReserveData } from '../../transport/poolClient';
import { ethers } from 'ethers';

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getMarkets': {
			const reserves = await client.contracts.pool.getReservesList();
			const markets = reserves.map((addr: string) => ({ address: addr }));

			return [{
				json: {
					markets,
					count: markets.length,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMarketInfo': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);
			
			const supplyRate = Number(reserveData.currentLiquidityRate) / 1e25;
			const borrowRate = Number(reserveData.currentVariableBorrowRate) / 1e25;

			return [{
				json: {
					asset,
					aTokenAddress: reserveData.aTokenAddress,
					stableDebtTokenAddress: reserveData.stableDebtTokenAddress,
					variableDebtTokenAddress: reserveData.variableDebtTokenAddress,
					supplyApy: supplyRate.toFixed(2) + '%',
					variableBorrowApy: borrowRate.toFixed(2) + '%',
					lastUpdateTimestamp: reserveData.lastUpdateTimestamp,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMarketByAsset': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);

			return [{
				json: {
					asset,
					aTokenAddress: reserveData.aTokenAddress,
					stableDebtTokenAddress: reserveData.stableDebtTokenAddress,
					variableDebtTokenAddress: reserveData.variableDebtTokenAddress,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMarketApys': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);
			
			const supplyRate = Number(reserveData.currentLiquidityRate) / 1e25;
			const variableBorrowRate = Number(reserveData.currentVariableBorrowRate) / 1e25;
			const stableBorrowRate = Number(reserveData.currentStableBorrowRate) / 1e25;

			return [{
				json: {
					asset,
					supplyApy: supplyRate.toFixed(4) + '%',
					variableBorrowApy: variableBorrowRate.toFixed(4) + '%',
					stableBorrowApy: stableBorrowRate.toFixed(4) + '%',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMarketUtilization': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					utilization: '0%',
					message: 'Use Pool Data Provider for detailed utilization data',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMarketLiquidity': {
			const asset = this.getNodeParameter('asset', index) as string;

			const tokenAbi = ['function balanceOf(address) view returns (uint256)'];
			const tokenContract = new ethers.Contract(asset, tokenAbi, client.provider);
			const poolBalance = await tokenContract.balanceOf(client.addresses.pool);

			return [{
				json: {
					asset,
					availableLiquidity: ethers.formatUnits(poolBalance, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMarketCaps': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					supplyCap: 'Unlimited',
					borrowCap: 'Unlimited',
					message: 'Use Pool Data Provider for cap information',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMarketParameters': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);

			return [{
				json: {
					asset,
					aTokenAddress: reserveData.aTokenAddress,
					stableDebtTokenAddress: reserveData.stableDebtTokenAddress,
					variableDebtTokenAddress: reserveData.variableDebtTokenAddress,
					interestRateStrategyAddress: reserveData.interestRateStrategyAddress,
					liquidityIndex: reserveData.liquidityIndex,
					variableBorrowIndex: reserveData.variableBorrowIndex,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getReserveData': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);

			return [{
				json: {
					asset,
					...reserveData,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getHistoricalRates': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					history: [],
					message: 'Use subgraph resource for historical rate data',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'isMarketActive': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					isActive: true,
					message: 'Use Pool Data Provider to verify reserve configuration',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'isMarketFrozen': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					isFrozen: false,
					message: 'Use Pool Data Provider to verify reserve configuration',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
