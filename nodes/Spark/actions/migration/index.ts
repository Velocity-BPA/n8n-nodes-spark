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
		case 'checkMigrationFromAave': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					canMigrate: true,
					message: 'Spark uses Aave V3 codebase. Direct migration may not be needed if positions are on different chains.',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'migrateFromAaveV2': {
			return [{
				json: {
					message: 'Aave V2 to Spark migration requires manual withdrawal from Aave V2 and deposit to Spark',
					steps: [
						'1. Withdraw assets from Aave V2',
						'2. Repay any debt on Aave V2',
						'3. Supply assets to Spark',
						'4. Borrow on Spark if needed'
					],
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'migrateFromAaveV3': {
			return [{
				json: {
					message: 'Aave V3 to Spark migration. Spark uses similar contracts as Aave V3.',
					steps: [
						'1. Withdraw assets from Aave V3',
						'2. Repay any debt on Aave V3',
						'3. Supply assets to Spark',
						'4. Borrow on Spark if needed'
					],
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMigrationQuote': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					estimatedGas: '500000',
					message: 'Migration requires multiple transactions. Quote is approximate.',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'estimateGasSavings': {
			return [{
				json: {
					message: 'Gas savings depend on position size and market conditions',
					note: 'Spark may offer better rates for DAI-related positions due to MakerDAO integration',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMigrationStatus': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					status: 'Not Started',
					message: 'Track migration progress manually',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
