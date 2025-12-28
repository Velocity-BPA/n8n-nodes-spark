/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { ethers } from 'ethers';

const FLASH_LOAN_PREMIUM = 9; // 0.09% in basis points

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'executeFlashLoan': {
			const receiverAddress = this.getNodeParameter('receiverAddress', index) as string;
			const assets = this.getNodeParameter('assets', index) as string[];
			const amounts = this.getNodeParameter('amounts', index) as string[];
			const params = this.getNodeParameter('params', index, '0x') as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const amountsWei = amounts.map(a => ethers.parseUnits(a, 18));
			const modes = assets.map(() => 0); // 0 = no debt

			const tx = await client.contracts.pool.flashLoan(
				receiverAddress,
				assets,
				amountsWei,
				modes,
				receiverAddress,
				params,
				0
			);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					assets,
					amounts,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'executeFlashLoanSimple': {
			const receiverAddress = this.getNodeParameter('receiverAddress', index) as string;
			const asset = this.getNodeParameter('asset', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const params = this.getNodeParameter('params', index, '0x') as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const amountWei = ethers.parseUnits(amount, 18);

			const tx = await client.contracts.pool.flashLoanSimple(
				receiverAddress,
				asset,
				amountWei,
				params,
				0
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

		case 'getFlashLoanPremium': {
			return [{
				json: {
					premiumBasisPoints: FLASH_LOAN_PREMIUM,
					premiumPercentage: (FLASH_LOAN_PREMIUM / 100).toFixed(2) + '%',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMaxFlashLoanAmount': {
			const asset = this.getNodeParameter('asset', index) as string;

			const tokenAbi = ['function balanceOf(address) view returns (uint256)'];
			const tokenContract = new ethers.Contract(asset, tokenAbi, client.provider);
			const poolBalance = await tokenContract.balanceOf(client.addresses.pool);

			return [{
				json: {
					asset,
					maxFlashLoanAmount: ethers.formatUnits(poolBalance, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getFlashLoanFees': {
			const amount = this.getNodeParameter('amount', index) as string;

			const amountNum = parseFloat(amount);
			const fee = amountNum * FLASH_LOAN_PREMIUM / 10000;

			return [{
				json: {
					amount,
					premiumBasisPoints: FLASH_LOAN_PREMIUM,
					fee: fee.toFixed(6),
					totalRequired: (amountNum + fee).toFixed(6),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'estimateFlashLoanCost': {
			const amount = this.getNodeParameter('amount', index) as string;

			const amountNum = parseFloat(amount);
			const fee = amountNum * FLASH_LOAN_PREMIUM / 10000;

			return [{
				json: {
					amount,
					fee: fee.toFixed(6),
					premiumPercentage: (FLASH_LOAN_PREMIUM / 100).toFixed(2) + '%',
					estimatedGas: '300000',
					message: 'Actual gas depends on receiver contract logic',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
