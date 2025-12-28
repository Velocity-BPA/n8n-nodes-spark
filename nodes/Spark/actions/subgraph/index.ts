/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';
import { createSparkClient } from '../../transport/sparkClient';
import { request, gql } from 'graphql-request';

const SPARK_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/messari/spark-lend-ethereum';

export async function executeSubgraphOperation(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const client = await createSparkClient(this);
	const subgraphUrl = SPARK_SUBGRAPH_URL;

	switch (operation) {
		case 'queryMarkets': {
			const query = gql`
				query {
					markets(first: 100) {
						id
						name
						inputToken {
							id
							symbol
							decimals
						}
						totalValueLockedUSD
						totalBorrowBalanceUSD
						totalDepositBalanceUSD
					}
				}
			`;

			try {
				const data = await request(subgraphUrl, query) as { markets: unknown[] };
				return [{
					json: {
						markets: data.markets,
						count: data.markets.length,
					} as IDataObject,
					pairedItem: { item: index },
				}];
			} catch (error) {
				return [{
					json: {
						markets: [],
						error: 'Subgraph query failed',
					} as IDataObject,
					pairedItem: { item: index },
				}];
			}
		}

		case 'queryUsers': {
			const limit = this.getNodeParameter('limit', index, 100) as number;

			const query = gql`
				query($first: Int!) {
					accounts(first: $first) {
						id
						positionCount
					}
				}
			`;

			try {
				const data = await request(subgraphUrl, query, { first: limit }) as { accounts: unknown[] };
				return [{
					json: {
						users: data.accounts,
						count: data.accounts.length,
					} as IDataObject,
					pairedItem: { item: index },
				}];
			} catch (error) {
				return [{
					json: {
						users: [],
						error: 'Subgraph query failed',
					} as IDataObject,
					pairedItem: { item: index },
				}];
			}
		}

		case 'queryTransactions': {
			const limit = this.getNodeParameter('limit', index, 100) as number;

			const query = gql`
				query($first: Int!) {
					transactions(first: $first, orderBy: timestamp, orderDirection: desc) {
						id
						hash
						timestamp
						blockNumber
					}
				}
			`;

			try {
				const data = await request(subgraphUrl, query, { first: limit }) as { transactions: unknown[] };
				return [{
					json: {
						transactions: data.transactions,
						count: data.transactions.length,
					} as IDataObject,
					pairedItem: { item: index },
				}];
			} catch (error) {
				return [{
					json: {
						transactions: [],
						error: 'Subgraph query failed',
					} as IDataObject,
					pairedItem: { item: index },
				}];
			}
		}

		case 'queryLiquidations': {
			const limit = this.getNodeParameter('limit', index, 100) as number;

			const query = gql`
				query($first: Int!) {
					liquidates(first: $first, orderBy: timestamp, orderDirection: desc) {
						id
						hash
						timestamp
						amountUSD
						profitUSD
					}
				}
			`;

			try {
				const data = await request(subgraphUrl, query, { first: limit }) as { liquidates: unknown[] };
				return [{
					json: {
						liquidations: data.liquidates,
						count: data.liquidates.length,
					} as IDataObject,
					pairedItem: { item: index },
				}];
			} catch (error) {
				return [{
					json: {
						liquidations: [],
						error: 'Subgraph query failed',
					} as IDataObject,
					pairedItem: { item: index },
				}];
			}
		}

		case 'queryRewards': {
			return [{
				json: {
					rewards: [],
					message: 'Query specific reward events through custom GraphQL',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'customQuery': {
			const customQuery = this.getNodeParameter('query', index) as string;
			const variables = this.getNodeParameter('variables', index, {}) as Record<string, unknown>;

			try {
				const data = await request(subgraphUrl, customQuery, variables as any);
				return [{
					json: {
						result: data,
					} as IDataObject,
					pairedItem: { item: index },
				}];
			} catch (error) {
				return [{
					json: {
						error: 'Custom query failed',
						message: String(error),
					} as IDataObject,
					pairedItem: { item: index },
				}];
			}
		}

		case 'getSubgraphStatus': {
			return [{
				json: {
					url: subgraphUrl,
					status: 'Available',
					network: 'Ethereum',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}

export const execute = executeSubgraphOperation;
