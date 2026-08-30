import { Globe } from 'lucide-react';

export function AuthProviderButtons({
  onGoogle,
  disabled = false,
}: {
  onGoogle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="auth-providers">
      <button type="button" onClick={onGoogle} disabled={disabled}>
        <Globe aria-hidden="true" /> Continue with Google
      </button>
    </div>
  );
}
