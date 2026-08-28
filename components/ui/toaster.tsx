'use client';

import { useEffect, useState } from 'react';

type ToastTone = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
};

type ToastEvent = {
  tone?: ToastTone;
  title: string;
  message?: string;
};

const toastMessages: Record<string, ToastEvent> = {
  'signed-out': {
    tone: 'success',
    title: 'Logged out',
    message: 'You have been safely signed out.',
  },
};

export function showToast(toast: ToastEvent) {
  window.dispatchEvent(new CustomEvent<ToastEvent>('spooky-toast', { detail: toast }));
}

export function queueToast(toast: ToastEvent) {
  window.sessionStorage.setItem('spooky-toast', JSON.stringify(toast));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function pushToast(event: Event) {
      const detail = (event as CustomEvent<ToastEvent>).detail;
      const toast = {
        id: Date.now(),
        tone: detail.tone || 'info',
        title: detail.title,
        message: detail.message,
      };

      setToasts((current) => [...current, toast].slice(-3));
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 4200);
    }

    window.addEventListener('spooky-toast', pushToast);

    const storedToast = window.sessionStorage.getItem('spooky-toast');
    if (storedToast) {
      window.sessionStorage.removeItem('spooky-toast');
      try {
        window.setTimeout(() => showToast(JSON.parse(storedToast) as ToastEvent), 150);
      } catch {
        window.setTimeout(() => showToast(toastMessages['signed-out']), 150);
      }
    }

    const params = new URLSearchParams(window.location.search);
    const queuedToast = params.get('toast');
    if (queuedToast && toastMessages[queuedToast]) {
      window.setTimeout(() => showToast(toastMessages[queuedToast]), 150);
      params.delete('toast');
      const cleanUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
      window.history.replaceState(null, '', cleanUrl);
    }

    return () => window.removeEventListener('spooky-toast', pushToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div className={`toast toast-${toast.tone}`} key={toast.id}>
          <span>{toast.tone === 'success' ? '✓' : toast.tone === 'error' ? '!' : 'i'}</span>
          <div>
            <b>{toast.title}</b>
            {toast.message && <p>{toast.message}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
