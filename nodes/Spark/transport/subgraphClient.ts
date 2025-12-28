/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { GraphQLClient, gql } from 'graphql-request';
import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { NETWORKS } from '../constants/networks';

/**
 * Subgraph Client
 *
 * Handles GraphQL queries to The Graph subgraphs for Spark Protocol.
 * Used for historical data, analytics, and complex queries.
 */

export interface SubgraphConfig {
  network: string;
  customUrl?: string;
}

/**
 * Create a GraphQL client for the Spark subgraph
 */
export function createSubgraphClient(config: SubgraphConfig): GraphQLClient {
  const url = config.customUrl || NETWORKS[config.network]?.subgraphUrl;

  if (!url) {
    throw new Error(`Subgraph URL not found for network: ${config.network}`);
  }

  return new GraphQLClient(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Query markets from subgraph
 */
export async function queryMarkets(
  client: GraphQLClient,
  options: {
    first?: number;
    skip?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    where?: Record<string, unknown>;
  } = {},
): Promise<unknown[]> {
  const {
    first = 100,
    skip = 0,
    orderBy = 'totalValueLockedUSD',
    orderDirection = 'desc',
    where,
  } = options;

  const query = gql`
    query GetMarkets(
      $first: Int!
      $skip: Int!
      $orderBy: Market_orderBy
      $orderDirection: OrderDirection
      $where: Market_filter
    ) {
      markets(
        first: $first
        skip: $skip
        orderBy: $orderBy
        orderDirection: $orderDirection
        where: $where
      ) {
        id
        name
        isActive
        canBorrowFrom
        canUseAsCollateral
        maximumLTV
        liquidationThreshold
        liquidationPenalty
        inputToken {
          id
          symbol
          name
          decimals
        }
        outputToken {
          id
          symbol
          name
          decimals
        }
        rates {
          id
          rate
          side
          type
        }
        totalValueLockedUSD
        totalDepositBalanceUSD
        totalBorrowBalanceUSD
        inputTokenBalance
        inputTokenPriceUSD
        cumulativeSupplySideRevenueUSD
        cumulativeProtocolSideRevenueUSD
        cumulativeTotalRevenueUSD
      }
    }
  `;

  const response = await client.request<{ markets: unknown[] }>(query, {
    first,
    skip,
    orderBy,
    orderDirection,
    where,
  });

  return response.markets;
}

/**
 * Query user positions from subgraph
 */
export async function queryUserPositions(
  client: GraphQLClient,
  userAddress: string,
  options: {
    first?: number;
    skip?: number;
  } = {},
): Promise<unknown[]> {
  const { first = 100, skip = 0 } = options;

  const query = gql`
    query GetUserPositions($user: String!, $first: Int!, $skip: Int!) {
      positions(
        first: $first
        skip: $skip
        where: { account: $user }
        orderBy: balance
        orderDirection: desc
      ) {
        id
        account {
          id
        }
        market {
          id
          name
          inputToken {
            id
            symbol
            decimals
          }
        }
        side
        balance
        depositCount
        withdrawCount
        borrowCount
        repayCount
        liquidationCount
        isCollateral
      }
    }
  `;

  const response = await client.request<{ positions: unknown[] }>(query, {
    user: userAddress.toLowerCase(),
    first,
    skip,
  });

  return response.positions;
}

/**
 * Query transactions from subgraph
 */
export async function queryTransactions(
  client: GraphQLClient,
  options: {
    userAddress?: string;
    marketAddress?: string;
    transactionType?: 'DEPOSIT' | 'WITHDRAW' | 'BORROW' | 'REPAY' | 'LIQUIDATE';
    first?: number;
    skip?: number;
    startTimestamp?: number;
    endTimestamp?: number;
  } = {},
): Promise<unknown[]> {
  const {
    userAddress,
    marketAddress,
    transactionType,
    first = 100,
    skip = 0,
    startTimestamp,
    endTimestamp,
  } = options;

  // Build where clause
  const whereConditions: string[] = [];
  if (userAddress) {
    whereConditions.push(`account: "${userAddress.toLowerCase()}"`);
  }
  if (marketAddress) {
    whereConditions.push(`market: "${marketAddress.toLowerCase()}"`);
  }
  if (startTimestamp) {
    whereConditions.push(`timestamp_gte: ${startTimestamp}`);
  }
  if (endTimestamp) {
    whereConditions.push(`timestamp_lte: ${endTimestamp}`);
  }

  const whereClause = whereConditions.length > 0 ? `{ ${whereConditions.join(', ')} }` : '{}';

  // Determine query type
  const queryType = transactionType?.toLowerCase() || 'all';

  const queries: Record<string, string> = {
    deposit: 'deposits',
    withdraw: 'withdraws',
    borrow: 'borrows',
    repay: 'repays',
    liquidate: 'liquidates',
  };

  const entityType = queries[queryType] || 'deposits';

  const query = gql`
    query GetTransactions($first: Int!, $skip: Int!) {
      ${entityType}(
        first: $first
        skip: $skip
        where: ${whereClause}
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        hash
        logIndex
        protocol {
          id
          name
        }
        account {
          id
        }
        market {
          id
          name
          inputToken {
            symbol
            decimals
          }
        }
        position {
          id
        }
        asset {
          id
          symbol
          decimals
        }
        amount
        amountUSD
        blockNumber
        timestamp
      }
    }
  `;

  const response = await client.request<{ [key: string]: unknown[] }>(query, {
    first,
    skip,
  });

  return response[entityType];
}

/**
 * Query liquidations from subgraph
 */
export async function queryLiquidations(
  client: GraphQLClient,
  options: {
    liquidator?: string;
    liquidatee?: string;
    first?: number;
    skip?: number;
    startTimestamp?: number;
    endTimestamp?: number;
  } = {},
): Promise<unknown[]> {
  const { liquidator, liquidatee, first = 100, skip = 0, startTimestamp, endTimestamp } = options;

  const whereConditions: string[] = [];
  if (liquidator) {
    whereConditions.push(`liquidator: "${liquidator.toLowerCase()}"`);
  }
  if (liquidatee) {
    whereConditions.push(`liquidatee: "${liquidatee.toLowerCase()}"`);
  }
  if (startTimestamp) {
    whereConditions.push(`timestamp_gte: ${startTimestamp}`);
  }
  if (endTimestamp) {
    whereConditions.push(`timestamp_lte: ${endTimestamp}`);
  }

  const whereClause = whereConditions.length > 0 ? `where: { ${whereConditions.join(', ')} }` : '';

  const query = gql`
    query GetLiquidations($first: Int!, $skip: Int!) {
      liquidates(
        first: $first
        skip: $skip
        ${whereClause}
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        hash
        logIndex
        protocol {
          id
          name
        }
        liquidator {
          id
        }
        liquidatee {
          id
        }
        market {
          id
          name
          inputToken {
            symbol
            decimals
          }
        }
        position {
          id
        }
        asset {
          id
          symbol
          decimals
        }
        amount
        amountUSD
        profitUSD
        blockNumber
        timestamp
      }
    }
  `;

  const response = await client.request<{ liquidates: unknown[] }>(query, {
    first,
    skip,
  });

  return response.liquidates;
}

/**
 * Query protocol statistics from subgraph
 */
export async function queryProtocolStats(client: GraphQLClient): Promise<unknown> {
  const query = gql`
    query GetProtocolStats {
      lendingProtocols(first: 1) {
        id
        name
        slug
        schemaVersion
        subgraphVersion
        methodologyVersion
        network
        type
        totalValueLockedUSD
        protocolControlledValueUSD
        cumulativeSupplySideRevenueUSD
        cumulativeProtocolSideRevenueUSD
        cumulativeTotalRevenueUSD
        cumulativeUniqueUsers
        totalDepositBalanceUSD
        cumulativeDepositUSD
        totalBorrowBalanceUSD
        cumulativeBorrowUSD
        cumulativeLiquidateUSD
        mintedTokens {
          id
          symbol
        }
        totalPoolCount
        openPositionCount
        cumulativePositionCount
      }
    }
  `;

  const response = await client.request<{ lendingProtocols: unknown[] }>(query);
  return response.lendingProtocols[0];
}

/**
 * Query historical rates from subgraph
 */
export async function queryHistoricalRates(
  client: GraphQLClient,
  marketAddress: string,
  options: {
    first?: number;
    startTimestamp?: number;
    endTimestamp?: number;
  } = {},
): Promise<unknown[]> {
  const { first = 100, startTimestamp, endTimestamp } = options;

  const whereConditions = [`market: "${marketAddress.toLowerCase()}"`];
  if (startTimestamp) {
    whereConditions.push(`timestamp_gte: ${startTimestamp}`);
  }
  if (endTimestamp) {
    whereConditions.push(`timestamp_lte: ${endTimestamp}`);
  }

  const query = gql`
    query GetHistoricalRates($first: Int!) {
      marketDailySnapshots(
        first: $first
        where: { ${whereConditions.join(', ')} }
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        protocol {
          id
          name
        }
        market {
          id
          name
        }
        blockNumber
        timestamp
        rates {
          id
          rate
          side
          type
        }
        totalValueLockedUSD
        totalDepositBalanceUSD
        dailyDepositUSD
        cumulativeDepositUSD
        totalBorrowBalanceUSD
        dailyBorrowUSD
        cumulativeBorrowUSD
        dailyLiquidateUSD
        cumulativeLiquidateUSD
        inputTokenBalance
        inputTokenPriceUSD
        dailySupplySideRevenueUSD
        dailyProtocolSideRevenueUSD
        dailyTotalRevenueUSD
      }
    }
  `;

  const response = await client.request<{ marketDailySnapshots: unknown[] }>(query, {
    first,
  });

  return response.marketDailySnapshots;
}

/**
 * Execute custom GraphQL query
 */
export async function executeCustomQuery(
  client: GraphQLClient,
  query: string,
  variables?: Record<string, unknown>,
): Promise<unknown> {
  return await client.request(gql`${query}`, variables);
}

/**
 * Get subgraph indexing status
 */
export async function getSubgraphStatus(
  client: GraphQLClient,
): Promise<{
  synced: boolean;
  latestBlock: number;
  chainHeadBlock?: number;
}> {
  const query = gql`
    query GetSubgraphStatus {
      _meta {
        hasIndexingErrors
        block {
          number
          hash
        }
      }
    }
  `;

  try {
    const response = await client.request<{
      _meta: {
        hasIndexingErrors: boolean;
        block: { number: number; hash: string };
      };
    }>(query);

    return {
      synced: !response._meta.hasIndexingErrors,
      latestBlock: response._meta.block.number,
    };
  } catch (error) {
    return {
      synced: false,
      latestBlock: 0,
    };
  }
}
