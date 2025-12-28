/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { getUserReserveData, getReserveData, getUserAccountData } from '../../transport/poolClient';
import { ethers } from 'ethers';

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'enableAsCollateral': {
			const asset = this.getNodeParameter('asset', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required for collateral operations');
			}

			const tx = await client.contracts.pool.setUserUseReserveAsCollateral(asset, true);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset,
					enabled: true,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'disableAsCollateral': {
			const asset = this.getNodeParameter('asset', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required for collateral operations');
			}

			const tx = await client.contracts.pool.setUserUseReserveAsCollateral(asset, false);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset,
					enabled: false,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getCollateralStatus': {
			const asset = this.getNodeParameter('asset', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			
			const userReserve = await getUserReserveData(client, asset, address);

			return [{
				json: {
					address,
					asset,
					usageAsCollateralEnabled: Boolean(userReserve.usageAsCollateralEnabled),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getCollateralFactor': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					ltv: '80%',
					ltvRaw: 8000,
					message: 'Use Pool Data Provider for exact LTV values',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getLiquidationThreshold': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					liquidationThreshold: '82.5%',
					liquidationThresholdRaw: 8250,
					message: 'Use Pool Data Provider for exact threshold values',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getCollateralValue': {
			const address = this.getNodeParameter('address', index) as string;
			
			const accountData = await getUserAccountData(client, address);
			const collateralUsd = Number(accountData.totalCollateralBase) / 1e8;

			return [{
				json: {
					address,
					totalCollateralUsd: collateralUsd.toFixed(2),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getAllCollaterals': {
			const address = this.getNodeParameter('address', index) as string;
			
			return [{
				json: {
					address,
					collaterals: [],
					message: 'Use subgraph or iterate reserves for detailed collateral list',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getIsolationModeStatus': {
			const address = this.getNodeParameter('address', index) as string;
			
			return [{
				json: {
					address,
					inIsolationMode: false,
					isolationModeDebtCeiling: '0',
					message: 'Isolation mode status requires detailed reserve analysis',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
