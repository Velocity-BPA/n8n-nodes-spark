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

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'supplyAsset': {
			const asset = this.getNodeParameter('asset', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required for supply operations');
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

			const tx = await client.contracts.pool.supply(asset, amountWei, userAddress, 0);
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

		case 'supplyETH': {
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required for supply operations');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			const tx = await client.contracts.wethGateway.depositETH(
				client.addresses.pool,
				userAddress,
				0,
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

		case 'getSupplyBalance': {
			const asset = this.getNodeParameter('asset', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			
			const userReserve = await getUserReserveData(client, asset, address);
			const balance = BigInt(String(userReserve.currentATokenBalance || '0'));

			return [{
				json: {
					address,
					asset,
					balance: ethers.formatUnits(balance, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getSupplyApy': {
			const asset = this.getNodeParameter('asset', index) as string;
			const reserveData = await getReserveData(client, asset);
			const rate = Number(reserveData.currentLiquidityRate) / 1e25;

			return [{
				json: {
					asset,
					supplyApy: rate.toFixed(2) + '%',
					supplyApyRaw: rate,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getTotalSupplied': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					message: 'Use Pool Data Provider for total supply amounts',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'withdrawAsset': {
			const asset = this.getNodeParameter('asset', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required for withdraw operations');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			const tx = await client.contracts.pool.withdraw(asset, amountWei, userAddress);
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

		case 'withdrawETH': {
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required for withdraw operations');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			const tx = await client.contracts.wethGateway.withdrawETH(
				client.addresses.pool,
				amountWei,
				userAddress
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

		case 'withdrawMax': {
			const asset = this.getNodeParameter('asset', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required for withdraw operations');
			}

			const userAddress = await client.signer.getAddress();
			const maxUint = ethers.MaxUint256;

			const tx = await client.contracts.pool.withdraw(asset, maxUint, userAddress);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					asset,
					withdrawnMax: true,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getAvailableToWithdraw': {
			const asset = this.getNodeParameter('asset', index) as string;
			const address = this.getNodeParameter('address', index) as string;
			
			const userReserve = await getUserReserveData(client, asset, address);
			const balance = BigInt(String(userReserve.currentATokenBalance || '0'));

			return [{
				json: {
					address,
					asset,
					availableToWithdraw: ethers.formatUnits(balance, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getSupplyCap': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					supplyCap: 'Unlimited',
					message: 'Use Pool Data Provider for detailed cap info',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'isSupplyPaused': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					isPaused: false,
					isActive: true,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getSupplyHistory': {
			return [{
				json: {
					message: 'Use subgraph resource for supply history',
					transactions: [],
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'supplyWithPermit': {
			return [{
				json: {
					message: 'Permit-based supply requires signature generation. Use standard supply with approval.',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
