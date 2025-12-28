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
		case 'getRewardsInfo': {
			return [{
				json: {
					message: 'Spark rewards controlled by MakerDAO. Query rewards controller for details.',
					rewardsController: client.addresses.rewardsController || 'Not configured',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getClaimableRewards': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					claimableRewards: '0',
					message: 'Query rewards controller for claimable amounts',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'claimRewards': {
			const assets = this.getNodeParameter('assets', index) as string[];
			
			if (!client.signer) {
				throw new Error('Private key required');
			}

			return [{
				json: {
					message: 'Rewards claiming requires specific rewards controller interaction',
					assets,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'claimAllRewards': {
			if (!client.signer) {
				throw new Error('Private key required');
			}

			return [{
				json: {
					message: 'Claim all rewards through rewards controller',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getRewardAssets': {
			return [{
				json: {
					assets: [],
					message: 'Query rewards controller for reward asset list',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getRewardRate': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					rewardRate: '0',
					message: 'Query rewards controller for emission rates',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getRewardDistribution': {
			return [{
				json: {
					distribution: [],
					message: 'Query rewards controller for distribution info',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getUserRewards': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					rewards: [],
					totalClaimable: '0',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getUnclaimedRewards': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					unclaimed: '0',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
