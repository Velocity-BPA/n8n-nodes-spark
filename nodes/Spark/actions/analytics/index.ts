/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { getUserAccountData } from '../../transport/poolClient';

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getTvl': {
			return [{
				json: {
					tvlUsd: '0',
					message: 'Use subgraph resource for accurate TVL data',
					timestamp: new Date().toISOString(),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getStats': {
			return [{
				json: {
					totalSupplyUsd: '0',
					totalBorrowUsd: '0',
					utilization: '0%',
					message: 'Use subgraph resource for protocol statistics',
					timestamp: new Date().toISOString(),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMarketRankings': {
			const orderBy = this.getNodeParameter('orderBy', index, 'tvl') as string;

			return [{
				json: {
					rankings: [],
					orderBy,
					message: 'Use subgraph resource for market rankings',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getUserStats': {
			const address = this.getNodeParameter('address', index) as string;
			const accountData = await getUserAccountData(client, address);

			const totalCollateral = Number(accountData.totalCollateralBase) / 1e8;
			const totalDebt = Number(accountData.totalDebtBase) / 1e8;
			const healthFactor = Number(accountData.healthFactor) / 1e18;

			let riskLevel: string;
			if (healthFactor >= 2) {
				riskLevel = 'Very Low';
			} else if (healthFactor >= 1.5) {
				riskLevel = 'Low';
			} else if (healthFactor >= 1.2) {
				riskLevel = 'Medium';
			} else if (healthFactor >= 1.05) {
				riskLevel = 'High';
			} else {
				riskLevel = 'Critical';
			}

			return [{
				json: {
					address,
					totalCollateralUsd: totalCollateral.toFixed(2),
					totalDebtUsd: totalDebt.toFixed(2),
					netWorthUsd: (totalCollateral - totalDebt).toFixed(2),
					healthFactor: isFinite(healthFactor) ? healthFactor.toFixed(4) : 'Infinity',
					riskLevel,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getHistoricalData': {
			return [{
				json: {
					data: [],
					message: 'Use subgraph resource for historical data',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getLiquidationStats': {
			return [{
				json: {
					totalLiquidations: 0,
					totalLiquidatedUsd: '0',
					message: 'Use subgraph resource for liquidation statistics',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getRevenueStats': {
			return [{
				json: {
					totalRevenueUsd: '0',
					message: 'Use subgraph resource for revenue statistics',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'exportData': {
			const format = this.getNodeParameter('format', index, 'json') as string;

			return [{
				json: {
					format,
					data: {},
					message: 'Use subgraph resource for comprehensive data export',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
