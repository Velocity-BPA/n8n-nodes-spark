/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient, SparkClient } from '../../transport/sparkClient';
import { getUserAccountData } from '../../transport/poolClient';
import { ethers } from 'ethers';

// Helper to parse health factor from various formats
function parseHealthFactor(value: any): number {
	if (typeof value === 'number') return value;
	const str = String(value);
	const num = Number(str) / 1e18;
	return isFinite(num) ? num : Infinity;
}

function getHealthFactorStatus(hf: number): string {
	if (!isFinite(hf)) return 'No Debt';
	if (hf >= 2) return 'Very Safe';
	if (hf >= 1.5) return 'Safe';
	if (hf >= 1.2) return 'Moderate';
	if (hf >= 1.05) return 'At Risk';
	if (hf >= 1) return 'Danger';
	return 'Liquidatable';
}

function formatUsdValue(value: any): string {
	const num = Number(String(value)) / 1e8;
	return num.toFixed(2);
}

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);
	const address = this.getNodeParameter('address', index) as string;

	if (!ethers.isAddress(address)) {
		throw new Error('Invalid Ethereum address');
	}

	switch (operation) {
		case 'getOverview': {
			const accountData = await getUserAccountData(client, address);
			const healthFactor = parseHealthFactor(accountData.healthFactor);
			const healthStatus = getHealthFactorStatus(healthFactor);

			return [{
				json: {
					address,
					totalCollateralBase: formatUsdValue(accountData.totalCollateralBase),
					totalDebtBase: formatUsdValue(accountData.totalDebtBase),
					availableBorrowsBase: formatUsdValue(accountData.availableBorrowsBase),
					currentLiquidationThreshold: (Number(accountData.currentLiquidationThreshold) / 100).toFixed(2) + '%',
					ltv: (Number(accountData.ltv) / 100).toFixed(2) + '%',
					healthFactor: healthFactor.toFixed(4),
					healthStatus,
					timestamp: new Date().toISOString(),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getBalances': {
			const accountData = await getUserAccountData(client, address);
			return [{
				json: {
					address,
					totalCollateralUsd: formatUsdValue(accountData.totalCollateralBase),
					totalDebtUsd: formatUsdValue(accountData.totalDebtBase),
					availableBorrowsUsd: formatUsdValue(accountData.availableBorrowsBase),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getSupplied': {
			const accountData = await getUserAccountData(client, address);
			return [{
				json: {
					address,
					totalSuppliedUsd: formatUsdValue(accountData.totalCollateralBase),
					message: 'For detailed per-asset supplies, use the Supply resource',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getBorrowed': {
			const accountData = await getUserAccountData(client, address);
			return [{
				json: {
					address,
					totalBorrowedUsd: formatUsdValue(accountData.totalDebtBase),
					message: 'For detailed per-asset borrows, use the Borrow resource',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getHealthFactor': {
			const accountData = await getUserAccountData(client, address);
			const healthFactor = parseHealthFactor(accountData.healthFactor);
			const healthStatus = getHealthFactorStatus(healthFactor);

			return [{
				json: {
					address,
					healthFactor: healthFactor.toFixed(4),
					healthFactorRaw: String(accountData.healthFactor),
					status: healthStatus,
					isLiquidatable: healthFactor < 1,
					totalCollateralBase: formatUsdValue(accountData.totalCollateralBase),
					totalDebtBase: formatUsdValue(accountData.totalDebtBase),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getNetApy': {
			return [{
				json: {
					address,
					netApy: '0.00%',
					netApyRaw: 0,
					message: 'Net APY calculation requires position details from subgraph',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getValue': {
			const accountData = await getUserAccountData(client, address);
			const totalCollateral = BigInt(String(accountData.totalCollateralBase));
			const totalDebt = BigInt(String(accountData.totalDebtBase));
			const netValue = totalCollateral > totalDebt ? totalCollateral - totalDebt : 0n;

			return [{
				json: {
					address,
					totalCollateralUsd: formatUsdValue(accountData.totalCollateralBase),
					totalDebtUsd: formatUsdValue(accountData.totalDebtBase),
					netValueUsd: formatUsdValue(netValue.toString()),
					availableBorrowsUsd: formatUsdValue(accountData.availableBorrowsBase),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getHistory': {
			return [{
				json: {
					address,
					transactions: [],
					count: 0,
					message: 'Use subgraph resource for detailed transaction history',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getLiquidationRisk': {
			const accountData = await getUserAccountData(client, address);
			const healthFactor = parseHealthFactor(accountData.healthFactor);
			const healthStatus = getHealthFactorStatus(healthFactor);

			let riskLevel: string;
			let riskScore: number;

			if (healthFactor >= 2) {
				riskLevel = 'Very Low';
				riskScore = 0;
			} else if (healthFactor >= 1.5) {
				riskLevel = 'Low';
				riskScore = 25;
			} else if (healthFactor >= 1.2) {
				riskLevel = 'Medium';
				riskScore = 50;
			} else if (healthFactor >= 1.05) {
				riskLevel = 'High';
				riskScore = 75;
			} else {
				riskLevel = 'Critical';
				riskScore = 100;
			}

			return [{
				json: {
					address,
					healthFactor: healthFactor.toFixed(4),
					healthStatus,
					riskLevel,
					riskScore,
					isLiquidatable: healthFactor < 1,
					bufferToLiquidation: (healthFactor - 1).toFixed(4),
					recommendations: healthFactor < 1.5
						? ['Consider repaying debt', 'Add more collateral', 'Switch to lower-risk assets']
						: ['Position is healthy'],
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getAvailableActions': {
			const accountData = await getUserAccountData(client, address);
			const healthFactor = parseHealthFactor(accountData.healthFactor);
			const totalCollateral = BigInt(String(accountData.totalCollateralBase));
			const totalDebt = BigInt(String(accountData.totalDebtBase));
			const availableBorrows = BigInt(String(accountData.availableBorrowsBase));

			const actions: string[] = ['Supply Assets'];

			if (availableBorrows > 0n) {
				actions.push('Borrow Assets');
			}

			if (totalCollateral > 0n) {
				actions.push('Withdraw Assets');
				if (healthFactor > 1.1) {
					actions.push('Disable Collateral');
				}
			}

			if (totalDebt > 0n) {
				actions.push('Repay Debt');
				actions.push('Switch Rate Mode');
			}

			actions.push('Set E-Mode');
			actions.push('View Rewards');

			return [{
				json: {
					address,
					availableActions: actions,
					healthFactor: healthFactor.toFixed(4),
					hasCollateral: totalCollateral > 0n,
					hasDebt: totalDebt > 0n,
					canBorrow: availableBorrows > 0n,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
