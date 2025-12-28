/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);

	switch (operation) {
		case 'getProposals': {
			return [{
				json: {
					proposals: [],
					message: 'Spark governance is managed through MakerDAO. Use subgraph for proposal data.',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getVotingPower': {
			const address = this.getNodeParameter('address', index) as string;

			return [{
				json: {
					address,
					votingPower: '0',
					message: 'Voting power determined by MKR holdings in MakerDAO governance',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'voteOnProposal': {
			return [{
				json: {
					message: 'Spark uses MakerDAO governance. Vote through MakerDAO governance portal.',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getGovernanceStats': {
			return [{
				json: {
					governanceType: 'MakerDAO SubDAO',
					votingToken: 'MKR',
					governancePortal: 'https://vote.makerdao.com',
					message: 'Spark Protocol is governed by MakerDAO',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getDelegates': {
			return [{
				json: {
					delegates: [],
					message: 'See MakerDAO delegation system for delegate information',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'delegateVotes': {
			return [{
				json: {
					message: 'Delegate MKR votes through MakerDAO governance portal',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
