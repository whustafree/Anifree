import { useEffect, useState } from 'react';
import './Toast.css';

interface ToastMsg { id: number; text: string; type: 'success'|'error'|'info'; }
let _setToasts: ((fn: (t: ToastMsg[]) => ToastMsg[]) => void) | null = null;

export function toast(text: string, type: 'success'|'error'|'info' = 'info') {
  _setToasts?.(prev => [...prev, { id: Date.now(), text, type }].slice(-4));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  useEffect(() => { _setToasts = setToasts; return () => { _setToasts = null; }; }, []);

  const remove = (id: number) => setToasts(p => p.filter(t => t.id !== id));

  useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => remove(toasts[0].id), 3500);
    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`} onClick={() => remove(t.id)}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
