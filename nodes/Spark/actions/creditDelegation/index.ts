/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { ethers } from 'ethers';

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'approveDelegation': {
			const delegatee = this.getNodeParameter('delegatee', index) as string;
			const asset = this.getNodeParameter('asset', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required for delegation');
			}

			const amountWei = ethers.parseUnits(amount, 18);

			// Get variable debt token address and approve delegation
			const debtTokenAbi = ['function approveDelegation(address delegatee, uint256 amount)'];
			const debtTokenContract = new ethers.Contract(asset, debtTokenAbi, client.signer);
			const tx = await debtTokenContract.approveDelegation(delegatee, amountWei);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					delegatee,
					asset,
					amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getBorrowAllowance': {
			const delegatee = this.getNodeParameter('delegatee', index) as string;
			const delegator = this.getNodeParameter('delegator', index) as string;
			const asset = this.getNodeParameter('asset', index) as string;

			const debtTokenAbi = ['function borrowAllowance(address fromUser, address toUser) view returns (uint256)'];
			const debtTokenContract = new ethers.Contract(asset, debtTokenAbi, client.provider);
			const allowance = await debtTokenContract.borrowAllowance(delegator, delegatee);

			return [{
				json: {
					delegator,
					delegatee,
					asset,
					allowance: ethers.formatUnits(allowance, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'borrowOnBehalf': {
			const asset = this.getNodeParameter('asset', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const onBehalfOf = this.getNodeParameter('onBehalfOf', index) as string;
			const rateMode = this.getNodeParameter('rateMode', index, 2) as number;
			
			if (!client.signer) {
				throw new Error('Private key required for borrow');
			}

			const amountWei = ethers.parseUnits(amount, 18);

			const tx = await client.contracts.pool.borrow(asset, amountWei, rateMode, 0, onBehalfOf);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset,
					amount,
					onBehalfOf,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getDelegatedBorrowPower': {
			const delegatee = this.getNodeParameter('delegatee', index) as string;

			return [{
				json: {
					delegatee,
					delegatedPower: '0',
					message: 'Query individual debt tokens for delegated allowances',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'revokeDelegation': {
			const delegatee = this.getNodeParameter('delegatee', index) as string;
			const asset = this.getNodeParameter('asset', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const debtTokenAbi = ['function approveDelegation(address delegatee, uint256 amount)'];
			const debtTokenContract = new ethers.Contract(asset, debtTokenAbi, client.signer);
			const tx = await debtTokenContract.approveDelegation(delegatee, 0);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					delegatee,
					asset,
					revoked: true,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getDelegationEvents': {
			return [{
				json: {
					events: [],
					message: 'Use subgraph resource for delegation events',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
