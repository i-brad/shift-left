import { Button } from '@shift-left/ui';
import { useCallback, useEffect, useState } from 'react';
import { api as realApi, type Api, type Me, type Transfer } from './api';
import { BalanceCard } from './components/BalanceCard';
import { LoginForm } from './components/LoginForm';
import { TransactionList } from './components/TransactionList';
import { TransferForm } from './components/TransferForm';

export function App({ api = realApi }: { api?: Api }) {
  const [me, setMe] = useState<Me | null>(null);
  const [history, setHistory] = useState<Transfer[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [m, h] = await Promise.all([api.me(), api.history()]);
      setMe(m);
      setHistory(h);
    } catch {
      setMe(null);
    } finally {
      setReady(true);
    }
  }, [api]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!ready) return null;

  return (
    <>
      <header className="kudi-top">
        <span className="logo">kudi</span>
        {me && (
          <Button
            onClick={async () => {
              await api.logout();
              setMe(null);
            }}
          >
            Log out
          </Button>
        )}
      </header>
      <main className="kudi">
        {me ? (
          <>
            <BalanceCard name={me.name} balance={me.balance} />
            <TransferForm
              onSend={async (to, amount) => {
                await api.send(to, amount);
                await refresh();
              }}
            />
            <TransactionList items={history} />
          </>
        ) : (
          <LoginForm
            onLogin={async (email, password) => {
              await api.login(email, password);
              await refresh();
            }}
          />
        )}
      </main>
    </>
  );
}
