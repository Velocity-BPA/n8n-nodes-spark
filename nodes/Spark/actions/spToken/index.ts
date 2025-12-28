/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { getReserveData, getUserReserveData } from '../../transport/poolClient';
import { ethers } from 'ethers';

const SPTOKEN_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function totalSupply() view returns (uint256)',
	'function scaledBalanceOf(address owner) view returns (uint256)',
	'function scaledTotalSupply() view returns (uint256)',
	'function UNDERLYING_ASSET_ADDRESS() view returns (address)',
	'function transfer(address to, uint256 amount) returns (bool)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function allowance(address owner, address spender) view returns (uint256)',
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getSpTokenInfo': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);
			
			const spToken = new ethers.Contract(reserveData.aTokenAddress, SPTOKEN_ABI, client.provider);
			const [totalSupply, underlying] = await Promise.all([
				spToken.totalSupply(),
				spToken.UNDERLYING_ASSET_ADDRESS().catch(() => asset),
			]);

			return [{
				json: {
					asset,
					spTokenAddress: reserveData.aTokenAddress,
					totalSupply: ethers.formatUnits(totalSupply, 18),
					underlyingAsset: underlying,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getSpTokenBalance': {
			const asset = this.getNodeParameter('asset', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			
			const reserveData = await getReserveData(client, asset);
			const spToken = new ethers.Contract(reserveData.aTokenAddress, SPTOKEN_ABI, client.provider);
			const balance = await spToken.balanceOf(address);

			return [{
				json: {
					address,
					asset,
					spTokenAddress: reserveData.aTokenAddress,
					balance: ethers.formatUnits(balance, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getSpTokenSupply': {
			const asset = this.getNodeParameter('asset', index) as string;
			
			const reserveData = await getReserveData(client, asset);
			const spToken = new ethers.Contract(reserveData.aTokenAddress, SPTOKEN_ABI, client.provider);
			const totalSupply = await spToken.totalSupply();

			return [{
				json: {
					asset,
					spTokenAddress: reserveData.aTokenAddress,
					totalSupply: ethers.formatUnits(totalSupply, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'transferSpToken': {
			const asset = this.getNodeParameter('asset', index) as string;
			const to = this.getNodeParameter('to', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const reserveData = await getReserveData(client, asset);
			const amountWei = ethers.parseUnits(amount, 18);
			const spToken = new ethers.Contract(reserveData.aTokenAddress, SPTOKEN_ABI, client.signer);
			const tx = await spToken.transfer(to, amountWei);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					to,
					amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'approveSpToken': {
			const asset = this.getNodeParameter('asset', index) as string;
			const spender = this.getNodeParameter('spender', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const reserveData = await getReserveData(client, asset);
			const amountWei = ethers.parseUnits(amount, 18);
			const spToken = new ethers.Contract(reserveData.aTokenAddress, SPTOKEN_ABI, client.signer);
			const tx = await spToken.approve(spender, amountWei);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					spender,
					amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getUnderlyingAsset': {
			const asset = this.getNodeParameter('asset', index) as string;
			
			const reserveData = await getReserveData(client, asset);
			const spToken = new ethers.Contract(reserveData.aTokenAddress, SPTOKEN_ABI, client.provider);
			const underlying = await spToken.UNDERLYING_ASSET_ADDRESS().catch(() => asset);

			return [{
				json: {
					spTokenAddress: reserveData.aTokenAddress,
					underlyingAsset: underlying,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getExchangeRate': {
			const asset = this.getNodeParameter('asset', index) as string;
			
			const reserveData = await getReserveData(client, asset);
			const rate = Number(reserveData.liquidityIndex) / 1e27;

			return [{
				json: {
					asset,
					exchangeRate: rate.toFixed(10),
					message: '1 spToken = ' + rate.toFixed(6) + ' underlying',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getScaledBalance': {
			const asset = this.getNodeParameter('asset', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			
			const reserveData = await getReserveData(client, asset);
			const spToken = new ethers.Contract(reserveData.aTokenAddress, SPTOKEN_ABI, client.provider);
			const scaledBalance = await spToken.scaledBalanceOf(address);

			return [{
				json: {
					address,
					asset,
					scaledBalance: ethers.formatUnits(scaledBalance, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getInterestEarned': {
			const asset = this.getNodeParameter('asset', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			
			const reserveData = await getReserveData(client, asset);
			const spToken = new ethers.Contract(reserveData.aTokenAddress, SPTOKEN_ABI, client.provider);
			
			const [balance, scaledBalance] = await Promise.all([
				spToken.balanceOf(address),
				spToken.scaledBalanceOf(address),
			]);

			const balanceNum = Number(ethers.formatUnits(balance, 18));
			const scaledNum = Number(ethers.formatUnits(scaledBalance, 18));
			const interest = balanceNum - scaledNum;

			return [{
				json: {
					address,
					asset,
					currentBalance: balanceNum.toFixed(6),
					principalBalance: scaledNum.toFixed(6),
					interestEarned: interest > 0 ? interest.toFixed(6) : '0',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
