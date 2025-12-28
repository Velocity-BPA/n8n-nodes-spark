/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { getUserAccountData, getReserveData } from '../../transport/poolClient';
import { ethers } from 'ethers';

export async function executeUtilityOperation(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'calculateHealthFactor': {
			const totalCollateral = this.getNodeParameter('totalCollateral', index) as number;
			const totalDebt = this.getNodeParameter('totalDebt', index) as number;
			const liquidationThreshold = this.getNodeParameter('liquidationThreshold', index, 0.825) as number;

			if (totalDebt === 0) {
				return [{
					json: {
						healthFactor: 'Infinity',
						status: 'No Debt',
					} as IDataObject,
					pairedItem: { item: index },
				}];
			}

			const healthFactor = (totalCollateral * liquidationThreshold) / totalDebt;
			let status: string;
			if (healthFactor >= 2) {
				status = 'Very Safe';
			} else if (healthFactor >= 1.5) {
				status = 'Safe';
			} else if (healthFactor >= 1.2) {
				status = 'Moderate';
			} else if (healthFactor >= 1.05) {
				status = 'At Risk';
			} else if (healthFactor >= 1) {
				status = 'Danger';
			} else {
				status = 'Liquidatable';
			}

			return [{
				json: {
					healthFactor: healthFactor.toFixed(4),
					status,
					totalCollateral,
					totalDebt,
					liquidationThreshold,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'calculateMaxBorrow': {
			const collateralValue = this.getNodeParameter('collateralValue', index) as number;
			const ltv = this.getNodeParameter('ltv', index, 0.80) as number;
			const currentDebt = this.getNodeParameter('currentDebt', index, 0) as number;

			const maxBorrow = (collateralValue * ltv) - currentDebt;

			return [{
				json: {
					maxBorrow: maxBorrow > 0 ? maxBorrow.toFixed(2) : '0',
					collateralValue,
					ltv,
					currentDebt,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'calculateLiquidationPrice': {
			const collateralAmount = this.getNodeParameter('collateralAmount', index) as number;
			const debtAmount = this.getNodeParameter('debtAmount', index) as number;
			const liquidationThreshold = this.getNodeParameter('liquidationThreshold', index, 0.825) as number;

			if (collateralAmount === 0) {
				return [{
					json: {
						liquidationPrice: '0',
						message: 'No collateral',
					} as IDataObject,
					pairedItem: { item: index },
				}];
			}

			const liquidationPrice = debtAmount / (collateralAmount * liquidationThreshold);

			return [{
				json: {
					liquidationPrice: liquidationPrice.toFixed(6),
					collateralAmount,
					debtAmount,
					liquidationThreshold,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'convertATokenToUnderlying': {
			const amount = this.getNodeParameter('amount', index) as string;
			const asset = this.getNodeParameter('asset', index) as string;

			const reserveData = await getReserveData(client, asset);
			const liquidityIndex = Number(reserveData.liquidityIndex) / 1e27;
			const amountNum = parseFloat(amount);
			const underlyingAmount = amountNum * liquidityIndex;

			return [{
				json: {
					aTokenAmount: amount,
					underlyingAmount: underlyingAmount.toFixed(6),
					liquidityIndex: liquidityIndex.toFixed(10),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'convertUnderlyingToAToken': {
			const amount = this.getNodeParameter('amount', index) as string;
			const asset = this.getNodeParameter('asset', index) as string;

			const reserveData = await getReserveData(client, asset);
			const liquidityIndex = Number(reserveData.liquidityIndex) / 1e27;
			const amountNum = parseFloat(amount);
			const aTokenAmount = amountNum / liquidityIndex;

			return [{
				json: {
					underlyingAmount: amount,
					aTokenAmount: aTokenAmount.toFixed(6),
					liquidityIndex: liquidityIndex.toFixed(10),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'validateAddress': {
			const address = this.getNodeParameter('address', index) as string;
			const isValid = ethers.isAddress(address);

			return [{
				json: {
					address,
					isValid,
					checksumAddress: isValid ? ethers.getAddress(address) : null,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getContractAddresses': {
			return [{
				json: {
					pool: client.addresses.pool,
					poolDataProvider: client.addresses.poolDataProvider,
					oracle: client.addresses.oracle,
					poolAddressesProvider: client.addresses.poolAddressesProvider,
					wethGateway: client.addresses.wethGateway,
					rewardsController: client.addresses.rewardsController || 'Not configured',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'estimateGas': {
			const operation = this.getNodeParameter('operationType', index) as string;

			const gasEstimates: { [key: string]: string } = {
				supply: '200000',
				borrow: '250000',
				repay: '200000',
				withdraw: '200000',
				enableCollateral: '100000',
				disableCollateral: '100000',
				flashLoan: '500000',
				liquidation: '400000',
			};

			return [{
				json: {
					operation,
					estimatedGas: gasEstimates[operation] || '200000',
					message: 'Actual gas may vary based on network conditions',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getNetworkStatus': {
			const blockNumber = await client.provider.getBlockNumber();
			const network = await client.provider.getNetwork();

			return [{
				json: {
					network: client.network,
					chainId: Number(network.chainId),
					blockNumber,
					status: 'Connected',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}

export const execute = executeUtilityOperation;
