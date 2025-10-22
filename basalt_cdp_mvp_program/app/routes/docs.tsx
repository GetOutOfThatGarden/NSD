export const Docs = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6">BASALT CDP Protocol Documentation</h1>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p className="text-gray-700 mb-4">
            The BASALT CDP Protocol is a decentralized finance (DeFi) application built on the Solana blockchain 
            that enables users to borrow synthetic assets against collateral. This implementation focuses on 
            creating a secure, efficient, and scalable CDP system.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Core Features</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Mint synthetic assets (USD_RW) by depositing collateral</li>
            <li>Redeem collateral by repaying debt</li>
            <li>Liquidation of undercollateralized vaults</li>
            <li>Automated interest calculation and accrual</li>
            <li>Fixed-point arithmetic for precise financial calculations</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Technical Architecture</h2>
          <h3 className="text-xl font-medium mb-2">Account Structures</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>ProtocolConfig</strong>: Global configuration parameters</li>
            <li><strong>UserVault</strong>: Individual user positions with collateral and debt tracking</li>
          </ul>
          
          <h3 className="text-xl font-medium mb-2">Financial Constants</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Collateral Ratio: 150% (minimum required collateral)</li>
            <li>Interest Rate: 5% annually</li>
            <li>Liquidation Threshold: 120%</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Program Instructions</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>initialize_protocol</strong>: Sets up the protocol configuration</li>
            <li><strong>mint_usdrw</strong>: Mint synthetic assets by depositing collateral</li>
            <li><strong>redeem_collateral</strong>: Repay debt to redeem collateral</li>
            <li><strong>liquidate_vault</strong>: Liquidate undercollateralized vaults</li>
            <li><strong>calculate_interest</strong>: Accrue interest on vaults</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">User Workflow</h2>
          <h3 className="text-xl font-medium mb-2">Borrowing Process</h3>
          <ol className="list-decimal pl-6 text-gray-700 mb-4">
            <li>User deposits collateral into the protocol</li>
            <li>User calls mint_usdrw to borrow USD_RW</li>
            <li>Protocol validates collateral ratio and mints appropriate amount</li>
            <li>User receives USD_RW tokens in their wallet</li>
          </ol>
          
          <h3 className="text-xl font-medium mb-2">Repayment Process</h3>
          <ol className="list-decimal pl-6 text-gray-700 mb-4">
            <li>User calls redeem_collateral to repay debt</li>
            <li>Protocol calculates how much collateral can be redeemed</li>
            <li>Collateral is transferred back to user</li>
            <li>Debt is reduced accordingly</li>
          </ol>
          
          <h3 className="text-xl font-medium mb-2">Liquidation Process</h3>
          <ol className="list-decimal pl-6 text-gray-700 mb-4">
            <li>Vault becomes undercollateralized</li>
            <li>Any user can call liquidate_vault</li>
            <li>Protocol calculates liquidation amount</li>
            <li>Liquidator receives collateral at a discount</li>
            <li>Vault debt is reduced</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Security Considerations</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Account validation for all operations</li>
            <li>Collateral ratio checks to maintain protocol stability</li>
            <li>Interest calculation with time-based accrual</li>
            <li>Reentrancy protection</li>
            <li>Input validation for all parameters</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Directory Structure</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`basalt_cdp_mvp_program/
├── programs/
│   └── basalt_cdp_mvp/
│       ├── src/
│       │   ├── instructions/
│       │   │   ├── calculate_interest.rs
│       │   │   ├── initialize_protocol.rs
│       │   │   ├── liquidate_vault.rs
│       │   │   ├── mint_usdrw.rs
│       │   │   └── redeem_collateral.rs
│       │   ├── state/
│       │   │   ├── protocol_config.rs
│       │   │   └── user_vault.rs
│       │   ├── constants.rs
│       │   ├── error.rs
│       │   └── lib.rs
│       ├── Cargo.toml
│       └── Xargo.toml
├── app/
│   ├── solana/
│   │   ├── client/
│   │   │   ├── rpc.ts
│   │   │   └── pda.ts
│   │   ├── useProgram.ts
│   │   └── SolanaProvider.tsx
│   ├── components/
│   │   └── Header.tsx
│   ├── routes/
│   │   ├── home.tsx
│   │   └── docs.tsx
│   └── root.tsx
├── tests/
│   └── basalt_cdp_mvp.ts
├── migrations/
│   └── deploy.ts
├── Anchor.toml
├── Cargo.toml
└── README.md`}
          </pre>
        </section>
      </div>
    </div>
  );
};