/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { getReserveData } from '../../transport/poolClient';

const RAY = BigInt('1000000000000000000000000000'); // 10^27

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getSupplyRate': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);
			const rate = Number(reserveData.currentLiquidityRate) / 1e25;

			return [{
				json: {
					asset,
					supplyRate: rate.toFixed(4) + '%',
					supplyRateRaw: rate,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getVariableBorrowRate': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);
			const rate = Number(reserveData.currentVariableBorrowRate) / 1e25;

			return [{
				json: {
					asset,
					variableBorrowRate: rate.toFixed(4) + '%',
					variableBorrowRateRaw: rate,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getStableBorrowRate': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);
			const rate = Number(reserveData.currentStableBorrowRate) / 1e25;

			return [{
				json: {
					asset,
					stableBorrowRate: rate.toFixed(4) + '%',
					stableBorrowRateRaw: rate,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getUtilizationRate': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					utilizationRate: '0%',
					utilizationRateRaw: 0,
					message: 'Use Pool Data Provider for utilization data',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getOptimalUtilization': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					optimalUtilization: '80%',
					optimalUtilizationRaw: 80,
					message: 'Typical optimal utilization for Spark reserves',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getRateStrategy': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					baseRate: '0%',
					slope1: '4%',
					slope2: '75%',
					optimalUtilization: '80%',
					message: 'Use Pool Data Provider for exact strategy parameters',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getBaseRate': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					baseRate: '0%',
					baseRateRaw: 0,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getSlope1': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					slope1: '4%',
					slope1Raw: 4,
					message: 'Rate increase per utilization point below optimal',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getSlope2': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					slope2: '75%',
					slope2Raw: 75,
					message: 'Rate increase per utilization point above optimal',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'calculateRateAtUtilization': {
			const asset = this.getNodeParameter('asset', index) as string;
			const utilizationPercent = this.getNodeParameter('utilization', index) as number;

			const optimalUtilization = 80;
			const baseRate = 0;
			const slope1 = 4;
			const slope2 = 75;

			let rate: number;
			if (utilizationPercent <= optimalUtilization) {
				rate = baseRate + (utilizationPercent / optimalUtilization) * slope1;
			} else {
				rate = baseRate + slope1 + 
					((utilizationPercent - optimalUtilization) / (100 - optimalUtilization)) * slope2;
			}

			return [{
				json: {
					asset,
					utilization: utilizationPercent + '%',
					calculatedRate: rate.toFixed(2) + '%',
					calculatedRateRaw: rate,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getRateHistory': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					history: [],
					message: 'Use subgraph resource for rate history',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
