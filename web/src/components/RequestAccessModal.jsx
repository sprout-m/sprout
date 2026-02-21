import { useState } from 'react';
import { useWallet } from '../context/WalletContext';

const POF_ACCOUNT = import.meta.env.VITE_HEDERA_POF_ACCOUNT_ID || '';

export default function RequestAccessModal({ onClose, onSubmit }) {
  const { isConnected, accountId, connecting, connect, transferUSDC } = useWallet();

  const [step, setStep] = useState(1);
  const [ndaChecked, setNdaChecked] = useState(false);
  const [signature, setSignature] = useState('');
  const [proofMethod, setProofMethod] = useState('deposit');
  const [proofAmountUSDC, setProofAmountUSDC] = useState(500);

  // PoF deposit state
  const [depositing, setDepositing] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [pofTxId, setPofTxId] = useState('');

  // For deposit method: sign the tx AND submit the access request in one step.
  // The user shouldn't have to click a second "Submit" button after HashPack confirms.
  async function handlePoFDeposit() {
    setDepositError('');
    setDepositing(true);
    try {
      if (!import.meta.env.VITE_HEDERA_USDC_TOKEN_ID) {
        throw new Error('USDC token ID is not configured (set VITE_HEDERA_USDC_TOKEN_ID).');
      }
      if (!POF_ACCOUNT) {
        throw new Error('PoF holding account is not configured (set VITE_HEDERA_POF_ACCOUNT_ID).');
      }

      let fromAccount = accountId;
      if (!isConnected) {
        fromAccount = await connect();
        if (!fromAccount) throw new Error('No wallet connected. Please pair HashPack and try again.');
      }

      // Sign and broadcast — HashPack modal opens here.
      const txId = await transferUSDC(fromAccount, POF_ACCOUNT, Number(proofAmountUSDC));

      // Tx confirmed on-chain — immediately submit the access request.
      await onSubmit({ ndaSigned: true, proofMethod, proofAmountUSDC: Number(proofAmountUSDC), proofTxId: txId });

      setPofTxId(txId);
      setStep(3); // confirmation screen
    } catch (err) {
      setDepositError(err.message || 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  }

  // For wallet attestation: submit from the review step.
  async function handleWalletSubmit() {
    setDepositError('');
    setDepositing(true);
    try {
      await onSubmit({ ndaSigned: true, proofMethod, proofAmountUSDC: Number(proofAmountUSDC), proofTxId: null });
      onClose();
    } catch (err) {
      setDepositError(err.message || 'Submission failed');
    } finally {
      setDepositing(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Request Access</h3>
        <p className="muted">Complete NDA and proof-of-funds to unlock private document access.</p>

        {step === 1 && (
          <section className="step-section">
            <h4>Step 1 - NDA</h4>
            <div className="nda-preview">
              <p><strong>Mutual NDA Summary</strong></p>
              <p>
                By requesting access, both parties agree that all non-public business, financial, legal,
                technical, and customer information shared in Meridian is Confidential Information.
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.25rem' }}>
                <li>Use is limited to evaluating a potential acquisition of this listing.</li>
                <li>No disclosure to third parties except advisors under equivalent confidentiality duties.</li>
                <li>No contacting employees, contractors, customers, or vendors without written seller consent.</li>
                <li>No reverse engineering, scraping, or republishing data-room materials.</li>
                <li>No circumvention of Meridian to negotiate directly with protected counterparties.</li>
                <li>Reasonable safeguards must be used to prevent unauthorized access or sharing.</li>
                <li>On request or termination of discussions, confidential materials must be returned or destroyed.</li>
                <li>Breach may result in access revocation, account restrictions, and injunctive/equitable relief.</li>
              </ul>
              <p>
                Exclusions: public information, independently developed information, or information lawfully
                received from third parties not under confidentiality restrictions.
              </p>
              <p>
                Term: 24 months from signature. Governing law: Delaware. Electronic signatures and typed names
                are binding and enforceable.
              </p>
            </div>
            <label className="check-row">
              <input type="checkbox" checked={ndaChecked} onChange={(e) => setNdaChecked(e.target.checked)} />
              I agree to the NDA terms.
            </label>
            <input
              type="text"
              placeholder="Typed signature or wallet alias"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
            <button disabled={!ndaChecked || !signature} onClick={() => setStep(2)}>
              Continue
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="step-section">
            <h4>Step 2 - Proof of Funds</h4>
            <div className="radio-grid">
              <label>
                <input
                  type="radio"
                  checked={proofMethod === 'deposit'}
                  onChange={() => setProofMethod('deposit')}
                />
                Deposit PoF (lock USDC)
              </label>
              <label>
                <input
                  type="radio"
                  checked={proofMethod === 'wallet'}
                  onChange={() => setProofMethod('wallet')}
                />
                Wallet attestation
              </label>
            </div>
            <input
              type="number"
              min="100"
              step="100"
              value={proofAmountUSDC}
              onChange={(e) => setProofAmountUSDC(e.target.value)}
            />

            {proofMethod === 'deposit' && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                {Number(proofAmountUSDC).toLocaleString()} USDC will be transferred to the platform escrow account
                via HashPack. Funds are returned when the request is resolved.
              </p>
            )}

            {depositError && (
              <p className="err-msg">
                {depositError}
              </p>
            )}

            <div className="actions-row">
              <button className="ghost" onClick={() => setStep(1)}>
                Back
              </button>
              {proofMethod === 'deposit' ? (
                <button onClick={handlePoFDeposit} disabled={depositing || connecting}>
                  {depositing || connecting ? 'Waiting for HashPack…' : 'Sign & Lock USDC'}
                </button>
              ) : (
                <button onClick={() => setStep(3)}>Continue</button>
              )}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="step-section">
            {pofTxId ? (
              <>
                <h4>Deposit Confirmed</h4>
                <p className="callout">
                  Your USDC deposit was confirmed on-chain and your access request has been submitted.
                  The seller will review your request shortly.
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', wordBreak: 'break-all', marginTop: '0.5rem' }}>
                  Tx: <code>{pofTxId}</code>
                </p>
                <button onClick={onClose} style={{ marginTop: '0.75rem', width: '100%' }}>Done</button>
              </>
            ) : (
              <>
                <h4>Step 3 - Submit</h4>
                <p className="callout">Status after submit: Pending seller approval.</p>
                <ul>
                  <li>NDA signed: {ndaChecked ? 'Yes' : 'No'}</li>
                  <li>PoF method: {proofMethod}</li>
                  <li>PoF amount: {Number(proofAmountUSDC).toLocaleString()} USDC</li>
                </ul>
                {depositError && (
                  <p className="err-msg">
                    {depositError}
                  </p>
                )}
                <div className="actions-row">
                  <button className="ghost" onClick={() => setStep(2)}>Back</button>
                  <button onClick={handleWalletSubmit} disabled={depositing}>
                    {depositing ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
