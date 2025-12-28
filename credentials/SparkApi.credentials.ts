/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * Spark API Credentials
 *
 * Provides configuration for connecting to Spark Protocol APIs and subgraph.
 * Used primarily for read-only queries and analytics.
 */
export class SparkApi implements ICredentialType {
  name = 'sparkApi';
  displayName = 'Spark API';
  documentationUrl = 'https://docs.spark.fi/';

  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        {
          name: 'Ethereum Mainnet',
          value: 'ethereum',
        },
        {
          name: 'Gnosis Chain',
          value: 'gnosis',
        },
      ],
      default: 'ethereum',
      description: 'The network to query data from',
    },
    {
      displayName: 'Subgraph URL',
      name: 'subgraphUrl',
      type: 'string',
      default: '',
      placeholder: 'https://api.thegraph.com/subgraphs/name/...',
      description: 'The Graph subgraph endpoint for Spark Protocol queries',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Optional API key for rate-limited endpoints',
    },
    {
      displayName: 'RPC Endpoint',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
      description: 'RPC endpoint for direct contract calls',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.subgraphUrl || "https://api.thegraph.com"}}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ _meta { block { number } } }',
      }),
    },
  };
}
