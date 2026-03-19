import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DAppConnector,
  HederaJsonRpcMethod,
  HederaSessionEvent,
  HederaChainId,
} from '@hashgraph/hedera-wallet-connect';
import {
  AccountId,
  Client,
  LedgerId,
  ScheduleId,
  ScheduleSignTransaction,
  TokenAssociateTransaction,
  TokenId,
  TransferTransaction,
} from '@hashgraph/sdk';

const NETWORK      = import.meta.env.VITE_HEDERA_NETWORK        || 'testnet';
const WC_PROJECT   = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
const USDC_TOKEN   = import.meta.env.VITE_HEDERA_USDC_TOKEN_ID  || '';

const ledgerId = NETWORK === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
const chainId  = NETWORK === 'mainnet' ? HederaChainId.Mainnet : HederaChainId.Testnet;

// Read-only client used only for fetching transaction receipts.
const receiptClient = NETWORK === 'mainnet' ? Client.forMainnet() : Client.forTestnet();

// Singleton connector — lives outside React to survive StrictMode double-renders.
let _connector   = null;
let _initPromise = null;

function getConnector() {
  if (!_connector) {
    _connector = new DAppConnector(
      {
        name:        'Meridian',
        description: 'Business acquisition marketplace with USDC escrow on Hedera',
        url:         window.location.origin,
        icons:       [`${window.location.origin}/LOGO.png`],
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
  accountId:              '',
  isConnected:            false,
  connecting:             false,
  connect:                async () => {},
  disconnect:             async () => {},
  transferHBAR:           async () => { throw new Error('Wallet not ready'); },
  transferUSDC:           async () => { throw new Error('Wallet not ready'); },
  ensureTokenAssociated:  async () => { throw new Error('Wallet not ready'); },
  signSchedule:           async () => { throw new Error('Wallet not ready'); },
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
      await getConnector().openModal(undefined, true);
      sync();
      // Return the account ID directly from the connector so callers don't
      // have to wait for React state to flush before using it.
      return getConnector().signers?.[0]?.getAccountId()?.toString() ?? '';
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    await getConnector().disconnectAll();
    sync();
  }

  async function transferHBAR(fromAccountIdStr, toAccountIdStr, amountHBAR) {
    const c      = getConnector();
    const fromId = AccountId.fromString(fromAccountIdStr);
    const signer = c.getSigner(fromId);
    const amount = Number(amountHBAR);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Enter a valid HBAR amount');
    }

    const tx = await new TransferTransaction()
      .setNodeAccountIds([new AccountId(3)])
      .addHbarTransfer(fromId, -amount)
      .addHbarTransfer(AccountId.fromString(toAccountIdStr), amount)
      .freezeWithSigner(signer);

    const response = await tx.executeWithSigner(signer);
    await response.getReceipt(receiptClient);

    return response.transactionId.toString();
  }

  /**
   * Ensure fromAccountId is associated with a given HTS token.
   * HashPack prompts once; silently skips if already associated.
   */
  async function ensureTokenAssociated(fromAccountIdStr, tokenIdStr) {
    const fromId = AccountId.fromString(fromAccountIdStr);
    const signer = getConnector().getSigner(fromId);
    try {
      const tx = await new TokenAssociateTransaction()
        .setAccountId(fromId)
        .setTokenIds([TokenId.fromString(tokenIdStr)])
        .setNodeAccountIds([new AccountId(3)])
        .freezeWithSigner(signer);
      await tx.executeWithSigner(signer);
    } catch (err) {
      if (!err?.message?.includes('TOKEN_ALREADY_ASSOCIATED')) throw err;
    }
  }

  /**
   * Co-sign a Hedera Scheduled Transaction via the connected wallet.
   * Call this after ScheduleRelease has been created on the backend.
   * Returns the transaction ID of the ScheduleSign transaction.
   *
   * When the buyer's signature is the second of the 2-of-3 threshold keys,
   * Hedera automatically executes the inner (release) transaction.
   */
  async function signSchedule(scheduleIdStr) {
    const signer = getConnector().signers?.[0];
    if (!signer) throw new Error('No wallet connected');

    const tx = await new ScheduleSignTransaction()
      .setScheduleId(ScheduleId.fromString(scheduleIdStr))
      .setNodeAccountIds([new AccountId(3)])
      .freezeWithSigner(signer);

    const response = await tx.executeWithSigner(signer);

    // getReceipt throws for non-SUCCESS statuses, but some SDK/wallet combinations
    // silently return NO_NEW_VALID_SIGNATURES without throwing. Check explicitly.
    const receipt = await response.getReceipt(receiptClient);
    const statusStr = receipt?.status?.toString();
    if (statusStr && statusStr !== 'SUCCESS' && statusStr !== 'SCHEDULE_ALREADY_EXECUTED') {
      throw new Error(`Schedule signing rejected by Hedera: ${statusStr}. Your wallet key may not match the escrow — try re-linking your wallet.`);
    }

    return response.transactionId.toString();
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

    const c       = getConnector();
    const fromId  = AccountId.fromString(fromAccountIdStr);
    const signer  = c.getSigner(fromId);
    const tokenId = TokenId.fromString(USDC_TOKEN);

    // Ensure the sender's account is associated with the USDC token.
    await ensureTokenAssociated(fromAccountIdStr, USDC_TOKEN);

    // USDC has 6 decimal places: 1.00 USDC = 1_000_000 units
    const units = Math.round(amountUSDC * 1_000_000);

    // freezeWithSigner requires at least one node account ID on the transaction.
    // Node 0.0.3 is always a valid entry point on both testnet and mainnet.
    const tx = await new TransferTransaction()
      .setNodeAccountIds([new AccountId(3)])
      .addTokenTransfer(tokenId, fromId, -units)
      .addTokenTransfer(tokenId, AccountId.fromString(toAccountIdStr), units)
      .freezeWithSigner(signer);

    const response = await tx.executeWithSigner(signer);

    // Verify the transaction actually succeeded on-chain.
    // getReceipt throws a StatusError for any non-SUCCESS status
    // (e.g. INSUFFICIENT_TOKEN_BALANCE, USER_CANCELLED).
    await response.getReceipt(receiptClient);

    return response.transactionId.toString();
  }

  return (
    <WalletContext.Provider value={{ accountId, isConnected, connecting, connect, disconnect, transferHBAR, transferUSDC, ensureTokenAssociated, signSchedule }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
