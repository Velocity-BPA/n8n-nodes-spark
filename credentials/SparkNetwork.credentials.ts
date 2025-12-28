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
 * Spark Network Credentials
 *
 * Provides configuration for connecting to Spark Protocol on different networks.
 * Supports Ethereum Mainnet, Gnosis Chain, and custom RPC endpoints.
 *
 * Security Note: Private keys are stored securely and never logged.
 */
export class SparkNetwork implements ICredentialType {
  name = 'sparkNetwork';
  displayName = 'Spark Network';
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
        {
          name: 'Custom',
          value: 'custom',
        },
      ],
      default: 'ethereum',
      description: 'The blockchain network to connect to',
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
      description: 'The RPC endpoint URL for the network. Leave empty to use default public endpoints.',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Chain ID',
      name: 'chainId',
      type: 'number',
      default: 1,
      description: 'The chain ID for the network',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Your wallet private key for signing transactions. Never share this with anyone.',
      hint: 'Required for write operations (supply, borrow, etc.). Read-only operations work without it.',
    },
    {
      displayName: 'Subgraph Endpoint',
      name: 'subgraphUrl',
      type: 'string',
      default: '',
      placeholder: 'https://api.thegraph.com/subgraphs/name/...',
      description: 'Optional custom subgraph endpoint for querying historical data',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.network === "ethereum" ? "https://eth.llamarpc.com" : $credentials.network === "gnosis" ? "https://rpc.gnosischain.com" : $credentials.rpcUrl}}',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 1,
      }),
    },
  };
}
