'use client';

import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

export function ChangeRequestModal({
  coinName,
  open,
  onClose,
}: {
  coinName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);

  const close = useCallback(() => {
    setSubmitted(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [close, open]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (!open) return null;

  return (
    <div className="change-modal-backdrop" role="presentation" onMouseDown={close}>
      <section
        className="change-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="change-modal-close" onClick={close} aria-label="Close request form">
          <X aria-hidden="true" />
        </button>
        {submitted ? (
          <div className="change-request-success">
            <span>
              <Check aria-hidden="true" />
            </span>
            <small>REQUEST RECEIVED</small>
            <h2>Thanks for helping us improve the listing.</h2>
            <p>We&apos;ll review the requested changes before updating {coinName}.</p>
            <button onClick={close}>Done</button>
          </div>
        ) : (
          <>
            <div className="change-modal-heading">
              <small>LISTING CORRECTION</small>
              <h2 id="change-modal-title">Request a change</h2>
              <p>
                Tell us what should be updated on <b>{coinName}</b>. All changes are reviewed before
                publishing.
              </p>
            </div>
            <form className="change-request-form" onSubmit={submit}>
              <label>
                <span>What needs changing?</span>
                <select name="changeType" required defaultValue="">
                  <option value="" disabled>
                    Select a change type
                  </option>
                  <option>Coin information</option>
                  <option>Website or social link</option>
                  <option>Logo or branding</option>
                  <option>Chain or contract address</option>
                  <option>Audit or KYC information</option>
                  <option>Report duplicate or incorrect listing</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                <span>Requested changes</span>
                <textarea
                  name="requestedChanges"
                  required
                  minLength={10}
                  placeholder="Describe what is incorrect and what it should say instead."
                />
              </label>
              <label>
                <span>
                  Supporting link <i>Optional</i>
                </span>
                <input name="evidenceUrl" type="url" placeholder="https://" />
              </label>
              <label>
                <span>Contact email</span>
                <input name="email" type="email" required placeholder="you@example.com" />
              </label>
              <p className="change-form-note">
                Submitting a request does not guarantee that the listing will be changed.
              </p>
              <div className="change-form-actions">
                <button type="button" onClick={close}>
                  Cancel
                </button>
                <button type="submit">Submit request</button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
