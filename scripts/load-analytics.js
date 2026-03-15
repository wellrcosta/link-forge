#!/usr/bin/env node

/*
 * Load generator for LinkForge redirect analytics.
 * Sends concurrent GET requests to /:slug with varied headers (UA, IP, referer, locale).
 */

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];

    if (!item.startsWith('--')) continue;

    const [rawKey, inlineValue] = item.slice(2).split('=');
    const key = rawKey.trim();

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }

    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = 'true';
      continue;
    }

    args[key] = next;
    i += 1;
  }

  return args;
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomIp() {
  // Keep first octet away from reserved 0/127 ranges.
  const a = Math.floor(Math.random() * 223) + 1;
  const b = Math.floor(Math.random() * 256);
  const c = Math.floor(Math.random() * 256);
  const d = Math.floor(Math.random() * 256);
  return `${a}.${b}.${c}.${d}`;
}

function sleep(ms) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.165 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/123.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/122.0.2365.92 Chrome/122.0.0.0 Safari/537.36',
];

const referers = [
  'https://google.com/',
  'https://bing.com/',
  'https://duckduckgo.com/',
  'https://t.co/',
  'https://www.linkedin.com/',
  'https://www.instagram.com/',
  'https://news.ycombinator.com/',
  'https://www.reddit.com/',
];

const locales = [
  'pt-BR,pt;q=0.9,en;q=0.8',
  'en-US,en;q=0.9',
  'es-ES,es;q=0.9,en;q=0.8',
  'fr-FR,fr;q=0.9,en;q=0.8',
  'de-DE,de;q=0.9,en;q=0.8',
];

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const baseUrl = String(args['base-url'] || process.env.APP_BASE_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/+$/, '');

  const rawSlugs = String(args.slugs || '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean);

  if (rawSlugs.length === 0) {
    console.error('Missing --slugs. Example: pnpm analytics:load -- --slugs my-link,my-links --requests 500 --concurrency 50');
    process.exit(1);
  }

  const totalRequests = Math.max(1, toInt(args.requests, 500));
  const concurrency = Math.max(1, Math.min(toInt(args.concurrency, 50), totalRequests));
  const delayMs = Math.max(0, toInt(args['delay-ms'], 0));
  const timeoutMs = Math.max(500, toInt(args['timeout-ms'], 5000));
  const verbose = String(args.verbose || 'false') === 'true';

  let sent = 0;
  let completed = 0;
  const statusCount = new Map();
  const errorCount = new Map();

  const startedAt = Date.now();

  async function worker(workerId) {
    while (true) {
      const current = sent;
      if (current >= totalRequests) return;
      sent += 1;

      const slug = randomFrom(rawSlugs);
      const targetUrl = `${baseUrl}/${encodeURIComponent(slug)}`;
      const userAgent = randomFrom(userAgents);
      const ip = randomIp();

      try {
        const response = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'user-agent': userAgent,
            referer: randomFrom(referers),
            'accept-language': randomFrom(locales),
            'x-forwarded-for': ip,
            'x-real-ip': ip,
          },
          signal: AbortSignal.timeout(timeoutMs),
        });

        const key = String(response.status);
        statusCount.set(key, (statusCount.get(key) || 0) + 1);

        if (verbose) {
          const location = response.headers.get('location');
          console.log(`[worker ${workerId}] ${response.status} ${slug} -> ${location || 'no-location'}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errorCount.set(message, (errorCount.get(message) || 0) + 1);
        if (verbose) {
          console.error(`[worker ${workerId}] error on ${slug}: ${message}`);
        }
      }

      completed += 1;

      if (!verbose && completed % 50 === 0) {
        console.log(`Progress: ${completed}/${totalRequests}`);
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  console.log('Starting analytics load...');
  console.log(`Base URL     : ${baseUrl}`);
  console.log(`Slugs        : ${rawSlugs.join(', ')}`);
  console.log(`Requests     : ${totalRequests}`);
  console.log(`Concurrency  : ${concurrency}`);
  console.log(`Timeout (ms) : ${timeoutMs}`);
  console.log(`Delay (ms)   : ${delayMs}`);

  const workers = [];
  for (let i = 0; i < concurrency; i += 1) {
    workers.push(worker(i + 1));
  }

  await Promise.all(workers);

  const durationMs = Date.now() - startedAt;
  const rps = (completed / Math.max(durationMs, 1)) * 1000;

  console.log('\n=== Load Test Summary ===');
  console.log(`Completed: ${completed}/${totalRequests}`);
  console.log(`Duration : ${durationMs} ms`);
  console.log(`Rate     : ${rps.toFixed(2)} req/s`);

  console.log('\nStatus codes:');
  if (statusCount.size === 0) {
    console.log('- none');
  } else {
    for (const [status, count] of [...statusCount.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
      console.log(`- ${status}: ${count}`);
    }
  }

  if (errorCount.size > 0) {
    console.log('\nErrors:');
    for (const [message, count] of errorCount.entries()) {
      console.log(`- ${count}x ${message}`);
    }
  }

  console.log('\nDone. Open /analytics/links/:id in Swagger to inspect click aggregation.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
