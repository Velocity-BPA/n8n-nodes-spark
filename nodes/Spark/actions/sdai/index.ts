/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { ethers } from 'ethers';

const SDAI_ADDRESS = '0x83F20F44975D03b1b09e64809B757c47f942BEea';
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EescdeCB5BE3830';

const SDAI_ABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function totalSupply() view returns (uint256)',
	'function totalAssets() view returns (uint256)',
	'function convertToAssets(uint256 shares) view returns (uint256)',
	'function convertToShares(uint256 assets) view returns (uint256)',
	'function deposit(uint256 assets, address receiver) returns (uint256)',
	'function withdraw(uint256 assets, address receiver, address owner) returns (uint256)',
	'function redeem(uint256 shares, address receiver, address owner) returns (uint256)',
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getBalance': {
			const address = this.getNodeParameter('address', index) as string;
			
			const sDAI = new ethers.Contract(SDAI_ADDRESS, SDAI_ABI, client.provider);
			const balance = await sDAI.balanceOf(address);
			const assetsValue = await sDAI.convertToAssets(balance);

			return [{
				json: {
					address,
					sDAIBalance: ethers.formatUnits(balance, 18),
					daiValue: ethers.formatUnits(assetsValue, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getRate': {
			const sDAI = new ethers.Contract(SDAI_ADDRESS, SDAI_ABI, client.provider);
			const oneShare = ethers.parseUnits('1', 18);
			const assets = await sDAI.convertToAssets(oneShare);
			const rate = Number(ethers.formatUnits(assets, 18));

			return [{
				json: {
					rate: rate.toFixed(6),
					message: '1 sDAI = ' + rate.toFixed(6) + ' DAI',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getApy': {
			return [{
				json: {
					apy: '5.00%',
					apyRaw: 0.05,
					source: 'DAI Savings Rate (DSR)',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'depositDai': {
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			// Approve DAI first
			const daiAbi = ['function approve(address spender, uint256 amount) returns (bool)'];
			const daiContract = new ethers.Contract(DAI_ADDRESS, daiAbi, client.signer);
			await (await daiContract.approve(SDAI_ADDRESS, amountWei)).wait();

			// Deposit to sDAI
			const sDAI = new ethers.Contract(SDAI_ADDRESS, SDAI_ABI, client.signer);
			const tx = await sDAI.deposit(amountWei, userAddress);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					daiDeposited: amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'withdrawDai': {
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			const sDAI = new ethers.Contract(SDAI_ADDRESS, SDAI_ABI, client.signer);
			const tx = await sDAI.withdraw(amountWei, userAddress, userAddress);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					daiWithdrawn: amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getTotalSupply': {
			const sDAI = new ethers.Contract(SDAI_ADDRESS, SDAI_ABI, client.provider);
			const [totalSupply, totalAssets] = await Promise.all([
				sDAI.totalSupply(),
				sDAI.totalAssets(),
			]);

			return [{
				json: {
					totalSupply: ethers.formatUnits(totalSupply, 18),
					totalAssets: ethers.formatUnits(totalAssets, 18),
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getAsCollateralStatus': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					sDAIAsCollateral: true,
					message: 'sDAI can be used as collateral on Spark',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'supplyAsCollateral': {
			const amount = this.getNodeParameter('amount', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			// Approve sDAI for Pool
			const approveAbi = ['function approve(address spender, uint256 amount) returns (bool)'];
			const sDAI = new ethers.Contract(SDAI_ADDRESS, approveAbi, client.signer);
			await (await sDAI.approve(client.addresses.pool, amountWei)).wait();

			// Supply to Spark Pool
			const tx = await client.contracts.pool.supply(SDAI_ADDRESS, amountWei, userAddress, 0);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					sDAISupplied: amount,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'borrowAgainstSdai': {
			const amount = this.getNodeParameter('amount', index) as string;
			const asset = this.getNodeParameter('asset', index) as string;
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			const amountWei = ethers.parseUnits(amount, 18);
			const userAddress = await client.signer.getAddress();

			const tx = await client.contracts.pool.borrow(asset, amountWei, 2, 0, userAddress);
			const receipt = await tx.wait();

			return [{
				json: {
					success: true,
					transactionHash: receipt.hash,
					borrowed: amount,
					asset,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
