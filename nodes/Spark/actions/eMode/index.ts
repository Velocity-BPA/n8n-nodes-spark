/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { getUserAccountData } from '../../transport/poolClient';

// E-Mode categories for Spark
const E_MODES: { [key: number]: { label: string; ltv: number; liquidationThreshold: number; liquidationBonus: number } } = {
	0: { label: 'None', ltv: 0, liquidationThreshold: 0, liquidationBonus: 0 },
	1: { label: 'Stablecoins', ltv: 9700, liquidationThreshold: 9750, liquidationBonus: 10100 },
	2: { label: 'ETH Correlated', ltv: 9000, liquidationThreshold: 9300, liquidationBonus: 10200 },
};

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getEModes': {
			const modes = Object.entries(E_MODES).map(([id, config]) => ({
				id: Number(id),
				label: config.label,
				ltv: (config.ltv / 100).toFixed(2) + '%',
				liquidationThreshold: (config.liquidationThreshold / 100).toFixed(2) + '%',
				liquidationBonus: (config.liquidationBonus / 100 - 100).toFixed(2) + '%',
			}));

			return [{
				json: {
					eModes: modes,
					count: modes.length,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getEModeInfo': {
			const categoryId = this.getNodeParameter('categoryId', index) as number;
			const eMode = E_MODES[categoryId] || E_MODES[0];

			return [{
				json: {
					id: categoryId,
					label: eMode.label,
					ltv: (eMode.ltv / 100).toFixed(2) + '%',
					liquidationThreshold: (eMode.liquidationThreshold / 100).toFixed(2) + '%',
					liquidationBonus: (eMode.liquidationBonus / 100 - 100).toFixed(2) + '%',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'setUserEMode': {
			const categoryId = this.getNodeParameter('categoryId', index) as number;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const tx = await client.contracts.pool.setUserEMode(categoryId);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					categoryId,
					categoryLabel: E_MODES[categoryId]?.label || 'Unknown',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getUserEMode': {
			const address = this.getNodeParameter('address', index) as string;
			
			const categoryId = await client.contracts.pool.getUserEMode(address);
			const eMode = E_MODES[Number(categoryId)] || E_MODES[0];

			return [{
				json: {
					address,
					categoryId: Number(categoryId),
					categoryLabel: eMode.label,
					ltv: (eMode.ltv / 100).toFixed(2) + '%',
					liquidationThreshold: (eMode.liquidationThreshold / 100).toFixed(2) + '%',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getEModeAssets': {
			const categoryId = this.getNodeParameter('categoryId', index) as number;

			const assets: { [key: number]: string[] } = {
				0: [],
				1: ['DAI', 'USDC', 'USDT', 'sDAI'],
				2: ['WETH', 'wstETH', 'rETH', 'cbETH'],
			};

			return [{
				json: {
					categoryId,
					assets: assets[categoryId] || [],
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getEModeLtv': {
			const categoryId = this.getNodeParameter('categoryId', index) as number;
			const eMode = E_MODES[categoryId] || E_MODES[0];

			return [{
				json: {
					categoryId,
					ltv: (eMode.ltv / 100).toFixed(2) + '%',
					ltvRaw: eMode.ltv,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getEModeLiquidationThreshold': {
			const categoryId = this.getNodeParameter('categoryId', index) as number;
			const eMode = E_MODES[categoryId] || E_MODES[0];

			return [{
				json: {
					categoryId,
					liquidationThreshold: (eMode.liquidationThreshold / 100).toFixed(2) + '%',
					liquidationThresholdRaw: eMode.liquidationThreshold,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getEModeBonus': {
			const categoryId = this.getNodeParameter('categoryId', index) as number;
			const eMode = E_MODES[categoryId] || E_MODES[0];

			return [{
				json: {
					categoryId,
					liquidationBonus: (eMode.liquidationBonus / 100 - 100).toFixed(2) + '%',
					liquidationBonusRaw: eMode.liquidationBonus,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getEModeLabel': {
			const categoryId = this.getNodeParameter('categoryId', index) as number;
			const eMode = E_MODES[categoryId] || E_MODES[0];

			return [{
				json: {
					categoryId,
					label: eMode.label,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'exitEMode': {
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const tx = await client.contracts.pool.setUserEMode(0);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					exited: true,
					newCategoryId: 0,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
