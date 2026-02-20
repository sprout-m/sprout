import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DAppConnector,
  HederaJsonRpcMethod,
  HederaSessionEvent,
  HederaChainId,
} from '@hashgraph/hedera-wallet-connect';
import {
  AccountId,
  LedgerId,
  TokenId,
  TransferTransaction,
} from '@hashgraph/sdk';

const NETWORK      = import.meta.env.VITE_HEDERA_NETWORK        || 'testnet';
const WC_PROJECT   = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
const USDC_TOKEN   = import.meta.env.VITE_HEDERA_USDC_TOKEN_ID  || '';

const ledgerId = NETWORK === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
const chainId  = NETWORK === 'mainnet' ? HederaChainId.Mainnet : HederaChainId.Testnet;

// Singleton connector — lives outside React to survive StrictMode double-renders.
let _connector   = null;
let _initPromise = null;

function getConnector() {
  if (!_connector) {
    _connector = new DAppConnector(
      {
        name:        'Meridian Marketplace',
        description: 'Business acquisition marketplace with USDC escrow on Hedera',
        url:         window.location.origin,
        icons:       [`${window.location.origin}/logo.png`],
      },
      ledgerId,
      WC_PROJECT,
      Object.values(HederaJsonRpcMethod),
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [chainId],
    );
  }
  return _connector;
}

async function ensureInit() {
  const c = getConnector();
  if (!_initPromise) {
    _initPromise = c.init({ logger: 'error' });
  }
  return _initPromise;
}

// ── Context ───────────────────────────────────────────────────────────────────

const WalletContext = createContext({
  accountId:    '',
  isConnected:  false,
  connecting:   false,
  connect:      async () => {},
  disconnect:   async () => {},
  transferUSDC: async () => { throw new Error('Wallet not ready'); },
});

export function WalletProvider({ children }) {
  const [accountId,   setAccountId]   = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connecting,  setConnecting]  = useState(false);

  const sync = useCallback(() => {
    const id = getConnector().signers?.[0]?.getAccountId()?.toString() ?? '';
    setAccountId(id);
    setIsConnected(Boolean(id));
  }, []);

  // Restore any previously paired session on mount.
  useEffect(() => {
    ensureInit().then(sync).catch(() => {});
  }, [sync]);

  async function connect() {
    setConnecting(true);
    try {
      await ensureInit();
      await getConnector().openModal();
      sync();
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    await getConnector().disconnectAll();
    sync();
  }

  /**
   * Build, sign, and execute a USDC HTS transfer via the connected wallet.
   * Returns the Hedera transaction ID string (e.g. "0.0.12345@1700000000.000000000").
   *
   * Throws if:
   *   - VITE_HEDERA_USDC_TOKEN_ID is not set
   *   - No signer found for fromAccountId (wallet not connected / wrong account)
   *   - User rejects the transaction in HashPack
   */
  async function transferUSDC(fromAccountIdStr, toAccountIdStr, amountUSDC) {
    if (!USDC_TOKEN) {
      throw new Error('VITE_HEDERA_USDC_TOKEN_ID is not configured');
    }

    const c      = getConnector();
    const fromId = AccountId.fromString(fromAccountIdStr);
    const signer = c.getSigner(fromId);

    // USDC has 6 decimal places: 1.00 USDC = 1_000_000 units
    const units = Math.round(amountUSDC * 1_000_000);

    const tx = await new TransferTransaction()
      .addTokenTransfer(TokenId.fromString(USDC_TOKEN), fromId, -units)
      .addTokenTransfer(TokenId.fromString(USDC_TOKEN), AccountId.fromString(toAccountIdStr), units)
      .freezeWithSigner(signer);

    const response = await tx.executeWithSigner(signer);
    return response.transactionId.toString();
  }

  return (
    <WalletContext.Provider value={{ accountId, isConnected, connecting, connect, disconnect, transferUSDC }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
