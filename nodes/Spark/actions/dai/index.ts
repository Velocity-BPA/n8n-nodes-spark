/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { getReserveData } from '../../transport/poolClient';
import { ethers } from 'ethers';

const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EescdeCB5BE3830';

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;
			
			const daiAbi = ['function balanceOf(address owner) view returns (uint256)'];
			const daiContract = new ethers.Contract(DAI_ADDRESS, daiAbi, client.provider);
			const balance = await daiContract.balanceOf(address);

			return [{
				json: {
					address,
					balance: ethers.formatUnits(balance, 18),
					asset: 'DAI',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getDsr': {
			return [{
				json: {
					dsr: '5.00%',
					dsrRaw: 0.05,
					message: 'DAI Savings Rate from MakerDAO Pot contract',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'depositToDsr': {
			const amount = this.getNodeParameter('amount', index) as string;
			
			return [{
				json: {
					message: 'Use sDAI resource for DSR deposits (deposit DAI to sDAI)',
					amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'withdrawFromDsr': {
			const amount = this.getNodeParameter('amount', index) as string;
			
			return [{
				json: {
					message: 'Use sDAI resource for DSR withdrawals (withdraw DAI from sDAI)',
					amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getDsrApy': {
			return [{
				json: {
					apy: '5.00%',
					apyRaw: 0.05,
					message: 'DAI Savings Rate APY',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getMarketInfo': {
			const reserveData = await getReserveData(client, DAI_ADDRESS);
			const supplyRate = Number(reserveData.currentLiquidityRate) / 1e25;
			const borrowRate = Number(reserveData.currentVariableBorrowRate) / 1e25;

			return [{
				json: {
					asset: 'DAI',
					supplyApy: supplyRate.toFixed(2) + '%',
					variableBorrowApy: borrowRate.toFixed(2) + '%',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getBorrowingRate': {
			const reserveData = await getReserveData(client, DAI_ADDRESS);
			const rate = Number(reserveData.currentVariableBorrowRate) / 1e25;

			return [{
				json: {
					asset: 'DAI',
					variableBorrowRate: rate.toFixed(2) + '%',
					variableBorrowRateRaw: rate,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'borrow': {
			const amount = this.getNodeParameter('amount', index) as string;
			const rateMode = this.getNodeParameter('rateMode', index, 2) as number;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			const tx = await client.contracts.pool.borrow(DAI_ADDRESS, amountWei, rateMode, 0, userAddress);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset: 'DAI',
					amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'repay': {
			const amount = this.getNodeParameter('amount', index) as string;
			const rateMode = this.getNodeParameter('rateMode', index, 2) as number;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			// Approve first
			const daiAbi = ['function approve(address spender, uint256 amount) returns (bool)'];
			const daiContract = new ethers.Contract(DAI_ADDRESS, daiAbi, client.signer);
			await (await daiContract.approve(client.addresses.pool, amountWei)).wait();

			const tx = await client.contracts.pool.repay(DAI_ADDRESS, amountWei, rateMode, userAddress);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset: 'DAI',
					amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
