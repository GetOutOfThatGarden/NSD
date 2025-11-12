// Fetch SPYX price from CoinGecko Pro API using the API key in .env
// Usage:
//   node scripts/fetch_spyx_price.js --address XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W
//   node scripts/fetch_spyx_price.js            (defaults to SPYX Solana mint)

const fs = require('fs');
const path = require('path');
const https = require('https');

// Default SPYX Solana mint address
const DEFAULT_ADDRESS = 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W';

function parseArgs() {
  const args = process.argv.slice(2);
  let address = DEFAULT_ADDRESS;
  for (const arg of args) {
    if (arg.startsWith('--address=')) {
      address = arg.split('=')[1].trim();
    } else if (!arg.startsWith('--')) {
      address = arg.trim();
    }
  }
  return { address };
}

function loadEnv(envPath) {
  try {
    const filePath = envPath || path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
  } catch (err) {
    console.warn('Warning: Failed to load .env:', err.message);
  }
}

function requestJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = new URL(url);
    options.headers = {
      'Accept': 'application/json',
      ...headers,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(json)}`));
          }
          resolve(json);
        } catch (e) {
          reject(new Error('Failed to parse JSON response: ' + e.message));
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function fetchPrice(address, apiKey) {
  const base = 'https://pro-api.coingecko.com/api/v3';
  const headers = apiKey ? { 'x-cg-pro-api-key': apiKey } : {};

  // 1) Try simple token price (fast)
  const simpleUrl = `${base}/simple/token_price/solana?contract_addresses=${address}&vs_currencies=usd,sol`;
  try {
    const simple = await requestJson(simpleUrl, headers);
    const entry = simple[address] || simple[address.toLowerCase()] || simple[address.toUpperCase()];
    if (entry && (entry.usd !== undefined || entry.sol !== undefined)) {
      return {
        source: 'simple',
        usd: entry.usd,
        sol: entry.sol,
      };
    }
  } catch (err) {
    console.warn('Simple price lookup failed:', err.message);
  }

  // 2) Fallback to full coin contract endpoint
  const fullUrl = `${base}/coins/solana/contract/${address}`;
  try {
    const full = await requestJson(fullUrl, headers);
    const md = full.market_data && full.market_data.current_price ? full.market_data.current_price : {};
    const image = full.image || {};
    return {
      source: 'contract',
      usd: md.usd,
      sol: md.sol,
      name: full.name,
      symbol: full.symbol,
      image_small: image.small,
    };
  } catch (err) {
    throw new Error('Contract price lookup failed: ' + err.message);
  }
}

async function main() {
  // Load .env from project root
  loadEnv();
  const apiKey = process.env.COINGECKO_API_KEY;
  if (!apiKey) {
    console.error('Error: COINGECKO_API_KEY not found in environment (.env).');
    process.exit(1);
  }

  const { address } = parseArgs();
  console.log(`Fetching price for Solana token: ${address} ...`);
  try {
    const price = await fetchPrice(address, apiKey);
    const usdStr = price.usd !== undefined ? `$${Number(price.usd).toLocaleString()}` : 'N/A';
    const solStr = price.sol !== undefined ? `${Number(price.sol).toLocaleString()} SOL` : 'N/A';
    console.log('--- CoinGecko Price ---');
    if (price.name) console.log(`Name: ${price.name}`);
    if (price.symbol) console.log(`Symbol: ${price.symbol}`);
    console.log(`USD: ${usdStr}`);
    console.log(`SOL: ${solStr}`);
    console.log(`Source: ${price.source}`);
    if (price.image_small) console.log(`Image: ${price.image_small}`);
  } catch (err) {
    console.error('Failed to fetch price:', err.message);
    process.exit(1);
  }
}

main();