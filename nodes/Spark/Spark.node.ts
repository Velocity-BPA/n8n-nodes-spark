/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import * as account from './actions/account';
import * as supply from './actions/supply';
import * as borrow from './actions/borrow';
import * as collateral from './actions/collateral';
import * as market from './actions/market';
import * as eMode from './actions/eMode';
import * as spToken from './actions/spToken';
import * as debtToken from './actions/debtToken';
import * as flashLoan from './actions/flashLoan';
import * as liquidation from './actions/liquidation';
import * as oracle from './actions/oracle';
import * as interestRate from './actions/interestRate';
import * as sdai from './actions/sdai';
import * as dai from './actions/dai';
import * as rewards from './actions/rewards';
import * as governance from './actions/governance';
import * as pool from './actions/pool';
import * as creditDelegation from './actions/creditDelegation';
import * as migration from './actions/migration';
import * as analytics from './actions/analytics';
import * as subgraph from './actions/subgraph';
import * as utility from './actions/utility';

// Log licensing notice once per node load
let licensingNoticeLogged = false;
function logLicensingNotice() {
	if (!licensingNoticeLogged) {
		console.warn(`
[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
`);
		licensingNoticeLogged = true;
	}
}

export class Spark implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Spark Protocol',
		name: 'spark',
		icon: 'file:spark.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Spark Protocol (SparkLend) - MakerDAO\'s DeFi lending platform',
		defaults: {
			name: 'Spark',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'sparkNetwork',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'account',
							'supply',
							'borrow',
							'collateral',
							'eMode',
							'spToken',
							'debtToken',
							'flashLoan',
							'liquidation',
							'sdai',
							'dai',
							'rewards',
							'creditDelegation',
							'migration',
						],
					},
				},
			},
			{
				name: 'sparkApi',
				required: false,
				displayOptions: {
					show: {
						resource: [
							'market',
							'oracle',
							'interestRate',
							'governance',
							'pool',
							'analytics',
							'subgraph',
							'utility',
						],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
						description: 'Manage account positions and balances',
					},
					{
						name: 'Analytics',
						value: 'analytics',
						description: 'Protocol analytics and statistics',
					},
					{
						name: 'Borrow',
						value: 'borrow',
						description: 'Borrow assets from the protocol',
					},
					{
						name: 'Collateral',
						value: 'collateral',
						description: 'Manage collateral settings',
					},
					{
						name: 'Credit Delegation',
						value: 'creditDelegation',
						description: 'Delegate borrowing power to others',
					},
					{
						name: 'DAI',
						value: 'dai',
						description: 'DAI-specific operations and DSR',
					},
					{
						name: 'Debt Token',
						value: 'debtToken',
						description: 'Manage debt token positions',
					},
					{
						name: 'E-Mode',
						value: 'eMode',
						description: 'High efficiency mode for correlated assets',
					},
					{
						name: 'Flash Loan',
						value: 'flashLoan',
						description: 'Execute flash loans',
					},
					{
						name: 'Governance',
						value: 'governance',
						description: 'Protocol governance operations',
					},
					{
						name: 'Interest Rate',
						value: 'interestRate',
						description: 'Interest rate information',
					},
					{
						name: 'Liquidation',
						value: 'liquidation',
						description: 'Liquidation operations',
					},
					{
						name: 'Market',
						value: 'market',
						description: 'Market data and reserve information',
					},
					{
						name: 'Migration',
						value: 'migration',
						description: 'Migrate positions from Aave',
					},
					{
						name: 'Oracle',
						value: 'oracle',
						description: 'Price oracle queries',
					},
					{
						name: 'Pool',
						value: 'pool',
						description: 'Lending pool information',
					},
					{
						name: 'Rewards',
						value: 'rewards',
						description: 'Protocol rewards and incentives',
					},
					{
						name: 'sDAI',
						value: 'sdai',
						description: 'Savings DAI operations',
					},
					{
						name: 'spToken',
						value: 'spToken',
						description: 'Interest-bearing supply tokens',
					},
					{
						name: 'Subgraph',
						value: 'subgraph',
						description: 'Query the Spark subgraph',
					},
					{
						name: 'Supply',
						value: 'supply',
						description: 'Supply assets to earn interest',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Utility functions and calculations',
					},
				],
				default: 'account',
			},

			// Account Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['account'],
					},
				},
				options: [
					{ name: 'Get Account Overview', value: 'getOverview', description: 'Get complete account overview' },
					{ name: 'Get Balances', value: 'getBalances', description: 'Get all token balances' },
					{ name: 'Get Supplied Assets', value: 'getSupplied', description: 'Get all supplied assets' },
					{ name: 'Get Borrowed Assets', value: 'getBorrowed', description: 'Get all borrowed assets' },
					{ name: 'Get Health Factor', value: 'getHealthFactor', description: 'Get account health factor' },
					{ name: 'Get Net APY', value: 'getNetApy', description: 'Calculate net APY across positions' },
					{ name: 'Get Account Value', value: 'getValue', description: 'Get total account value in USD' },
					{ name: 'Get History', value: 'getHistory', description: 'Get account transaction history' },
					{ name: 'Get Liquidation Risk', value: 'getLiquidationRisk', description: 'Assess liquidation risk' },
					{ name: 'Get Available Actions', value: 'getAvailableActions', description: 'Get actions user can perform' },
				],
				default: 'getOverview',
			},

			// Supply Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['supply'],
					},
				},
				options: [
					{ name: 'Supply Asset', value: 'supply', description: 'Supply an ERC20 asset' },
					{ name: 'Supply ETH', value: 'supplyETH', description: 'Supply native ETH' },
					{ name: 'Supply with Permit', value: 'supplyWithPermit', description: 'Supply using EIP-2612 permit' },
					{ name: 'Get Supply Balance', value: 'getBalance', description: 'Get supply balance for an asset' },
					{ name: 'Get Supply APY', value: 'getApy', description: 'Get current supply APY' },
					{ name: 'Get Total Supplied', value: 'getTotalSupplied', description: 'Get total market supply' },
					{ name: 'Withdraw Asset', value: 'withdraw', description: 'Withdraw supplied asset' },
					{ name: 'Withdraw ETH', value: 'withdrawETH', description: 'Withdraw as native ETH' },
					{ name: 'Withdraw Max', value: 'withdrawMax', description: 'Withdraw maximum amount' },
					{ name: 'Get Available to Withdraw', value: 'getAvailable', description: 'Get withdrawable amount' },
					{ name: 'Get Supply Cap', value: 'getCap', description: 'Get market supply cap' },
					{ name: 'Is Supply Paused', value: 'isPaused', description: 'Check if supply is paused' },
					{ name: 'Get Supply History', value: 'getHistory', description: 'Get supply transaction history' },
				],
				default: 'supply',
			},

			// Borrow Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['borrow'],
					},
				},
				options: [
					{ name: 'Borrow Asset', value: 'borrow', description: 'Borrow an ERC20 asset' },
					{ name: 'Borrow ETH', value: 'borrowETH', description: 'Borrow native ETH' },
					{ name: 'Get Borrow Balance', value: 'getBalance', description: 'Get borrow balance for an asset' },
					{ name: 'Get Variable Borrow APY', value: 'getVariableApy', description: 'Get variable rate APY' },
					{ name: 'Get Stable Borrow APY', value: 'getStableApy', description: 'Get stable rate APY' },
					{ name: 'Get Total Borrowed', value: 'getTotalBorrowed', description: 'Get total market borrows' },
					{ name: 'Repay Borrow', value: 'repay', description: 'Repay borrowed asset' },
					{ name: 'Repay ETH', value: 'repayETH', description: 'Repay with native ETH' },
					{ name: 'Repay Max', value: 'repayMax', description: 'Repay maximum debt' },
					{ name: 'Repay with spTokens', value: 'repayWithSpTokens', description: 'Repay using supplied collateral' },
					{ name: 'Get Available to Borrow', value: 'getAvailable', description: 'Get borrowable amount' },
					{ name: 'Get Borrow Cap', value: 'getCap', description: 'Get market borrow cap' },
					{ name: 'Is Borrow Paused', value: 'isPaused', description: 'Check if borrowing is paused' },
					{ name: 'Switch Rate Mode', value: 'switchRateMode', description: 'Switch between stable/variable rate' },
					{ name: 'Get Borrow History', value: 'getHistory', description: 'Get borrow transaction history' },
				],
				default: 'borrow',
			},

			// Collateral Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['collateral'],
					},
				},
				options: [
					{ name: 'Enable as Collateral', value: 'enable', description: 'Enable asset as collateral' },
					{ name: 'Disable as Collateral', value: 'disable', description: 'Disable asset as collateral' },
					{ name: 'Get Collateral Status', value: 'getStatus', description: 'Check if asset is used as collateral' },
					{ name: 'Get Collateral Factor (LTV)', value: 'getLtv', description: 'Get loan-to-value ratio' },
					{ name: 'Get Liquidation Threshold', value: 'getThreshold', description: 'Get liquidation threshold' },
					{ name: 'Get Collateral Value', value: 'getValue', description: 'Get collateral value in USD' },
					{ name: 'Get All Collaterals', value: 'getAll', description: 'Get all collateral positions' },
					{ name: 'Get Isolation Mode Status', value: 'getIsolation', description: 'Check isolation mode status' },
				],
				default: 'enable',
			},

			// Market Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['market'],
					},
				},
				options: [
					{ name: 'Get Markets', value: 'getMarkets', description: 'Get all available markets' },
					{ name: 'Get Market Info', value: 'getInfo', description: 'Get detailed market information' },
					{ name: 'Get Market by Asset', value: 'getByAsset', description: 'Get market data for specific asset' },
					{ name: 'Get Market APYs', value: 'getApys', description: 'Get supply and borrow APYs' },
					{ name: 'Get Market Utilization', value: 'getUtilization', description: 'Get utilization rate' },
					{ name: 'Get Market Liquidity', value: 'getLiquidity', description: 'Get available liquidity' },
					{ name: 'Get Market Caps', value: 'getCaps', description: 'Get supply and borrow caps' },
					{ name: 'Get Market Parameters', value: 'getParams', description: 'Get market configuration' },
					{ name: 'Get Reserve Data', value: 'getReserve', description: 'Get reserve configuration data' },
					{ name: 'Get Historical Rates', value: 'getHistoricalRates', description: 'Get historical rate data' },
					{ name: 'Is Market Active', value: 'isActive', description: 'Check if market is active' },
					{ name: 'Is Market Frozen', value: 'isFrozen', description: 'Check if market is frozen' },
				],
				default: 'getMarkets',
			},

			// E-Mode Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['eMode'],
					},
				},
				options: [
					{ name: 'Get E-Modes', value: 'getModes', description: 'Get all available E-Mode categories' },
					{ name: 'Get E-Mode Info', value: 'getInfo', description: 'Get E-Mode category details' },
					{ name: 'Set User E-Mode', value: 'setMode', description: 'Set user E-Mode category' },
					{ name: 'Get User E-Mode', value: 'getUserMode', description: 'Get user current E-Mode' },
					{ name: 'Get E-Mode Assets', value: 'getAssets', description: 'Get assets in E-Mode category' },
					{ name: 'Get E-Mode LTV', value: 'getLtv', description: 'Get E-Mode LTV ratio' },
					{ name: 'Get E-Mode Liquidation Threshold', value: 'getThreshold', description: 'Get E-Mode liquidation threshold' },
					{ name: 'Get E-Mode Bonus', value: 'getBonus', description: 'Get E-Mode liquidation bonus' },
					{ name: 'Get E-Mode Label', value: 'getLabel', description: 'Get E-Mode category label' },
					{ name: 'Exit E-Mode', value: 'exit', description: 'Exit E-Mode (set to category 0)' },
				],
				default: 'getModes',
			},

			// spToken Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['spToken'],
					},
				},
				options: [
					{ name: 'Get spToken Info', value: 'getInfo', description: 'Get spToken details' },
					{ name: 'Get spToken Balance', value: 'getBalance', description: 'Get spToken balance' },
					{ name: 'Get spToken Total Supply', value: 'getTotalSupply', description: 'Get total spToken supply' },
					{ name: 'Transfer spToken', value: 'transfer', description: 'Transfer spTokens' },
					{ name: 'Approve spToken', value: 'approve', description: 'Approve spToken spending' },
					{ name: 'Get Underlying Asset', value: 'getUnderlying', description: 'Get underlying asset address' },
					{ name: 'Get Exchange Rate', value: 'getRate', description: 'Get spToken/underlying rate' },
					{ name: 'Get Scaled Balance', value: 'getScaled', description: 'Get scaled balance' },
					{ name: 'Get Interest Earned', value: 'getInterest', description: 'Calculate interest earned' },
				],
				default: 'getBalance',
			},

			// Debt Token Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['debtToken'],
					},
				},
				options: [
					{ name: 'Get Variable Debt Info', value: 'getVariableInfo', description: 'Get variable debt token info' },
					{ name: 'Get Stable Debt Info', value: 'getStableInfo', description: 'Get stable debt token info' },
					{ name: 'Get Debt Balance', value: 'getBalance', description: 'Get debt token balance' },
					{ name: 'Get Total Debt', value: 'getTotalDebt', description: 'Get total debt supply' },
					{ name: 'Get Borrow Allowance', value: 'getAllowance', description: 'Get delegated borrow allowance' },
					{ name: 'Delegate Borrow', value: 'delegate', description: 'Delegate borrowing power' },
					{ name: 'Get Delegated Amount', value: 'getDelegated', description: 'Get delegated amount' },
					{ name: 'Revoke Delegation', value: 'revoke', description: 'Revoke borrow delegation' },
				],
				default: 'getBalance',
			},

			// Flash Loan Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['flashLoan'],
					},
				},
				options: [
					{ name: 'Execute Flash Loan', value: 'execute', description: 'Execute a flash loan' },
					{ name: 'Execute Flash Loan Simple', value: 'executeSimple', description: 'Execute simple flash loan (single asset)' },
					{ name: 'Get Flash Loan Premium', value: 'getPremium', description: 'Get flash loan fee percentage' },
					{ name: 'Get Max Flash Loan Amount', value: 'getMax', description: 'Get maximum flashloanable amount' },
					{ name: 'Get Flash Loan Fees', value: 'getFees', description: 'Calculate flash loan fees' },
					{ name: 'Estimate Flash Loan Cost', value: 'estimate', description: 'Estimate total flash loan cost' },
				],
				default: 'executeSimple',
			},

			// Liquidation Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['liquidation'],
					},
				},
				options: [
					{ name: 'Get Liquidatable Users', value: 'getUsers', description: 'Get users eligible for liquidation' },
					{ name: 'Get Liquidation Info', value: 'getInfo', description: 'Get liquidation details for user' },
					{ name: 'Liquidate Position', value: 'liquidate', description: 'Execute liquidation' },
					{ name: 'Get Liquidation Bonus', value: 'getBonus', description: 'Get liquidation bonus percentage' },
					{ name: 'Get Close Factor', value: 'getCloseFactor', description: 'Get close factor' },
					{ name: 'Calculate Liquidation Amount', value: 'calculate', description: 'Calculate liquidation amounts' },
					{ name: 'Get Liquidation History', value: 'getHistory', description: 'Get liquidation history' },
					{ name: 'Simulate Liquidation', value: 'simulate', description: 'Simulate liquidation outcome' },
					{ name: 'Get Health Factor Threshold', value: 'getThreshold', description: 'Get health factor threshold' },
				],
				default: 'getInfo',
			},

			// Oracle Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['oracle'],
					},
				},
				options: [
					{ name: 'Get Asset Price', value: 'getPrice', description: 'Get asset price in USD' },
					{ name: 'Get Asset Prices (Batch)', value: 'getPrices', description: 'Get multiple asset prices' },
					{ name: 'Get Price Source', value: 'getSource', description: 'Get price oracle source' },
					{ name: 'Get Fallback Oracle', value: 'getFallback', description: 'Get fallback oracle address' },
					{ name: 'Get Historical Prices', value: 'getHistorical', description: 'Get historical price data' },
					{ name: 'Validate Price', value: 'validate', description: 'Validate price against threshold' },
				],
				default: 'getPrice',
			},

			// Interest Rate Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['interestRate'],
					},
				},
				options: [
					{ name: 'Get Supply Rate', value: 'getSupplyRate', description: 'Get current supply interest rate' },
					{ name: 'Get Variable Borrow Rate', value: 'getVariableRate', description: 'Get variable borrow rate' },
					{ name: 'Get Stable Borrow Rate', value: 'getStableRate', description: 'Get stable borrow rate' },
					{ name: 'Get Utilization Rate', value: 'getUtilization', description: 'Get utilization rate' },
					{ name: 'Get Optimal Utilization', value: 'getOptimal', description: 'Get optimal utilization point' },
					{ name: 'Get Rate Strategy', value: 'getStrategy', description: 'Get rate strategy parameters' },
					{ name: 'Get Base Rate', value: 'getBaseRate', description: 'Get base interest rate' },
					{ name: 'Get Slope 1', value: 'getSlope1', description: 'Get slope 1 parameter' },
					{ name: 'Get Slope 2', value: 'getSlope2', description: 'Get slope 2 parameter' },
					{ name: 'Calculate Rate at Utilization', value: 'calculateRate', description: 'Calculate rate at given utilization' },
					{ name: 'Get Rate History', value: 'getHistory', description: 'Get historical rates' },
				],
				default: 'getSupplyRate',
			},

			// sDAI Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['sdai'],
					},
				},
				options: [
					{ name: 'Get sDAI Balance', value: 'getBalance', description: 'Get sDAI balance' },
					{ name: 'Get sDAI/DAI Rate', value: 'getRate', description: 'Get sDAI to DAI exchange rate' },
					{ name: 'Get sDAI APY', value: 'getApy', description: 'Get sDAI yield APY' },
					{ name: 'Deposit DAI to sDAI', value: 'deposit', description: 'Convert DAI to sDAI' },
					{ name: 'Withdraw DAI from sDAI', value: 'withdraw', description: 'Convert sDAI to DAI' },
					{ name: 'Get sDAI Total Supply', value: 'getTotalSupply', description: 'Get total sDAI supply' },
					{ name: 'Get sDAI as Collateral', value: 'getCollateralStatus', description: 'Check sDAI collateral status' },
					{ name: 'Supply sDAI as Collateral', value: 'supplyCollateral', description: 'Supply sDAI to Spark' },
					{ name: 'Borrow Against sDAI', value: 'borrowAgainst', description: 'Borrow using sDAI as collateral' },
				],
				default: 'getBalance',
			},

			// DAI Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['dai'],
					},
				},
				options: [
					{ name: 'Get DAI Balance', value: 'getBalance', description: 'Get DAI balance' },
					{ name: 'Get DAI Savings Rate', value: 'getDsr', description: 'Get current DSR' },
					{ name: 'Deposit to DSR', value: 'depositDsr', description: 'Deposit DAI to earn DSR' },
					{ name: 'Withdraw from DSR', value: 'withdrawDsr', description: 'Withdraw DAI from DSR' },
					{ name: 'Get DSR APY', value: 'getDsrApy', description: 'Get DSR annual yield' },
					{ name: 'Get DAI Market Info', value: 'getMarketInfo', description: 'Get DAI market data' },
					{ name: 'Get DAI Borrow Rate', value: 'getBorrowRate', description: 'Get DAI borrow interest rate' },
					{ name: 'Borrow DAI', value: 'borrow', description: 'Borrow DAI from Spark' },
					{ name: 'Repay DAI', value: 'repay', description: 'Repay DAI loan' },
				],
				default: 'getBalance',
			},

			// Rewards Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['rewards'],
					},
				},
				options: [
					{ name: 'Get Rewards Info', value: 'getInfo', description: 'Get rewards program information' },
					{ name: 'Get Claimable Rewards', value: 'getClaimable', description: 'Get claimable reward amount' },
					{ name: 'Claim Rewards', value: 'claim', description: 'Claim specific rewards' },
					{ name: 'Claim All Rewards', value: 'claimAll', description: 'Claim all available rewards' },
					{ name: 'Get Reward Assets', value: 'getAssets', description: 'Get reward token addresses' },
					{ name: 'Get Reward Rate', value: 'getRate', description: 'Get reward emission rate' },
					{ name: 'Get Reward Distribution', value: 'getDistribution', description: 'Get distribution schedule' },
					{ name: 'Get User Rewards', value: 'getUserRewards', description: 'Get user reward history' },
					{ name: 'Get Unclaimed Rewards', value: 'getUnclaimed', description: 'Get all unclaimed rewards' },
				],
				default: 'getClaimable',
			},

			// Governance Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['governance'],
					},
				},
				options: [
					{ name: 'Get Proposals', value: 'getProposals', description: 'Get governance proposals' },
					{ name: 'Get Voting Power', value: 'getVotingPower', description: 'Get voting power for address' },
					{ name: 'Vote on Proposal', value: 'vote', description: 'Cast vote on proposal' },
					{ name: 'Get Governance Stats', value: 'getStats', description: 'Get governance statistics' },
					{ name: 'Get Delegates', value: 'getDelegates', description: 'Get delegated addresses' },
					{ name: 'Delegate Votes', value: 'delegate', description: 'Delegate voting power' },
				],
				default: 'getProposals',
			},

			// Pool Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['pool'],
					},
				},
				options: [
					{ name: 'Get Pool Info', value: 'getInfo', description: 'Get pool information' },
					{ name: 'Get Pool Address', value: 'getAddress', description: 'Get pool contract address' },
					{ name: 'Get Pool Configurator', value: 'getConfigurator', description: 'Get configurator address' },
					{ name: 'Get Pool Data Provider', value: 'getDataProvider', description: 'Get data provider address' },
					{ name: 'Get Pool Admin', value: 'getAdmin', description: 'Get pool admin address' },
					{ name: 'Get Addresses Provider', value: 'getAddressesProvider', description: 'Get addresses provider' },
					{ name: 'Get Protocol Data', value: 'getProtocolData', description: 'Get protocol-wide data' },
					{ name: 'Get Total Value Locked', value: 'getTvl', description: 'Get total value locked' },
				],
				default: 'getInfo',
			},

			// Credit Delegation Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['creditDelegation'],
					},
				},
				options: [
					{ name: 'Approve Delegation', value: 'approve', description: 'Approve credit delegation' },
					{ name: 'Get Borrow Allowance', value: 'getAllowance', description: 'Get delegated borrow allowance' },
					{ name: 'Borrow on Behalf', value: 'borrowOnBehalf', description: 'Borrow using delegated credit' },
					{ name: 'Get Delegated Borrow Power', value: 'getPower', description: 'Get delegated borrowing power' },
					{ name: 'Revoke Delegation', value: 'revoke', description: 'Revoke credit delegation' },
					{ name: 'Get Delegation Events', value: 'getEvents', description: 'Get delegation event history' },
				],
				default: 'approve',
			},

			// Migration Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['migration'],
					},
				},
				options: [
					{ name: 'Check Migration from Aave', value: 'check', description: 'Check if migration is possible' },
					{ name: 'Migrate from Aave V2', value: 'migrateV2', description: 'Migrate position from Aave V2' },
					{ name: 'Migrate from Aave V3', value: 'migrateV3', description: 'Migrate position from Aave V3' },
					{ name: 'Get Migration Quote', value: 'getQuote', description: 'Get migration cost estimate' },
					{ name: 'Estimate Gas Savings', value: 'estimateSavings', description: 'Estimate gas savings' },
					{ name: 'Get Migration Status', value: 'getStatus', description: 'Get migration transaction status' },
				],
				default: 'check',
			},

			// Analytics Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['analytics'],
					},
				},
				options: [
					{ name: 'Get Protocol TVL', value: 'getTvl', description: 'Get total value locked' },
					{ name: 'Get Protocol Stats', value: 'getStats', description: 'Get protocol statistics' },
					{ name: 'Get Market Rankings', value: 'getRankings', description: 'Get markets ranked by size' },
					{ name: 'Get User Stats', value: 'getUserStats', description: 'Get user statistics' },
					{ name: 'Get Historical Data', value: 'getHistorical', description: 'Get historical metrics' },
					{ name: 'Get Liquidation Stats', value: 'getLiquidationStats', description: 'Get liquidation statistics' },
					{ name: 'Get Revenue Stats', value: 'getRevenue', description: 'Get protocol revenue data' },
					{ name: 'Export Data', value: 'export', description: 'Export analytics data' },
				],
				default: 'getStats',
			},

			// Subgraph Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['subgraph'],
					},
				},
				options: [
					{ name: 'Query Markets', value: 'queryMarkets', description: 'Query market data from subgraph' },
					{ name: 'Query Users', value: 'queryUsers', description: 'Query user positions' },
					{ name: 'Query Transactions', value: 'queryTransactions', description: 'Query transaction history' },
					{ name: 'Query Liquidations', value: 'queryLiquidations', description: 'Query liquidation events' },
					{ name: 'Query Rewards', value: 'queryRewards', description: 'Query reward distributions' },
					{ name: 'Custom GraphQL Query', value: 'customQuery', description: 'Execute custom GraphQL query' },
					{ name: 'Get Subgraph Status', value: 'getStatus', description: 'Get subgraph sync status' },
				],
				default: 'queryMarkets',
			},

			// Utility Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['utility'],
					},
				},
				options: [
					{ name: 'Calculate Health Factor', value: 'calcHealthFactor', description: 'Calculate health factor' },
					{ name: 'Calculate Max Borrow', value: 'calcMaxBorrow', description: 'Calculate maximum borrow amount' },
					{ name: 'Calculate Liquidation Price', value: 'calcLiquidationPrice', description: 'Calculate liquidation price' },
					{ name: 'Convert spToken to Underlying', value: 'spToUnderlying', description: 'Convert spToken amount' },
					{ name: 'Convert Underlying to spToken', value: 'underlyingToSp', description: 'Convert underlying amount' },
					{ name: 'Validate Address', value: 'validateAddress', description: 'Validate Ethereum address' },
					{ name: 'Get Contract Addresses', value: 'getContracts', description: 'Get Spark contract addresses' },
					{ name: 'Estimate Gas', value: 'estimateGas', description: 'Estimate transaction gas' },
					{ name: 'Get Network Status', value: 'getNetworkStatus', description: 'Get network status' },
				],
				default: 'calcHealthFactor',
			},

			// Common Parameters
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Ethereum address',
				displayOptions: {
					show: {
						resource: ['account', 'spToken', 'debtToken', 'rewards', 'creditDelegation'],
						operation: ['getOverview', 'getBalances', 'getSupplied', 'getBorrowed', 'getHealthFactor', 'getNetApy', 'getValue', 'getHistory', 'getLiquidationRisk', 'getAvailableActions', 'getBalance', 'getScaled', 'getInterest', 'getClaimable', 'getUserRewards', 'getUnclaimed', 'getAllowance', 'getPower'],
					},
				},
			},
			{
				displayName: 'Asset',
				name: 'asset',
				type: 'options',
				default: 'DAI',
				options: [
					{ name: 'DAI', value: 'DAI' },
					{ name: 'WETH', value: 'WETH' },
					{ name: 'sDAI', value: 'sDAI' },
					{ name: 'wstETH', value: 'wstETH' },
					{ name: 'rETH', value: 'rETH' },
					{ name: 'USDC', value: 'USDC' },
					{ name: 'USDT', value: 'USDT' },
					{ name: 'WBTC', value: 'WBTC' },
					{ name: 'GNO', value: 'GNO' },
					{ name: 'Custom', value: 'custom' },
				],
				description: 'Asset to interact with',
				displayOptions: {
					show: {
						resource: ['supply', 'borrow', 'collateral', 'market', 'oracle', 'interestRate'],
					},
				},
			},
			{
				displayName: 'Custom Asset Address',
				name: 'customAsset',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Custom asset contract address',
				displayOptions: {
					show: {
						asset: ['custom'],
					},
				},
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'string',
				default: '',
				placeholder: '1.0',
				description: 'Amount in token units (e.g., 1.5 ETH)',
				displayOptions: {
					show: {
						operation: ['supply', 'supplyETH', 'supplyWithPermit', 'withdraw', 'withdrawETH', 'borrow', 'borrowETH', 'repay', 'repayETH', 'repayWithSpTokens', 'transfer', 'approve', 'delegate', 'deposit', 'depositDsr', 'withdrawDsr', 'execute', 'executeSimple', 'liquidate'],
					},
				},
			},
			{
				displayName: 'E-Mode Category',
				name: 'eModeCategory',
				type: 'options',
				default: 0,
				options: [
					{ name: 'No E-Mode (0)', value: 0 },
					{ name: 'Stablecoins (1)', value: 1 },
					{ name: 'ETH Correlated (2)', value: 2 },
				],
				description: 'E-Mode category ID',
				displayOptions: {
					show: {
						resource: ['eMode'],
						operation: ['setMode', 'getInfo', 'getAssets', 'getLtv', 'getThreshold', 'getBonus', 'getLabel'],
					},
				},
			},
			{
				displayName: 'Interest Rate Mode',
				name: 'rateMode',
				type: 'options',
				default: 2,
				options: [
					{ name: 'Stable', value: 1 },
					{ name: 'Variable', value: 2 },
				],
				description: 'Interest rate mode',
				displayOptions: {
					show: {
						operation: ['borrow', 'borrowETH', 'repay', 'repayETH', 'switchRateMode', 'delegate'],
					},
				},
			},
			{
				displayName: 'Recipient',
				name: 'recipient',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Recipient address',
				displayOptions: {
					show: {
						operation: ['transfer', 'borrowOnBehalf'],
					},
				},
			},
			{
				displayName: 'Delegatee',
				name: 'delegatee',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Address to delegate to',
				displayOptions: {
					show: {
						operation: ['approve', 'delegate', 'revoke'],
					},
				},
			},
			{
				displayName: 'User to Liquidate',
				name: 'userToLiquidate',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Address of user to liquidate',
				displayOptions: {
					show: {
						operation: ['liquidate', 'getInfo', 'calculate', 'simulate'],
						resource: ['liquidation'],
					},
				},
			},
			{
				displayName: 'Collateral Asset',
				name: 'collateralAsset',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Collateral asset to receive',
				displayOptions: {
					show: {
						operation: ['liquidate', 'calculate', 'simulate'],
					},
				},
			},
			{
				displayName: 'Debt Asset',
				name: 'debtAsset',
				type: 'string',
				default: '',
				placeholder: '0x...',
				description: 'Debt asset to repay',
				displayOptions: {
					show: {
						operation: ['liquidate', 'calculate', 'simulate'],
					},
				},
			},
			{
				displayName: 'GraphQL Query',
				name: 'graphqlQuery',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				default: '',
				placeholder: '{ markets { id name } }',
				description: 'Custom GraphQL query',
				displayOptions: {
					show: {
						operation: ['customQuery'],
					},
				},
			},
			{
				displayName: 'Additional Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'On Behalf Of',
						name: 'onBehalfOf',
						type: 'string',
						default: '',
						description: 'Execute on behalf of another address',
					},
					{
						displayName: 'Referral Code',
						name: 'referralCode',
						type: 'number',
						default: 0,
						description: 'Referral code for tracking',
					},
					{
						displayName: 'Use as Collateral',
						name: 'useAsCollateral',
						type: 'boolean',
						default: true,
						description: 'Whether to use supplied asset as collateral',
					},
					{
						displayName: 'Receive spToken',
						name: 'receiveSpToken',
						type: 'boolean',
						default: false,
						description: 'Whether to receive spToken instead of underlying',
					},
					{
						displayName: 'Gas Limit',
						name: 'gasLimit',
						type: 'number',
						default: 0,
						description: 'Custom gas limit (0 for auto)',
					},
					{
						displayName: 'Max Fee Per Gas (Gwei)',
						name: 'maxFeePerGas',
						type: 'number',
						default: 0,
						description: 'Max fee per gas in Gwei (0 for auto)',
					},
					{
						displayName: 'Slippage Tolerance (%)',
						name: 'slippage',
						type: 'number',
						default: 0.5,
						description: 'Maximum slippage tolerance',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 100,
						description: 'Maximum number of results to return',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
					{
						displayName: 'Start Date',
						name: 'startDate',
						type: 'dateTime',
						default: '',
						description: 'Start date for historical queries',
					},
					{
						displayName: 'End Date',
						name: 'endDate',
						type: 'dateTime',
						default: '',
						description: 'End date for historical queries',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		logLicensingNotice();

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: INodeExecutionData[] = [];

				switch (resource) {
					case 'account':
						result = await account.execute.call(this, i, operation);
						break;
					case 'supply':
						result = await supply.execute.call(this, i, operation);
						break;
					case 'borrow':
						result = await borrow.execute.call(this, i, operation);
						break;
					case 'collateral':
						result = await collateral.execute.call(this, i, operation);
						break;
					case 'market':
						result = await market.execute.call(this, i, operation);
						break;
					case 'eMode':
						result = await eMode.execute.call(this, i, operation);
						break;
					case 'spToken':
						result = await spToken.execute.call(this, i, operation);
						break;
					case 'debtToken':
						result = await debtToken.execute.call(this, i, operation);
						break;
					case 'flashLoan':
						result = await flashLoan.execute.call(this, i, operation);
						break;
					case 'liquidation':
						result = await liquidation.execute.call(this, i, operation);
						break;
					case 'oracle':
						result = await oracle.execute.call(this, i, operation);
						break;
					case 'interestRate':
						result = await interestRate.execute.call(this, i, operation);
						break;
					case 'sdai':
						result = await sdai.execute.call(this, i, operation);
						break;
					case 'dai':
						result = await dai.execute.call(this, i, operation);
						break;
					case 'rewards':
						result = await rewards.execute.call(this, i, operation);
						break;
					case 'governance':
						result = await governance.execute.call(this, i, operation);
						break;
					case 'pool':
						result = await pool.execute.call(this, i, operation);
						break;
					case 'creditDelegation':
						result = await creditDelegation.execute.call(this, i, operation);
						break;
					case 'migration':
						result = await migration.execute.call(this, i, operation);
						break;
					case 'analytics':
						result = await analytics.execute.call(this, i, operation);
						break;
					case 'subgraph':
						result = await subgraph.execute.call(this, i, operation);
						break;
					case 'utility':
						result = await utility.execute.call(this, i, operation);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
							resource,
							operation,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
