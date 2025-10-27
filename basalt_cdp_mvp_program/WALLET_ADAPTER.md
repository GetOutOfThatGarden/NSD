# Frontend Wallet Adapter Setup (Solana)

This document explains how the Solana wallet adapter is installed, configured, and integrated into the Basalt CDP MVP frontend, along with testing notes and security considerations.

## 1) Installation

The project already includes the wallet adapter libraries in `package.json`:

- `@solana/wallet-adapter-react`
- `@solana/wallet-adapter-react-ui`
- `@solana/wallet-adapter-wallets`
- `@solana/web3.js`

To update to the latest stable versions (optional), run:

```bash
npm i @solana/wallet-adapter-react@latest \
       @solana/wallet-adapter-react-ui@latest \
       @solana/wallet-adapter-wallets@latest \
       @solana/web3.js@latest
```

Note: If you encounter a peer dependency conflict related to `anchor-bankrun`, you can proceed without updating (current versions are compatible with React 18), or use `--legacy-peer-deps` for the update:

```bash
npm i @solana/wallet-adapter-react@latest \
       @solana/wallet-adapter-react-ui@latest \
       @solana/wallet-adapter-wallets@latest \
       @solana/web3.js@latest --legacy-peer-deps
```

## 2) Configuration

A dedicated provider wrapper initializes the wallet system and selects the RPC endpoint:

- File: `app/providers/WalletProvider.tsx`
- Providers: `ConnectionProvider`, `WalletProvider`, `WalletModalProvider`
- Wallets: Phantom, Solflare (extendable)

Network selection is driven by environment variables:

- `VITE_SOLANA_CLUSTER`: one of `devnet`, `testnet`, `mainnet-beta`, `localnet` (default `devnet`)
- `VITE_SOLANA_RPC_URL`: optional custom RPC URL (overrides the default for the selected cluster)

Localnet fallback: `http://127.0.0.1:8899` when `VITE_SOLANA_CLUSTER=localnet`.

Error handling:

- `WalletProvider` is configured with `onError`, which logs adapter errors with context.
- Extend with UI notifications if desired (e.g., `sonner` toasts).

## 3) Integration

The app is wrapped with the wallet providers and the adapter’s UI styles are imported:

- File: `app/main.tsx`

```tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { WalletProviders } from './providers/WalletProvider';
import '@solana/wallet-adapter-react-ui/styles.css';

createRoot(document.getElementById('root')!).render(
  <WalletProviders>
    <App />
  </WalletProviders>
);
```

A connect button is added to the header:

- File: `app/App.tsx`

```tsx
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
// ...
<div className="flex items-center">
  <WalletMultiButton />
</div>
```

## 4) Testing

- Start the dev server: `npm run dev` (or `npm run dev -- --port 5174`).
- Open the app and click the connect button; test with:
  - Phantom extension
  - Solflare extension
- Switch networks by setting `VITE_SOLANA_CLUSTER` and optionally `VITE_SOLANA_RPC_URL` (restart dev server after changes).
- Confirm errors are handled gracefully (e.g., invalid RPC URL shows a console error but app remains responsive).

Basic connection test snippet (optional):

```tsx
import { useConnection } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

export function ConnectionHealthCheck() {
  const { connection } = useConnection();
  useEffect(() => {
    connection.getVersion().then(v => console.log('Solana RPC version', v)).catch(err => console.error('RPC error', err));
  }, [connection]);
  return null;
}
```

## 5) Security Best Practices

- Never hardcode private keys or secrets in the frontend.
- Use environment variables for RPC URLs; avoid embedding provider keys directly.
- Prefer trusted RPC endpoints and verify SSL.
- Do not auto-trigger transactions; require explicit user actions.
- Validate inputs server-side for any critical operations.

## 6) Customization

- To add more wallets, import adapters from `@solana/wallet-adapter-wallets` and include them in the `wallets` array.
- To customize the connect button, pass classes or create a custom UI using hooks from `@solana/wallet-adapter-react`.

## 7) Files Touched

- `app/providers/WalletProvider.tsx` – new provider wrapper
- `app/main.tsx` – providers + styles import
- `app/App.tsx` – wallet connect button in header
- `app/index.css` – removed `@import` for adapter styles to satisfy PostCSS ordering (styles imported via TS)

This setup maintains compatibility with the current Vite + React 18 architecture and provides a secure, extensible foundation for Solana wallet integration.