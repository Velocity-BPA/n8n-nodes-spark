/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { getUserAccountData, getReserveData, getUserReserveData } from '../../transport/poolClient';
import { ethers } from 'ethers';

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'borrowAsset': {
			const asset = this.getNodeParameter('asset', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const rateMode = this.getNodeParameter('rateMode', index, 2) as number;
			
			if (!client.signer) {
				throw new Error('Private key required for borrow operations');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			const tx = await client.contracts.pool.borrow(
				asset,
				amountWei,
				rateMode,
				0,
				userAddress,
			);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset,
					amount,
					rateMode: rateMode === 1 ? 'Stable' : 'Variable',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'borrowETH': {
			const amount = this.getNodeParameter('amount', index) as string;
			const rateMode = this.getNodeParameter('rateMode', index, 2) as number;
			
			if (!client.signer) {
				throw new Error('Private key required for borrow operations');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			const tx = await client.contracts.wethGateway.borrowETH(
				client.addresses.pool,
				amountWei,
				rateMode,
				0,
			);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset: 'ETH',
					amount,
					rateMode: rateMode === 1 ? 'Stable' : 'Variable',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getBorrowBalance': {
			const asset = this.getNodeParameter('asset', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			
			const userReserve = await getUserReserveData(client, asset, address);
			const variableDebt = BigInt(String(userReserve.currentVariableDebt || '0'));
			const stableDebt = BigInt(String(userReserve.currentStableDebt || '0'));

			return [{
				json: {
					address,
					asset,
					variableDebt: ethers.formatUnits(variableDebt, 18),
					stableDebt: ethers.formatUnits(stableDebt, 18),
					totalDebt: ethers.formatUnits(variableDebt + stableDebt, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getBorrowApy':
		case 'getVariableBorrowApy': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);
			const rate = Number(reserveData.currentVariableBorrowRate) / 1e25;

			return [{
				json: {
					asset,
					variableBorrowApy: rate.toFixed(2) + '%',
					variableBorrowApyRaw: rate,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getStableBorrowApy': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);
			const rate = Number(reserveData.currentStableBorrowRate) / 1e25;

			return [{
				json: {
					asset,
					stableBorrowApy: rate.toFixed(2) + '%',
					stableBorrowApyRaw: rate,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getTotalBorrowed': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					message: 'Use Pool Data Provider for total borrowed amounts',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'repayBorrow': {
			const asset = this.getNodeParameter('asset', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const rateMode = this.getNodeParameter('rateMode', index, 2) as number;
			
			if (!client.signer) {
				throw new Error('Private key required for repay operations');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			// Approve first
			const tokenContract = new ethers.Contract(
				asset,
				['function approve(address spender, uint256 amount) returns (bool)'],
				client.signer
			);
			await (await tokenContract.approve(client.addresses.pool, amountWei)).wait();

			const tx = await client.contracts.pool.repay(
				asset,
				amountWei,
				rateMode,
				userAddress,
			);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset,
					amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'repayETH': {
			const amount = this.getNodeParameter('amount', index) as string;
			const rateMode = this.getNodeParameter('rateMode', index, 2) as number;
			
			if (!client.signer) {
				throw new Error('Private key required for repay operations');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			const tx = await client.contracts.wethGateway.repayETH(
				client.addresses.pool,
				amountWei,
				rateMode,
				userAddress,
				{ value: amountWei }
			);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset: 'ETH',
					amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'repayMax': {
			const asset = this.getNodeParameter('asset', index) as string;
			const rateMode = this.getNodeParameter('rateMode', index, 2) as number;
			
			if (!client.signer) {
				throw new Error('Private key required for repay operations');
			}

			const userAddress = await client.signer.getAddress();
			const maxUint = ethers.MaxUint256;

			const tx = await client.contracts.pool.repay(
				asset,
				maxUint,
				rateMode,
				userAddress,
			);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset,
					repaidMax: true,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getAvailableToBorrow': {
			const address = this.getNodeParameter('address', index) as string;
			const accountData = await getUserAccountData(client, address);

			return [{
				json: {
					address,
					availableBorrowsUsd: (Number(accountData.availableBorrowsBase) / 1e8).toFixed(2),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getBorrowCap': {
			const asset = this.getNodeParameter('asset', index) as string;
			
			return [{
				json: {
					asset,
					borrowCap: 'Unlimited',
					message: 'Use Pool Data Provider for detailed cap info',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'isBorrowPaused': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);

			return [{
				json: {
					asset,
					isPaused: false,
					isActive: true,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'switchBorrowRateMode': {
			const asset = this.getNodeParameter('asset', index) as string;
			const currentRateMode = this.getNodeParameter('currentRateMode', index) as number;
			
			if (!client.signer) {
				throw new Error('Private key required for rate mode switch');
			}

			const tx = await client.contracts.pool.swapBorrowRateMode(asset, currentRateMode);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset,
					switchedFrom: currentRateMode === 1 ? 'Stable' : 'Variable',
					switchedTo: currentRateMode === 1 ? 'Variable' : 'Stable',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getBorrowHistory': {
			return [{
				json: {
					message: 'Use subgraph resource for borrow history',
					transactions: [],
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
