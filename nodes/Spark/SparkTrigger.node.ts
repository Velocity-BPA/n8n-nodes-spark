/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	IDataObject,
} from 'n8n-workflow';
import { ethers } from 'ethers';
import { SPARK_CONTRACTS } from './constants/networks';

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

// Spark Pool ABI for events
const POOL_EVENTS_ABI = [
	'event Supply(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referralCode)',
	'event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)',
	'event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint8 interestRateMode, uint256 borrowRate, uint16 indexed referralCode)',
	'event Repay(address indexed reserve, address indexed user, address indexed repayer, uint256 amount, bool useATokens)',
	'event ReserveUsedAsCollateralEnabled(address indexed reserve, address indexed user)',
	'event ReserveUsedAsCollateralDisabled(address indexed reserve, address indexed user)',
	'event LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)',
	'event FlashLoan(address indexed target, address initiator, address indexed asset, uint256 amount, uint8 interestRateMode, uint256 premium, uint16 indexed referralCode)',
	'event UserEModeSet(address indexed user, uint8 categoryId)',
	'event ReserveDataUpdated(address indexed reserve, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex)',
];

// sDAI ABI for events
const SDAI_EVENTS_ABI = [
	'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)',
	'event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)',
];

export class SparkTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Spark Trigger',
		name: 'sparkTrigger',
		icon: 'file:spark.svg',
		group: ['trigger'],
		version: 1,
		description: 'Listen to Spark Protocol events in real-time',
		defaults: {
			name: 'Spark Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'sparkNetwork',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'options',
				options: [
					{
						name: 'Supply Event',
						value: 'supply',
						description: 'Triggered when assets are supplied to the protocol',
					},
					{
						name: 'Withdrawal Event',
						value: 'withdraw',
						description: 'Triggered when assets are withdrawn from the protocol',
					},
					{
						name: 'Borrow Event',
						value: 'borrow',
						description: 'Triggered when assets are borrowed',
					},
					{
						name: 'Repay Event',
						value: 'repay',
						description: 'Triggered when borrowed assets are repaid',
					},
					{
						name: 'Collateral Enabled',
						value: 'collateralEnabled',
						description: 'Triggered when collateral is enabled for an asset',
					},
					{
						name: 'Collateral Disabled',
						value: 'collateralDisabled',
						description: 'Triggered when collateral is disabled for an asset',
					},
					{
						name: 'Liquidation Event',
						value: 'liquidation',
						description: 'Triggered when a position is liquidated',
					},
					{
						name: 'Flash Loan Event',
						value: 'flashLoan',
						description: 'Triggered when a flash loan is executed',
					},
					{
						name: 'E-Mode Changed',
						value: 'eModeChanged',
						description: 'Triggered when a user changes their E-Mode category',
					},
					{
						name: 'Reserve Updated',
						value: 'reserveUpdated',
						description: 'Triggered when reserve data is updated (rates change)',
					},
					{
						name: 'sDAI Deposit',
						value: 'sdaiDeposit',
						description: 'Triggered when DAI is deposited into sDAI',
					},
					{
						name: 'sDAI Withdrawal',
						value: 'sdaiWithdraw',
						description: 'Triggered when DAI is withdrawn from sDAI',
					},
					{
						name: 'Large Supply Alert',
						value: 'largeSupply',
						description: 'Triggered when a supply exceeds the threshold',
					},
					{
						name: 'Large Borrow Alert',
						value: 'largeBorrow',
						description: 'Triggered when a borrow exceeds the threshold',
					},
					{
						name: 'Large Flash Loan Alert',
						value: 'largeFlashLoan',
						description: 'Triggered when a flash loan exceeds the threshold',
					},
				],
				default: 'supply',
				description: 'The type of event to listen for',
			},
			// Filter options
			{
				displayName: 'Filter by Asset',
				name: 'filterByAsset',
				type: 'boolean',
				default: false,
				description: 'Whether to filter events by a specific asset',
			},
			{
				displayName: 'Asset Address',
				name: 'assetAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: {
					show: {
						filterByAsset: [true],
					},
				},
				description: 'The asset address to filter events for',
			},
			{
				displayName: 'Filter by User',
				name: 'filterByUser',
				type: 'boolean',
				default: false,
				description: 'Whether to filter events by a specific user',
			},
			{
				displayName: 'User Address',
				name: 'userAddress',
				type: 'string',
				default: '',
				placeholder: '0x...',
				displayOptions: {
					show: {
						filterByUser: [true],
					},
				},
				description: 'The user address to filter events for',
			},
			// Threshold for alerts
			{
				displayName: 'Threshold Amount (USD)',
				name: 'thresholdAmount',
				type: 'number',
				default: 100000,
				displayOptions: {
					show: {
						triggerType: ['largeSupply', 'largeBorrow', 'largeFlashLoan'],
					},
				},
				description: 'Minimum USD value to trigger the alert',
			},
			// Polling options
			{
				displayName: 'Polling Interval',
				name: 'pollInterval',
				type: 'options',
				options: [
					{ name: '10 Seconds', value: 10 },
					{ name: '30 Seconds', value: 30 },
					{ name: '1 Minute', value: 60 },
					{ name: '5 Minutes', value: 300 },
					{ name: '15 Minutes', value: 900 },
				],
				default: 30,
				description: 'How often to poll for new events',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		logLicensingNotice();

		const credentials = await this.getCredentials('sparkNetwork');
		const triggerType = this.getNodeParameter('triggerType') as string;
		const filterByAsset = this.getNodeParameter('filterByAsset', false) as boolean;
		const filterByUser = this.getNodeParameter('filterByUser', false) as boolean;
		const pollInterval = this.getNodeParameter('pollInterval', 30) as number;

		const assetAddress = filterByAsset ? (this.getNodeParameter('assetAddress', '') as string).toLowerCase() : null;
		const userAddress = filterByUser ? (this.getNodeParameter('userAddress', '') as string).toLowerCase() : null;

		const rpcUrl = credentials.rpcUrl as string;
		const network = credentials.network as string;

		const provider = new ethers.JsonRpcProvider(rpcUrl);

		// Get contract addresses
		const contracts = SPARK_CONTRACTS[network as keyof typeof SPARK_CONTRACTS];
		if (!contracts) {
			throw new Error(`Unsupported network: ${network}`);
		}

		let lastProcessedBlock = await provider.getBlockNumber();
		let intervalId: NodeJS.Timeout;

		const getEventFilter = () => {
			const poolContract = new ethers.Contract(contracts.pool, POOL_EVENTS_ABI, provider);
			const sdaiContract = contracts.sDAI ? new ethers.Contract(contracts.sDAI, SDAI_EVENTS_ABI, provider) : null;

			switch (triggerType) {
				case 'supply':
					return { contract: poolContract, event: 'Supply', name: 'Supply' };
				case 'withdraw':
					return { contract: poolContract, event: 'Withdraw', name: 'Withdraw' };
				case 'borrow':
					return { contract: poolContract, event: 'Borrow', name: 'Borrow' };
				case 'repay':
					return { contract: poolContract, event: 'Repay', name: 'Repay' };
				case 'collateralEnabled':
					return { contract: poolContract, event: 'ReserveUsedAsCollateralEnabled', name: 'CollateralEnabled' };
				case 'collateralDisabled':
					return { contract: poolContract, event: 'ReserveUsedAsCollateralDisabled', name: 'CollateralDisabled' };
				case 'liquidation':
					return { contract: poolContract, event: 'LiquidationCall', name: 'Liquidation' };
				case 'flashLoan':
					return { contract: poolContract, event: 'FlashLoan', name: 'FlashLoan' };
				case 'eModeChanged':
					return { contract: poolContract, event: 'UserEModeSet', name: 'EModeChanged' };
				case 'reserveUpdated':
					return { contract: poolContract, event: 'ReserveDataUpdated', name: 'ReserveUpdated' };
				case 'sdaiDeposit':
					if (!sdaiContract) throw new Error('sDAI not available on this network');
					return { contract: sdaiContract, event: 'Deposit', name: 'sDAIDeposit' };
				case 'sdaiWithdraw':
					if (!sdaiContract) throw new Error('sDAI not available on this network');
					return { contract: sdaiContract, event: 'Withdraw', name: 'sDAIWithdraw' };
				case 'largeSupply':
					return { contract: poolContract, event: 'Supply', name: 'LargeSupply', requiresThreshold: true };
				case 'largeBorrow':
					return { contract: poolContract, event: 'Borrow', name: 'LargeBorrow', requiresThreshold: true };
				case 'largeFlashLoan':
					return { contract: poolContract, event: 'FlashLoan', name: 'LargeFlashLoan', requiresThreshold: true };
				default:
					throw new Error(`Unknown trigger type: ${triggerType}`);
			}
		};

		const parseEventData = (event: ethers.EventLog, eventName: string): IDataObject => {
			const baseData: IDataObject = {
				eventName,
				transactionHash: event.transactionHash,
				blockNumber: event.blockNumber,
				timestamp: Date.now(),
				network,
			};

			const args = event.args;
			if (!args) return baseData;

			switch (eventName) {
				case 'Supply':
				case 'LargeSupply':
					return {
						...baseData,
						reserve: args[0],
						user: args[1],
						onBehalfOf: args[2],
						amount: args[3]?.toString(),
						referralCode: args[4]?.toString(),
					};
				case 'Withdraw':
					return {
						...baseData,
						reserve: args[0],
						user: args[1],
						to: args[2],
						amount: args[3]?.toString(),
					};
				case 'Borrow':
				case 'LargeBorrow':
					return {
						...baseData,
						reserve: args[0],
						user: args[1],
						onBehalfOf: args[2],
						amount: args[3]?.toString(),
						interestRateMode: args[4]?.toString(),
						borrowRate: args[5]?.toString(),
						referralCode: args[6]?.toString(),
					};
				case 'Repay':
					return {
						...baseData,
						reserve: args[0],
						user: args[1],
						repayer: args[2],
						amount: args[3]?.toString(),
						useATokens: args[4],
					};
				case 'CollateralEnabled':
					return {
						...baseData,
						reserve: args[0],
						user: args[1],
					};
				case 'CollateralDisabled':
					return {
						...baseData,
						reserve: args[0],
						user: args[1],
					};
				case 'Liquidation':
					return {
						...baseData,
						collateralAsset: args[0],
						debtAsset: args[1],
						user: args[2],
						debtToCover: args[3]?.toString(),
						liquidatedCollateralAmount: args[4]?.toString(),
						liquidator: args[5],
						receiveAToken: args[6],
					};
				case 'FlashLoan':
				case 'LargeFlashLoan':
					return {
						...baseData,
						target: args[0],
						initiator: args[1],
						asset: args[2],
						amount: args[3]?.toString(),
						interestRateMode: args[4]?.toString(),
						premium: args[5]?.toString(),
						referralCode: args[6]?.toString(),
					};
				case 'EModeChanged':
					return {
						...baseData,
						user: args[0],
						categoryId: args[1]?.toString(),
					};
				case 'ReserveUpdated':
					return {
						...baseData,
						reserve: args[0],
						liquidityRate: args[1]?.toString(),
						stableBorrowRate: args[2]?.toString(),
						variableBorrowRate: args[3]?.toString(),
						liquidityIndex: args[4]?.toString(),
						variableBorrowIndex: args[5]?.toString(),
					};
				case 'sDAIDeposit':
					return {
						...baseData,
						sender: args[0],
						owner: args[1],
						assets: args[2]?.toString(),
						shares: args[3]?.toString(),
					};
				case 'sDAIWithdraw':
					return {
						...baseData,
						sender: args[0],
						receiver: args[1],
						owner: args[2],
						assets: args[3]?.toString(),
						shares: args[4]?.toString(),
					};
				default:
					return baseData;
			}
		};

		const shouldEmitEvent = (eventData: IDataObject): boolean => {
			// Filter by asset
			if (assetAddress) {
				const eventAsset = (eventData.reserve || eventData.asset || eventData.collateralAsset || '') as string;
				if (eventAsset.toLowerCase() !== assetAddress) {
					return false;
				}
			}

			// Filter by user
			if (userAddress) {
				const eventUser = (eventData.user || eventData.owner || eventData.sender || '') as string;
				if (eventUser.toLowerCase() !== userAddress) {
					return false;
				}
			}

			// Check threshold for alert types
			if (['largeSupply', 'largeBorrow', 'largeFlashLoan'].includes(triggerType)) {
				// Note: In production, you would convert the amount to USD using oracle prices
				// For now, we just check if amount is provided
				const thresholdAmount = this.getNodeParameter('thresholdAmount', 100000) as number;
				const amount = BigInt(eventData.amount as string || '0');
				// This is a simplified check - in production, multiply by price and divide by decimals
				const estimatedUSD = Number(amount) / 1e18; // Assuming 18 decimals
				if (estimatedUSD < thresholdAmount) {
					return false;
				}
			}

			return true;
		};

		const pollForEvents = async () => {
			try {
				const currentBlock = await provider.getBlockNumber();
				if (currentBlock <= lastProcessedBlock) return;

				const { contract, event, name } = getEventFilter();
				const filter = contract.filters[event]();

				const events = await contract.queryFilter(
					filter,
					lastProcessedBlock + 1,
					currentBlock,
				);

				for (const evt of events) {
					if (evt instanceof ethers.EventLog) {
						const eventData = parseEventData(evt, name);
						if (shouldEmitEvent.call(this, eventData)) {
							this.emit([this.helpers.returnJsonArray([eventData])]);
						}
					}
				}

				lastProcessedBlock = currentBlock;
			} catch (error) {
				console.error('Error polling for Spark events:', error);
			}
		};

		// Start polling
		intervalId = setInterval(pollForEvents, pollInterval * 1000);

		// Also poll immediately
		await pollForEvents();

		const closeFunction = async () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};

		return {
			closeFunction,
		};
	}
}
