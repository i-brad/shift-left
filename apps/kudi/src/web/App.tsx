import { Button } from '@shift-left/ui';
import { useCallback, useEffect, useState } from 'react';
import { api as realApi, type Api, type CardState, type Me, type Transfer } from './api';
import { CardPanel } from './components/CardPanel';
import { BalanceCard } from './components/BalanceCard';
import { LoginForm } from './components/LoginForm';
import { TransactionList } from './components/TransactionList';
import { TransferForm } from './components/TransferForm';

export function App({ api = realApi }: { api?: Api }) {
  const [me, setMe] = useState<Me | null>(null);
  const [history, setHistory] = useState<Transfer[]>([]);
  const [card, setCard] = useState<CardState>('active');
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [m, h, c] = await Promise.all([api.me(), api.history(), api.card()]);
      setMe(m);
      setHistory(h);
      setCard(c.state);
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
            <BalanceCard name={me.name} balance={me.balance} tier={me.tier} />
            <TransferForm
              onSend={async (to, amount, express) => {
                const res = await api.send(to, amount, express);
                await refresh();
                return res;
              }}
            />
            <CardPanel
              state={card}
              onAction={async (a) => {
                const res = await api.cardAction(a);
                setCard(res.state);
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
