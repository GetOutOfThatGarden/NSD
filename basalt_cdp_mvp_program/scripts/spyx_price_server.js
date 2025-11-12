// Lightweight SPYX price server (ESM) for local development
// Exposes GET /api/spyx-price?address=<mintAddress>
// - Reads COINGECKO_API_KEY from .env (project root or parent)
// - Uses CoinGecko contract endpoint on Solana

import http from 'http';
import url from 'url';
import fs from 'fs';
import path from 'path';

const DEFAULT_MINT = 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W'; // SP500 xStock (SPYx) on Solana
const PORT = process.env.PRICE_SERVER_PORT ? parseInt(process.env.PRICE_SERVER_PORT, 10) : 3001;

function readEnvFile(envPath) {
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

function loadApiKey() {
  const cwdEnv = readEnvFile(path.resolve(process.cwd(), '.env'));
  const parentEnv = readEnvFile(path.resolve(process.cwd(), '..', '.env'));
  return process.env.COINGECKO_API_KEY || cwdEnv.COINGECKO_API_KEY || parentEnv.COINGECKO_API_KEY || '';
}

async function fetchSpyxData(contractAddress) {
  const apiKey = loadApiKey();
  const proBase = 'https://pro-api.coingecko.com/api/v3';
  const publicBase = 'https://api.coingecko.com/api/v3';

  async function request(base) {
    const endpoint = `${base}/coins/solana/contract/${contractAddress}`;
    const headers = { 'Accept': 'application/json' };
    if (base === proBase && apiKey) {
      headers['x-cg-pro-api-key'] = apiKey;
    }
    const resp = await fetch(endpoint, { headers });
    if (!resp.ok) {
      const raw = await resp.text();
      let cgErr = null;
      try { cgErr = JSON.parse(raw); } catch { cgErr = { raw }; }
      const err = new Error(`CoinGecko error ${resp.status}`);
      // attach details for decision-making
      err.cgErr = cgErr;
      err.status = resp.status;
      err.base = base;
      throw err;
    }
    return await resp.json();
  }

  // Prefer Public first (no key required), then fallback to Pro if required
  let json;
  try {
    json = await request(publicBase);
  } catch (e) {
    const code = (e?.cgErr?.error_code ?? e?.cgErr?.status?.error_code);
    const message = (e?.cgErr?.error_message ?? e?.cgErr?.status?.error_message ?? e?.cgErr?.raw ?? '');
    // If Public indicates Pro is required (10010 or message mentions Pro), retry on Pro
    if (code === 10010 || /Pro API key/i.test(message) || e.status === 403) {
      json = await request(proBase);
    } else {
      // If we started on Pro and saw Demo hints, retry on Public
      if (e.base === proBase && (code === 10011 || /Demo API key/i.test(message) || /change your root URL/i.test(message))) {
        json = await request(publicBase);
      } else {
        throw e;
      }
    }
  }

  const name = json.name || 'SPYx';
  const symbol = json.symbol || 'spyx';
  const market = json.market_data || {};
  const current = market.current_price || {};
  const usd = typeof current.usd === 'number' ? current.usd : null;
  const sol = typeof current.sol === 'number' ? current.sol : null;
  const decimals = json.detail_platforms?.solana?.decimal_place ?? 8;
  const lastUpdated = json.last_updated || new Date().toISOString();

  if (usd === null) {
    throw new Error('USD price missing in CoinGecko response');
  }

  return {
    name,
    symbol,
    address: contractAddress,
    decimals,
    priceUSD: usd,
    priceSOL: sol,
    lastUpdated,
    source: json?.links ? 'coingecko:public' : 'coingecko',
  };
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new url.URL(req.url, `http://${req.headers.host}`);
  const pathname = reqUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/api/spyx-price') {
    const contract = reqUrl.searchParams.get('address') || DEFAULT_MINT;
    try {
      const data = await fetchSpyxData(contract);
      sendJson(res, 200, data);
    } catch (err) {
      sendJson(res, 500, {
        error: err?.message || 'Failed to fetch SPYX price',
      });
    }
    return;
  }

  // 404 fallback
  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`[SPYX Price Server] Listening on http://localhost:${PORT}`);
});