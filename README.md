# n8n-nodes-spark

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for **Spark Protocol (SparkLend)** - MakerDAO's DeFi lending platform. This package provides full integration with Spark's lending and borrowing operations, flash loans, sDAI integration, and real-time event monitoring.

![n8n](https://img.shields.io/badge/n8n-community--node-blue)
![Spark Protocol](https://img.shields.io/badge/Spark-Protocol-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **22 Resource Categories** with 200+ operations
- **Complete Lending Operations** - Supply, borrow, repay, withdraw
- **Collateral Management** - Enable/disable collateral, manage LTV
- **E-Mode Support** - Efficiency mode for correlated assets
- **Flash Loans** - Uncollateralized single-transaction loans
- **sDAI Integration** - Savings DAI with DSR (DAI Savings Rate)
- **Credit Delegation** - Borrow on behalf of others
- **Real-time Triggers** - Event monitoring for all protocol activities
- **Multi-chain Support** - Ethereum Mainnet and Gnosis Chain
- **Oracle Price Feeds** - Real-time asset pricing
- **Subgraph Queries** - Historical data and analytics

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Search for `n8n-nodes-spark`
4. Click **Install**
5. Restart n8n

### Manual Installation

```bash
# Navigate to your n8n custom nodes directory
cd ~/.n8n/custom

# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-spark.git
cd n8n-nodes-spark

# Install dependencies and build
npm install
npm run build

# Restart n8n
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-spark.git
cd n8n-nodes-spark

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-spark

# Restart n8n
```

## Credentials Setup

### Spark Network Credentials

Required for all blockchain operations.

| Field | Description | Example |
|-------|-------------|---------|
| Network | Blockchain network | `ethereum`, `gnosis`, `custom` |
| RPC Endpoint URL | JSON-RPC endpoint | `https://eth.llamarpc.com` |
| Private Key | Wallet private key (for write operations) | `0x...` |
| Chain ID | Network chain ID (auto-populated) | `1` for Ethereum |

### Spark API Credentials

Optional, for enhanced subgraph access.

| Field | Description | Example |
|-------|-------------|---------|
| Subgraph URL | Custom subgraph endpoint | `https://api.thegraph.com/...` |
| API Key | API key if required | `abc123...` |

## Resources & Operations

### Account Resource
- Get Account Overview
- Get Account Balances
- Get Supplied Assets
- Get Borrowed Assets
- Get Health Factor
- Get Net APY
- Get Account Value
- Get Account History
- Get Liquidation Risk
- Get Available Actions

### Supply Resource
- Supply Asset / ETH / with Permit
- Get Supply Balance / APY / Total
- Withdraw Asset / ETH / Max
- Get Available to Withdraw
- Get Supply Cap / Is Paused
- Get Supply History

### Borrow Resource
- Borrow Asset / ETH
- Get Borrow Balance / APY (Variable/Stable)
- Get Total Borrowed
- Repay Borrow / ETH / Max / with aTokens
- Get Available to Borrow
- Get Borrow Cap / Is Paused
- Switch Borrow Rate Mode
- Get Borrow History

### Collateral Resource
- Enable/Disable as Collateral
- Get Collateral Status / Factor (LTV)
- Get Liquidation Threshold
- Get Collateral Value / All Collaterals
- Get Isolation Mode Status

### Market Resource
- Get Markets / Market Info / by Asset
- Get Market APYs / Utilization / Liquidity
- Get Market Caps / Parameters
- Get Reserve Data / Historical Rates
- Is Market Active / Frozen

### E-Mode Resource
- Get E-Modes / E-Mode Info
- Set/Get User E-Mode
- Get E-Mode Assets / LTV / Threshold / Bonus
- Exit E-Mode

### spToken Resource
- Get spToken Info / Balance / Supply
- Transfer / Approve spToken
- Get Underlying Asset / Exchange Rate
- Get Scaled Balance / Interest Earned

### Debt Token Resource
- Get Variable/Stable Debt Token Info
- Get Debt Balance / Total Debt
- Get/Delegate Borrow Allowance
- Revoke Delegation

### Flash Loan Resource
- Execute Flash Loan (Simple/Advanced)
- Get Flash Loan Premium / Max Amount
- Get Flash Loan Fees
- Estimate Flash Loan Cost

### Liquidation Resource
- Get Liquidatable Users / Liquidation Info
- Liquidate Position
- Get Liquidation Bonus / Close Factor
- Calculate Liquidation Amount
- Simulate Liquidation
- Get Liquidation History

### Oracle Resource
- Get Asset Price / Prices (batch)
- Get Price Source / Fallback Oracle
- Get Historical Prices
- Validate Price

### Interest Rate Resource
- Get Supply/Variable Borrow/Stable Borrow Rate
- Get Utilization Rate / Optimal Utilization
- Get Rate Strategy / Base Rate / Slopes
- Calculate Rate at Utilization
- Get Rate History

### sDAI Resource
- Get sDAI Balance / Rate / APY
- Deposit/Withdraw DAI to/from sDAI
- Get sDAI Total Supply
- Supply sDAI as Collateral
- Borrow against sDAI

### DAI Resource
- Get DAI Balance / DSR / DSR APY
- Deposit/Withdraw from DSR
- Get DAI Market Info / Borrowing Rate
- Borrow/Repay DAI

### Rewards Resource
- Get Rewards Info / Claimable / Rate
- Claim Rewards / All Rewards
- Get Reward Assets / Distribution
- Get User Rewards / Unclaimed

### Governance Resource
- Get Proposals / Voting Power
- Vote on Proposal
- Get Governance Stats / Delegates
- Delegate Votes

### Pool Resource
- Get Pool Info / Address / Configurator
- Get Pool Data Provider / Admin
- Get Protocol Data / TVL

### Credit Delegation Resource
- Approve/Revoke Delegation
- Get Borrow Allowance
- Borrow on Behalf
- Get Delegated Borrow Power
- Get Delegation Events

### Migration Resource
- Check Migration from Aave
- Migrate from Aave V2/V3
- Get Migration Quote
- Estimate Gas Savings

### Analytics Resource
- Get Protocol TVL / Stats
- Get Market Rankings / User Stats
- Get Historical Data
- Get Liquidation/Revenue Stats
- Export Data

### Subgraph Resource
- Query Markets / Users / Transactions
- Query Liquidations / Rewards
- Custom GraphQL Query
- Get Subgraph Status

### Utility Resource
- Calculate Health Factor / Max Borrow
- Calculate Liquidation Price
- Convert spToken ↔ Underlying
- Validate Address
- Get Contract Addresses
- Estimate Gas / Network Status

## Trigger Node

The **Spark Trigger** node monitors blockchain events in real-time:

### Supply Triggers
- Supply Event
- Withdrawal Event
- Large Supply Alert

### Borrow Triggers
- Borrow Event
- Repay Event
- Large Borrow Alert
- Rate Mode Changed

### Position Triggers
- Collateral Enabled/Disabled
- Health Factor Alert
- Position at Risk

### Liquidation Triggers
- Liquidation Event
- Liquidation Opportunity

### sDAI Triggers
- sDAI Deposited/Withdrawn
- Rate Changed

### Flash Loan Triggers
- Flash Loan Executed
- Large Flash Loan Alert

## Usage Examples

### Supply ETH and Earn Yield

```json
{
  "nodes": [
    {
      "name": "Supply ETH",
      "type": "n8n-nodes-spark.spark",
      "parameters": {
        "resource": "supply",
        "operation": "supplyETH",
        "amount": "1.0"
      }
    }
  ]
}
```

### Borrow DAI Against Collateral

```json
{
  "nodes": [
    {
      "name": "Borrow DAI",
      "type": "n8n-nodes-spark.spark",
      "parameters": {
        "resource": "borrow",
        "operation": "borrowAsset",
        "asset": "0x6B175474E89094C44Da98b954EesDecF55C02Af5",
        "amount": "1000",
        "rateMode": "variable"
      }
    }
  ]
}
```

### Monitor Health Factor

```json
{
  "nodes": [
    {
      "name": "Check Health",
      "type": "n8n-nodes-spark.spark",
      "parameters": {
        "resource": "account",
        "operation": "getHealthFactor",
        "address": "0x..."
      }
    },
    {
      "name": "Alert if Low",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "number": [{
            "value1": "={{$json.healthFactor}}",
            "operation": "smaller",
            "value2": 1.5
          }]
        }
      }
    }
  ]
}
```

### Execute Flash Loan

```json
{
  "nodes": [
    {
      "name": "Flash Loan",
      "type": "n8n-nodes-spark.spark",
      "parameters": {
        "resource": "flashLoan",
        "operation": "executeSimple",
        "asset": "0x6B175474E89094C44Da98b954EesDecF55C02Af5",
        "amount": "100000",
        "receiverContract": "0x..."
      }
    }
  ]
}
```

### Convert DAI to sDAI

```json
{
  "nodes": [
    {
      "name": "Deposit to sDAI",
      "type": "n8n-nodes-spark.spark",
      "parameters": {
        "resource": "sdai",
        "operation": "deposit",
        "amount": "10000"
      }
    }
  ]
}
```

## Spark Protocol Concepts

### Health Factor
A numerical representation of position safety. Values above 1 are safe; below 1 triggers liquidation. Formula: `(Collateral × Liquidation Threshold) / Debt`

### LTV (Loan-to-Value)
Maximum percentage of collateral value that can be borrowed. Example: 80% LTV means you can borrow up to $80 for every $100 of collateral.

### Liquidation Threshold
The LTV level at which a position becomes liquidatable. Always higher than LTV to provide a buffer.

### E-Mode (Efficiency Mode)
Allows higher LTV for correlated assets (e.g., ETH/stETH). Enables capital efficiency for similar asset pairs.

### spToken
Interest-bearing tokens received when supplying assets. Value increases over time as interest accrues.

### sDAI (Savings DAI)
An ERC-4626 vault that earns the DAI Savings Rate (DSR). DAI deposited earns yield from MakerDAO.

### Flash Loans
Uncollateralized loans that must be repaid within the same transaction. Used for arbitrage, liquidations, and collateral swaps.

### Credit Delegation
Allows users to delegate their borrowing power to others, enabling undercollateralized loans for trusted parties.

## Networks

| Network | Chain ID | Pool Address |
|---------|----------|--------------|
| Ethereum Mainnet | 1 | `0xC13e21B648A5Ee794902342038FF3aDAB66BE987` |
| Gnosis Chain | 100 | `0x2Dae5307c5E3FD1CF5A72Cb6F698f915860607e0` |

## Error Handling

The node provides detailed error messages for common scenarios:

- **Insufficient Balance**: Not enough tokens for the operation
- **Health Factor Too Low**: Operation would make position unsafe
- **Exceeds Borrow Cap**: Market borrow limit reached
- **Asset Not Collateral**: Asset not enabled as collateral
- **Invalid Address**: Malformed Ethereum address
- **Rate Limit**: RPC endpoint rate limiting

## Security Best Practices

1. **Never expose private keys** - Use environment variables or n8n credentials
2. **Monitor health factor** - Set up alerts for positions approaching liquidation
3. **Use test networks first** - Validate workflows on testnets before mainnet
4. **Validate addresses** - Always verify contract addresses
5. **Check oracle prices** - Validate prices before large operations
6. **Review gas costs** - Estimate gas before executing transactions

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Watch mode for development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-spark/issues)
- **Documentation**: [Spark Protocol Docs](https://docs.spark.fi/)
- **n8n Community**: [n8n Community Forum](https://community.n8n.io/)

## Acknowledgments

- [Spark Protocol](https://spark.fi/) - MakerDAO's DeFi lending platform
- [n8n](https://n8n.io/) - Workflow automation platform
- [Aave](https://aave.com/) - Protocol architecture inspiration
- [MakerDAO](https://makerdao.com/) - DAI and sDAI integration
