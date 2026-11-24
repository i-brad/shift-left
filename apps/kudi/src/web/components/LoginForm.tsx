import { Button } from '@shift-left/ui';
import { useState, type FormEvent } from 'react';
import { ErrorBanner } from './ErrorBanner';

export function LoginForm({ onLogin }: { onLogin: (email: string, password: string) => Promise<unknown> }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch {
      setError('Email or password is incorrect');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card login" onSubmit={submit} aria-labelledby="login-title">
      <h1 id="login-title">Log in to Kudi</h1>
      <ErrorBanner message={error} />
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" variant="primary" disabled={busy}>
        Log in
      </Button>
      <p className="hint">Test accounts are listed in SPEC.md.</p>
    </form>
  );
}
