/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { ethers } from 'ethers';

const DEBT_TOKEN_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function totalSupply() view returns (uint256)',
	'function scaledBalanceOf(address owner) view returns (uint256)',
	'function scaledTotalSupply() view returns (uint256)',
	'function borrowAllowance(address fromUser, address toUser) view returns (uint256)',
	'function approveDelegation(address delegatee, uint256 amount)',
	'function UNDERLYING_ASSET_ADDRESS() view returns (address)',
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getVariableDebtInfo': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			
			const debtToken = new ethers.Contract(tokenAddress, DEBT_TOKEN_ABI, client.provider);
			const [totalSupply, underlying] = await Promise.all([
				debtToken.totalSupply(),
				debtToken.UNDERLYING_ASSET_ADDRESS().catch(() => 'Unknown'),
			]);

			return [{
				json: {
					tokenAddress,
					totalSupply: ethers.formatUnits(totalSupply, 18),
					underlyingAsset: underlying,
					type: 'Variable',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getStableDebtInfo': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			
			const debtToken = new ethers.Contract(tokenAddress, DEBT_TOKEN_ABI, client.provider);
			const [totalSupply, underlying] = await Promise.all([
				debtToken.totalSupply(),
				debtToken.UNDERLYING_ASSET_ADDRESS().catch(() => 'Unknown'),
			]);

			return [{
				json: {
					tokenAddress,
					totalSupply: ethers.formatUnits(totalSupply, 18),
					underlyingAsset: underlying,
					type: 'Stable',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getDebtBalance': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			
			const debtToken = new ethers.Contract(tokenAddress, DEBT_TOKEN_ABI, client.provider);
			const balance = await debtToken.balanceOf(address);

			return [{
				json: {
					address,
					tokenAddress,
					debtBalance: ethers.formatUnits(balance, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getTotalDebt': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			
			const debtToken = new ethers.Contract(tokenAddress, DEBT_TOKEN_ABI, client.provider);
			const totalSupply = await debtToken.totalSupply();

			return [{
				json: {
					tokenAddress,
					totalDebt: ethers.formatUnits(totalSupply, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getBorrowAllowance': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const delegator = this.getNodeParameter('delegator', index) as string;
			const delegatee = this.getNodeParameter('delegatee', index) as string;
			
			const debtToken = new ethers.Contract(tokenAddress, DEBT_TOKEN_ABI, client.provider);
			const allowance = await debtToken.borrowAllowance(delegator, delegatee);

			return [{
				json: {
					delegator,
					delegatee,
					tokenAddress,
					allowance: ethers.formatUnits(allowance, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'delegateBorrow': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const delegatee = this.getNodeParameter('delegatee', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const debtToken = new ethers.Contract(tokenAddress, DEBT_TOKEN_ABI, client.signer);
			const tx = await debtToken.approveDelegation(delegatee, amountWei);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					delegatee,
					amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getDelegatedAmount': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const delegator = this.getNodeParameter('delegator', index) as string;
			const delegatee = this.getNodeParameter('delegatee', index) as string;
			
			const debtToken = new ethers.Contract(tokenAddress, DEBT_TOKEN_ABI, client.provider);
			const allowance = await debtToken.borrowAllowance(delegator, delegatee);

			return [{
				json: {
					delegator,
					delegatee,
					delegatedAmount: ethers.formatUnits(allowance, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'revokeDelegation': {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const delegatee = this.getNodeParameter('delegatee', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const debtToken = new ethers.Contract(tokenAddress, DEBT_TOKEN_ABI, client.signer);
			const tx = await debtToken.approveDelegation(delegatee, 0);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					delegatee,
					revoked: true,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
