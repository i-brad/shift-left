import { serve } from '@hono/node-server';
import { bugsFrom, parseBugs } from '../bugs';
import { createApp } from './app';
import { openDb } from './db';

const port = Number(process.env.KUDI_API_PORT ?? 8787);
const bugs = bugsFrom(parseBugs(process.env.KUDI_BUGS));
const db = openDb(process.env.KUDI_DB ?? 'kudi.db');
const latencyMs = Number(process.env.KUDI_LATENCY ?? 0) || 0;
const app = createApp({ db, bugs, latencyMs, testRoutes: process.env.NODE_ENV !== 'production' });

serve({ fetch: app.fetch, port }, () => {
  console.log(`Kudi API on http://localhost:${port}/api`);
  if (latencyMs) console.log(`Every response is delayed ${latencyMs} ms (KUDI_LATENCY)`);
  console.log(bugs.list.length ? `Planted bugs ON: ${bugs.list.join(', ')}` : 'No planted bugs (KUDI_BUGS is empty)');
});
