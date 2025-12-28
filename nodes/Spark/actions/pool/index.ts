/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getPoolInfo': {
			const reserves = await client.contracts.pool.getReservesList();

			return [{
				json: {
					poolAddress: client.addresses.pool,
					reserveCount: reserves.length,
					reserves: reserves.slice(0, 10),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getPoolAddress': {
			return [{
				json: {
					poolAddress: client.addresses.pool,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getPoolConfigurator': {
			return [{
				json: {
					message: 'Use Pool Addresses Provider for configurator address',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getPoolDataProvider': {
			return [{
				json: {
					poolDataProvider: client.addresses.poolDataProvider,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getPoolAdmin': {
			return [{
				json: {
					message: 'Pool admin determined by MakerDAO governance',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getPoolAddressesProvider': {
			return [{
				json: {
					poolAddressesProvider: client.addresses.poolAddressesProvider,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getProtocolData': {
			const reserves = await client.contracts.pool.getReservesList();

			return [{
				json: {
					protocol: 'Spark',
					network: client.network,
					poolAddress: client.addresses.pool,
					reserveCount: reserves.length,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getTotalValueLocked': {
			return [{
				json: {
					tvl: '0',
					message: 'Use subgraph or analytics resource for TVL data',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
