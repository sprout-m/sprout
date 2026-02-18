import { useState } from 'react';

export default function RequestAccessModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [ndaChecked, setNdaChecked] = useState(false);
  const [signature, setSignature] = useState('');
  const [proofMethod, setProofMethod] = useState('deposit');
  const [proofAmountUSDC, setProofAmountUSDC] = useState(500);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Request Access</h3>
        <p className="muted">Complete NDA and proof-of-funds to unlock private data room access.</p>

        {step === 1 && (
          <section className="step-section">
            <h4>Step 1 - NDA</h4>
            <div className="nda-preview">
              <p>Mutual NDA summary: no disclosure, no outreach to employees/customers, no reverse engineering.</p>
              <p>Term: 24 months. Jurisdiction: Delaware. Electronic signatures accepted.</p>
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
            <div className="actions-row">
              <button className="ghost" onClick={() => setStep(1)}>
                Back
              </button>
              <button onClick={() => setStep(3)}>Continue</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="step-section">
            <h4>Step 3 - Submit</h4>
            <p className="callout">Status after submit: Pending seller approval.</p>
            <ul>
              <li>NDA signed: {ndaChecked ? 'Yes' : 'No'}</li>
              <li>PoF method: {proofMethod}</li>
              <li>PoF amount: {proofAmountUSDC} USDC</li>
            </ul>
            <div className="actions-row">
              <button className="ghost" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                onClick={() => {
                  onSubmit({ ndaSigned: true, proofMethod, proofAmountUSDC: Number(proofAmountUSDC) });
                  onClose();
                }}
              >
                Submit Request
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
