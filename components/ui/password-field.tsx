'use client';

import { useState } from 'react';

export function PasswordField({
  name,
  placeholder,
  autoComplete,
  minLength = 8,
  required = true,
}: {
  name: string;
  placeholder?: string;
  autoComplete: string;
  minLength?: number;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="auth-password-wrap">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
      />
      <button
        className="auth-password-toggle"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>
    </span>
  );
}

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5.2c5.7 0 9.4 5.6 9.6 5.8.4.6.4 1.4 0 2-.2.2-3.9 5.8-9.6 5.8S2.6 13.2 2.4 13c-.4-.6-.4-1.4 0-2 .2-.2 3.9-5.8 9.6-5.8Zm0 2C7.6 7.2 4.5 11.4 4 12c.5.6 3.6 4.8 8 4.8s7.5-4.2 8-4.8c-.5-.6-3.6-4.8-8-4.8Zm0 1.6a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Zm0 2a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.3 3.1 21 19.8l-1.4 1.4-3-3A11.4 11.4 0 0 1 12 19c-5.7 0-9.4-5.6-9.6-5.8-.4-.6-.4-1.4 0-2a17.4 17.4 0 0 1 4-3.9L2.9 4.5l1.4-1.4Zm3.5 5.6A15.4 15.4 0 0 0 4 12c.5.6 3.6 4.8 8 4.8 1 0 2-.2 2.8-.5l-1.7-1.7A3.2 3.2 0 0 1 9.4 11L7.8 8.7Zm3.4 3.4 1.7 1.7a1.2 1.2 0 0 0-1.7-1.7ZM12 5.2c5.7 0 9.4 5.6 9.6 5.8.4.6.4 1.4 0 2a15 15 0 0 1-2.5 2.8l-1.4-1.4A13.7 13.7 0 0 0 20 12c-.5-.6-3.6-4.8-8-4.8-.7 0-1.4.1-2 .3L8.4 5.9c1.1-.5 2.3-.7 3.6-.7Z" />
    </svg>
  );
}
