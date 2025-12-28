/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { getUserAccountData } from '../../transport/poolClient';
import { ethers } from 'ethers';

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getLiquidatableUsers': {
			return [{
				json: {
					users: [],
					count: 0,
					message: 'Use subgraph to query users with health factor < 1',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getLiquidationInfo': {
			const address = this.getNodeParameter('address', index) as string;
			const accountData = await getUserAccountData(client, address);
			
			const healthFactor = Number(accountData.healthFactor) / 1e18;
			const isLiquidatable = healthFactor < 1;

			return [{
				json: {
					address,
					healthFactor: healthFactor.toFixed(4),
					isLiquidatable,
					totalCollateralUsd: (Number(accountData.totalCollateralBase) / 1e8).toFixed(2),
					totalDebtUsd: (Number(accountData.totalDebtBase) / 1e8).toFixed(2),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'liquidatePosition': {
			const collateralAsset = this.getNodeParameter('collateralAsset', index) as string;
			const debtAsset = this.getNodeParameter('debtAsset', index) as string;
			const user = this.getNodeParameter('user', index) as string;
			const debtToCover = this.getNodeParameter('debtToCover', index) as string;
			const receiveAToken = this.getNodeParameter('receiveAToken', index, false) as boolean;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const debtToCoverWei = ethers.parseUnits(debtToCover, 18);

			// Approve debt asset first
			const tokenAbi = ['function approve(address spender, uint256 amount) returns (bool)'];
			const debtToken = new ethers.Contract(debtAsset, tokenAbi, client.signer);
			await (await debtToken.approve(client.addresses.pool, debtToCoverWei)).wait();

			const tx = await client.contracts.pool.liquidationCall(
				collateralAsset,
				debtAsset,
				user,
				debtToCoverWei,
				receiveAToken
			);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					liquidatedUser: user,
					collateralAsset,
					debtAsset,
					debtToCover,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getLiquidationBonus': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					liquidationBonus: '5%',
					liquidationBonusRaw: 10500,
					message: 'Typical liquidation bonus is 5% (10500 basis points)',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getCloseFactor': {
			return [{
				json: {
					closeFactor: '50%',
					closeFactorRaw: 5000,
					message: 'Maximum 50% of debt can be liquidated at once',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'calculateLiquidationAmount': {
			const debtAmount = this.getNodeParameter('debtAmount', index) as string;
			const closeFactor = 0.5; // 50%
			const liquidationBonus = 1.05; // 5%

			const debtNum = parseFloat(debtAmount);
			const maxDebtToLiquidate = debtNum * closeFactor;
			const collateralReceived = maxDebtToLiquidate * liquidationBonus;

			return [{
				json: {
					debtAmount,
					maxDebtToLiquidate: maxDebtToLiquidate.toFixed(6),
					estimatedCollateralReceived: collateralReceived.toFixed(6),
					liquidationBonus: '5%',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getLiquidationHistory': {
			return [{
				json: {
					liquidations: [],
					message: 'Use subgraph resource for liquidation history',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'simulateLiquidation': {
			const collateralAsset = this.getNodeParameter('collateralAsset', index) as string;
			const debtAsset = this.getNodeParameter('debtAsset', index) as string;
			const user = this.getNodeParameter('user', index) as string;
			const debtToCover = this.getNodeParameter('debtToCover', index) as string;

			const accountData = await getUserAccountData(client, user);
			const healthFactor = Number(accountData.healthFactor) / 1e18;
			const isLiquidatable = healthFactor < 1;

			const debtNum = parseFloat(debtToCover);
			const liquidationBonus = 1.05;
			const estimatedCollateral = debtNum * liquidationBonus;

			return [{
				json: {
					user,
					collateralAsset,
					debtAsset,
					debtToCover,
					canLiquidate: isLiquidatable,
					healthFactor: healthFactor.toFixed(4),
					estimatedCollateralReceived: estimatedCollateral.toFixed(6),
					estimatedProfit: (estimatedCollateral - debtNum).toFixed(6),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getHealthFactorThreshold': {
			return [{
				json: {
					threshold: '1.0',
					message: 'Positions with health factor below 1.0 can be liquidated',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
