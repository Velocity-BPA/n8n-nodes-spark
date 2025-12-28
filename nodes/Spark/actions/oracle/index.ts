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
		case 'getAssetPrice': {
			const asset = this.getNodeParameter('asset', index) as string;
			
			const price = await client.contracts.oracle.getAssetPrice(asset);
			const priceUsd = Number(price) / 1e8;

			return [{
				json: {
					asset,
					priceUsd: priceUsd.toFixed(6),
					priceRaw: price.toString(),
					decimals: 8,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getAssetPrices': {
			const assets = this.getNodeParameter('assets', index) as string[];
			
			const prices = await Promise.all(
				assets.map(async (asset) => {
					try {
						const price = await client.contracts.oracle.getAssetPrice(asset);
						return {
							asset,
							priceUsd: (Number(price) / 1e8).toFixed(6),
							priceRaw: price.toString(),
						};
					} catch (error) {
						return {
							asset,
							priceUsd: '0',
							error: 'Price not available',
						};
					}
				})
			);

			return [{
				json: {
					prices,
					count: prices.length,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'getPriceSource': {
			const asset = this.getNodeParameter('asset', index) as string;

			try {
				const source = await client.contracts.oracle.getSourceOfAsset(asset);
				return [{
					json: {
						asset,
						source,
					} as IDataObject,
					pairedItem: { item: index },
				}];
			} catch {
				return [{
					json: {
						asset,
						source: 'Unknown',
						message: 'Price source not directly queryable',
					} as IDataObject,
					pairedItem: { item: index },
				}];
			}
		}

		case 'getFallbackOracle': {
			try {
				const fallback = await client.contracts.oracle.getFallbackOracle();
				return [{
					json: {
						fallbackOracle: fallback,
					} as IDataObject,
					pairedItem: { item: index },
				}];
			} catch {
				return [{
					json: {
						fallbackOracle: 'Not configured or not queryable',
					} as IDataObject,
					pairedItem: { item: index },
				}];
			}
		}

		case 'getHistoricalPrices': {
			const asset = this.getNodeParameter('asset', index) as string;

			return [{
				json: {
					asset,
					prices: [],
					message: 'Use subgraph or external price feeds for historical data',
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		case 'validatePrice': {
			const asset = this.getNodeParameter('asset', index) as string;
			const expectedPrice = this.getNodeParameter('expectedPrice', index) as number;
			const tolerance = this.getNodeParameter('tolerance', index, 5) as number;

			const price = await client.contracts.oracle.getAssetPrice(asset);
			const priceUsd = Number(price) / 1e8;
			const deviation = Math.abs((priceUsd - expectedPrice) / expectedPrice * 100);
			const isValid = deviation <= tolerance;

			return [{
				json: {
					asset,
					oraclePrice: priceUsd.toFixed(6),
					expectedPrice: expectedPrice.toFixed(6),
					deviation: deviation.toFixed(2) + '%',
					tolerance: tolerance + '%',
					isValid,
				} as IDataObject,
				pairedItem: { item: index },
			}];
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
