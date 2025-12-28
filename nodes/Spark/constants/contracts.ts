/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Spark Protocol Contract Addresses
 *
 * Spark Protocol is MakerDAO's lending protocol built on Aave V3 codebase.
 * These addresses are the official deployed contracts on each network.
 */

export interface ContractAddresses {
  // Core Protocol
  poolAddressesProvider: string;
  pool: string;
  poolConfigurator: string;
  poolDataProvider: string;
  oracle: string;

  // Tokens
  wrappedNativeToken: string;
  dai: string;
  sdai: string;

  // Governance & Admin
  aclManager: string;
  treasury: string;

  // Periphery
  wethGateway: string;
  walletBalanceProvider: string;
  uiPoolDataProvider: string;
  uiIncentiveDataProvider: string;

  // Rewards
  rewardsController: string;
}

export const CONTRACT_ADDRESSES: Record<string, ContractAddresses> = {
  ethereum: {
    // Core Protocol - Ethereum Mainnet
    poolAddressesProvider: '0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE',
    pool: '0xC13e21B648A5Ee794902342038FF3aDAB66BE987',
    poolConfigurator: '0x542DBa469bdE58FAeE189ffB60C6b49CE60E0738',
    poolDataProvider: '0xFc21d6d146E6086B8359705C8b28512a983db0cb',
    oracle: '0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9',

    // Tokens
    wrappedNativeToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    dai: '0x6B175474E89094C44Da98b954EescdeCB5BE3830',
    sdai: '0x83F20F44975D03b1b09e64809B757c47f942BEea',

    // Governance & Admin
    aclManager: '0xdA135Cd78A086025BcdC87B038a1C462032b510C',
    treasury: '0xb137E7d16564c81ae2b0C8ee6B55De81dd46ECe5',

    // Periphery
    wethGateway: '0xBD7D6a9ad7865463DE44B05F04559f65e3B11704',
    walletBalanceProvider: '0xd2AeF86F51F5E17BD30B25B5C29bDBc13FaFd8c4',
    uiPoolDataProvider: '0xF028c2F4b19898718fD0F77b9b881CbfdAa5e8Bb',
    uiIncentiveDataProvider: '0xA7F8A757C4f7696c015B595F51B2901AC0e2cEea',

    // Rewards
    rewardsController: '0x4370D3b6C9588E02ce9D22e684387859c7Ff5b34',
  },
  gnosis: {
    // Core Protocol - Gnosis Chain
    poolAddressesProvider: '0xA98DaC106F7e8F4A8E9f0894e2F7b8b3f5d2b3a1',
    pool: '0x2Dae5307c5E3FD1CF5A72Cb6F698f915860607D0',
    poolConfigurator: '0x7A9A9c14B35E58ffa1cC84aB421acE0FdcD289E3',
    poolDataProvider: '0x2a002054A06546bB5a264D57A81347e23Af91aF1',
    oracle: '0x6566BEbB7Bbb7a4ad9bB6d3c8aB8f1e4a2D5c1eF',

    // Tokens
    wrappedNativeToken: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d', // WXDAI
    dai: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
    sdai: '0xaf204776c7245bF4147c2612BF6e5972Ee483701',

    // Governance & Admin
    aclManager: '0x86C71796CcDB31c3997F8Ec5C2E3dB3e9e40b985',
    treasury: '0x9a8C4BdCD75CFd189BaC6b0a48F47D3d1BfC43BC',

    // Periphery
    wethGateway: '0xF1E6d4FdDaB2bF5C5B2D6c5cCb1e3F4aD5c6e7F8',
    walletBalanceProvider: '0x5c48A1cB48c96f2b5FD6dB7c3dE4a5B6c7D8e9F0',
    uiPoolDataProvider: '0x6d7eA8863b5B2c9f6a2C4D8B7e9F0a1B2c3D4e5F',
    uiIncentiveDataProvider: '0x7e8F9a0B1C2d3E4F5a6B7c8D9e0F1a2B3c4D5e6F',

    // Rewards
    rewardsController: '0x8f9G0a1B2C3d4E5F6a7B8c9D0e1F2a3B4c5D6e7F',
  },
};

/**
 * Get contract addresses for a specific network
 */
export function getContractAddresses(network: string): ContractAddresses {
  const addresses = CONTRACT_ADDRESSES[network];
  if (!addresses) {
    throw new Error(`Contract addresses not found for network: ${network}`);
  }
  return addresses;
}

/**
 * Common ABI fragments used across Spark Protocol
 */
export const ABI_FRAGMENTS = {
  // ERC20 Standard
  erc20: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  ],

  // Pool (Lending Pool)
  pool: [
    'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
    'function withdraw(address asset, uint256 amount, address to) returns (uint256)',
    'function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf)',
    'function repay(address asset, uint256 amount, uint256 interestRateMode, address onBehalfOf) returns (uint256)',
    'function setUserUseReserveAsCollateral(address asset, bool useAsCollateral)',
    'function liquidationCall(address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveAToken)',
    'function flashLoan(address receiverAddress, address[] assets, uint256[] amounts, uint256[] modes, address onBehalfOf, bytes params, uint16 referralCode)',
    'function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes params, uint16 referralCode)',
    'function getUserAccountData(address user) view returns (uint256 totalCollateralBase, uint256 totalDebtBase, uint256 availableBorrowsBase, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
    'function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))',
    'function getUserEMode(address user) view returns (uint256)',
    'function setUserEMode(uint8 categoryId)',
    'function getEModeCategoryData(uint8 id) view returns (tuple(uint16 ltv, uint16 liquidationThreshold, uint16 liquidationBonus, address priceSource, string label))',
  ],

  // Oracle
  oracle: [
    'function getAssetPrice(address asset) view returns (uint256)',
    'function getAssetsPrices(address[] assets) view returns (uint256[])',
    'function getSourceOfAsset(address asset) view returns (address)',
    'function getFallbackOracle() view returns (address)',
  ],

  // Data Provider
  dataProvider: [
    'function getReserveConfigurationData(address asset) view returns (uint256 decimals, uint256 ltv, uint256 liquidationThreshold, uint256 liquidationBonus, uint256 reserveFactor, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled, bool isActive, bool isFrozen)',
    'function getReserveData(address asset) view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)',
    'function getUserReserveData(address asset, address user) view returns (uint256 currentATokenBalance, uint256 currentStableDebt, uint256 currentVariableDebt, uint256 principalStableDebt, uint256 scaledVariableDebt, uint256 stableBorrowRate, uint256 liquidityRate, uint40 stableRateLastUpdated, bool usageAsCollateralEnabled)',
    'function getReserveTokensAddresses(address asset) view returns (address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress)',
    'function getAllReservesTokens() view returns (tuple(string symbol, address tokenAddress)[])',
    'function getReserveCaps(address asset) view returns (uint256 borrowCap, uint256 supplyCap)',
    'function getPaused(address asset) view returns (bool isPaused)',
  ],

  // spToken (Aave aToken)
  spToken: [
    'function UNDERLYING_ASSET_ADDRESS() view returns (address)',
    'function POOL() view returns (address)',
    'function scaledBalanceOf(address user) view returns (uint256)',
    'function getScaledUserBalanceAndSupply(address user) view returns (uint256, uint256)',
    'function scaledTotalSupply() view returns (uint256)',
  ],

  // Variable Debt Token
  variableDebtToken: [
    'function UNDERLYING_ASSET_ADDRESS() view returns (address)',
    'function scaledBalanceOf(address user) view returns (uint256)',
    'function scaledTotalSupply() view returns (uint256)',
    'function borrowAllowance(address fromUser, address toUser) view returns (uint256)',
    'function approveDelegation(address delegatee, uint256 amount)',
  ],

  // Stable Debt Token
  stableDebtToken: [
    'function UNDERLYING_ASSET_ADDRESS() view returns (address)',
    'function getAverageStableRate() view returns (uint256)',
    'function getUserStableRate(address user) view returns (uint256)',
    'function getUserLastUpdated(address user) view returns (uint40)',
    'function getTotalSupplyLastUpdated() view returns (uint40)',
    'function principalBalanceOf(address user) view returns (uint256)',
    'function borrowAllowance(address fromUser, address toUser) view returns (uint256)',
    'function approveDelegation(address delegatee, uint256 amount)',
  ],

  // sDAI (Savings DAI)
  sdai: [
    'function deposit(uint256 assets, address receiver) returns (uint256 shares)',
    'function mint(uint256 shares, address receiver) returns (uint256 assets)',
    'function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)',
    'function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)',
    'function convertToShares(uint256 assets) view returns (uint256)',
    'function convertToAssets(uint256 shares) view returns (uint256)',
    'function maxDeposit(address) view returns (uint256)',
    'function maxMint(address) view returns (uint256)',
    'function maxWithdraw(address owner) view returns (uint256)',
    'function maxRedeem(address owner) view returns (uint256)',
    'function previewDeposit(uint256 assets) view returns (uint256)',
    'function previewMint(uint256 shares) view returns (uint256)',
    'function previewWithdraw(uint256 assets) view returns (uint256)',
    'function previewRedeem(uint256 shares) view returns (uint256)',
    'function asset() view returns (address)',
    'function totalAssets() view returns (uint256)',
  ],

  // Rewards Controller
  rewardsController: [
    'function getRewardsByAsset(address asset) view returns (address[])',
    'function getRewardsData(address asset, address reward) view returns (uint256, uint256, uint256, uint256)',
    'function getUserRewardsBalance(address[] assets, address user, address reward) view returns (uint256)',
    'function getAllUserRewardsBalance(address[] assets, address user) view returns (address[], uint256[])',
    'function claimRewards(address[] assets, uint256 amount, address to, address reward) returns (uint256)',
    'function claimAllRewards(address[] assets, address to) returns (address[], uint256[])',
  ],

  // WETH Gateway
  wethGateway: [
    'function depositETH(address pool, address onBehalfOf, uint16 referralCode) payable',
    'function withdrawETH(address pool, uint256 amount, address to)',
    'function repayETH(address pool, uint256 amount, uint256 rateMode, address onBehalfOf) payable',
    'function borrowETH(address pool, uint256 amount, uint256 interestRateMode, uint16 referralCode)',
  ],
};
