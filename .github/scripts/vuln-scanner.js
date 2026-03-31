#!/usr/bin/env node

/**
 * vuln-scanner.js   (CommonJS)
 * ─────────────────────────────────────────────────────────────────
 * A zero-dependency* Node.js vulnerability scanner for npm projects.
 * Uses OSV.dev (free, no auth) as primary CVE source.
 *
 * FEATURES:
 *   • Full transitive dependency graph from package-lock.json
 *   • Batch CVE lookups via OSV.dev API (no API key required)
 *   • Full vuln detail enrichment (severity, fix versions) via OSV individual endpoints
 *   • Root → vulnerable package path tracing
 *   • Root-cause parent detection
 *   • 6 output formats: full (default), table, list, csv, markdown, json
 *   • Filters: --min-severity, --fix-only, --no-dev
 *   • CI-friendly exit codes (1 = CRITICAL/HIGH found, 0 = clean)
 *
 * REQUIREMENTS:
 *   Node.js >= 14  (optional chaining, async/await, built-ins only)
 *   npm install    (generates package-lock.json before scanning)
 *
 * ─── RUNNING THIS SCRIPT ────────────────────────────────────────
 *
 *   This file uses CommonJS (require).  How to run it depends on
 *   whether your project's package.json has "type": "module":
 *
 *   A) Project has NO "type": "module"  (default / plain CJS project)
 *      Works as-is with the .js extension:
 *
 *        node vuln-scanner.js
 *
 *   B) Project HAS "type": "module"  (ESM project)
 *      Node treats all .js files as ESM, so `require` will throw.
 *      Two options — pick whichever you prefer:
 *
 *      Option 1 — rename the file to .cjs  (one-time, recommended):
 *        mv vuln-scanner.js vuln-scanner.cjs
 *        node vuln-scanner.cjs
 *
 *        The .cjs extension tells Node "always CommonJS" regardless
 *        of any package.json setting, so the file becomes truly
 *        portable — drop it into any project and it just works.
 *
 *      Option 2 — keep the .js name, run via node -e  (no rename):
 *        node -e "import('./vuln-scanner.js')"
 *        ← won't work either since the file is CJS, not ESM.
 *
 *        There is NO node flag (e.g. --commonjs, --cjs) that forces
 *        a .js file to be treated as CommonJS at runtime.
 *        --input-type=commonjs only works when piping via stdin:
 *          node --input-type=commonjs < vuln-scanner.js
 *        …but that breaks process.argv so CLI flags won't work.
 *
 *        → Rename to .cjs.  It's a one-second change and the only
 *          clean solution when your project uses "type": "module".
 *
 * ─── USAGE ───────────────────────────────────────────────────────
 *
 *   # Scan project in the current directory
 *   node vuln-scanner.js
 *
 *   # Scan a specific lockfile
 *   node vuln-scanner.js path/to/package-lock.json
 *
 *   # ── Output formats ──────────────────────────────────────────
 *   # Default verbose output (full details per vuln)
 *   node vuln-scanner.js --format full
 *
 *   # Compact ASCII table
 *   node vuln-scanner.js --format table
 *
 *   # One-line-per-vuln bulleted list, grouped by severity
 *   node vuln-scanner.js --format list
 *
 *   # CSV (spreadsheet / import)
 *   node vuln-scanner.js --format csv
 *   node vuln-scanner.js --out report.csv        # auto-detected from extension
 *
 *   # GitHub-flavored Markdown
 *   node vuln-scanner.js --format markdown
 *   node vuln-scanner.js --out report.md         # auto-detected from extension
 *
 *   # Machine-readable JSON (backward-compat: --json still works)
 *   node vuln-scanner.js --format json
 *   node vuln-scanner.js --json
 *   node vuln-scanner.js --out report.json       # auto-detected from extension
 *
 *   # Write any format to a file
 *   node vuln-scanner.js --format table --out report.txt
 *
 *   # ── Filters ─────────────────────────────────────────────────
 *   # Show only HIGH and above
 *   node vuln-scanner.js --min-severity HIGH
 *
 *   # Show only vulns that have a known patch
 *   node vuln-scanner.js --fix-only
 *
 *   # Combine: critical + fix available, table format
 *   node vuln-scanner.js --min-severity CRITICAL --fix-only --format table
 *
 *   # Skip devDependencies (also: SKIP_DEV=1 env var for backward-compat)
 *   node vuln-scanner.js --no-dev
 *
 *   # Suppress progress output (useful when piping stdout)
 *   node vuln-scanner.js --quiet --format csv > report.csv
 *
 *   # CI — non-zero exit if CRITICAL or HIGH found
 *   node vuln-scanner.js || exit 1
 *
 * * Uses only Node built-ins — no npm install needed for the scanner itself.
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

// ─── Severity ordering (needed before CLI args) ───────────────────

const SEV_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };
const SEV_LEVELS = Object.keys(SEV_ORDER);

// ─── CLI args ────────────────────────────────────────────────────

const args = process.argv.slice(2);

function argVal(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}
function argFlag(flag) { return args.includes(flag); }

const outFile      = argVal('--out');
const rawFormat    = argVal('--format')?.toLowerCase() ?? null;
const minSevArg    = argVal('--min-severity')?.toUpperCase() ?? null;
const jsonMode     = argFlag('--json') || rawFormat === 'json'; // backward-compat

// Indices of value-consuming flags so we can skip their values when finding the lockfile
const valueFlagIndices = new Set();
['--out','--format','--min-severity'].forEach(f => {
  const i = args.indexOf(f);
  if (i !== -1) { valueFlagIndices.add(i); valueFlagIndices.add(i + 1); }
});
const lockArg  = args.find((a, i) => !a.startsWith('--') && !valueFlagIndices.has(i));
const lockPath = lockArg || path.join(process.cwd(), 'package-lock.json');

const noDev    = argFlag('--no-dev')  || process.env.SKIP_DEV === '1';
const fixOnly  = argFlag('--fix-only');
const quiet    = argFlag('--quiet');
const MIN_SEV  = minSevArg && SEV_ORDER[minSevArg] !== undefined ? minSevArg : null;

// Auto-detect format from --out file extension when --format is omitted
function detectFormat() {
  if (rawFormat) return rawFormat;
  if (jsonMode)  return 'json';
  if (outFile) {
    const ext = path.extname(outFile).toLowerCase();
    if (ext === '.json') return 'json';
    if (ext === '.csv')  return 'csv';
    if (ext === '.md')   return 'markdown';
  }
  return 'full';
}
const FORMAT = detectFormat();

// ─── Colours (disabled in non-tty / plain-text formats) ──────────

const useColor = !['json','csv','markdown'].includes(FORMAT);

const C = useColor ? {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  yellow:  '\x1b[33m',
  green:   '\x1b[32m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
} : {
  reset:'', bold:'', dim:'', red:'', yellow:'', green:'', cyan:'', magenta:''
};

const SEV_COLOR = {
  CRITICAL: C.red + C.bold,
  HIGH:     C.red,
  MEDIUM:   C.yellow,
  LOW:      C.green,
  UNKNOWN:  C.dim,
};

// ─── 1. Load & validate lockfile ─────────────────────────────────

function loadLockfile(filePath) {
  if (!fs.existsSync(filePath)) {
    fatal(`Cannot find lockfile: ${filePath}\nRun: npm install  (to generate package-lock.json)`);
  }
  const raw  = fs.readFileSync(filePath, 'utf8');
  const lock = JSON.parse(raw);
  if (!lock.lockfileVersion) {
    fatal('Unexpected lockfile format. Expected npm package-lock.json (v1/v2/v3).');
  }
  return lock;
}

// ─── 2. Build dependency graph ───────────────────────────────────
//
//  Works for lockfile v1 (dependencies), v2/v3 (packages).
//  Returns:
//    packages : Map<"name@version", { name, version, deps: Set<"name@version"> }>
//    roots    : Set<"name@version">  (direct dependencies of the project)

function buildGraph(lock) {
  const packages = new Map();
  const roots    = new Set();

  function ensureNode(name, version) {
    const key = `${name}@${version}`;
    if (!packages.has(key)) {
      packages.set(key, { name, version, key, deps: new Set() });
    }
    return packages.get(key);
  }

  // ── v2/v3 (flat "packages" map) ──────────────────────────────
  if (lock.packages) {
    // First pass: register all packages
    for (const [nodePath, meta] of Object.entries(lock.packages)) {
      if (nodePath === '') continue;
      if (meta.dev === true && noDev) continue;
      const name    = meta.name || nodePath.replace(/^.*node_modules\//, '');
      const version = meta.version || '0.0.0';
      ensureNode(name, version);
    }

    // Second pass: wire edges
    for (const [nodePath, meta] of Object.entries(lock.packages)) {
      if (nodePath === '') {
        // root → direct deps
        const allDirect = {
          ...((lock.packages['']?.dependencies)         || {}),
          ...((lock.packages['']?.devDependencies)      || {}),
          ...((lock.packages['']?.optionalDependencies) || {}),
        };
        for (const depName of Object.keys(allDirect)) {
          const installed = findInstalledVersion(lock.packages, depName, nodePath);
          if (installed) roots.add(`${depName}@${installed}`);
        }
        continue;
      }
      if (meta.dev === true && noDev) continue;

      const parentName    = meta.name || nodePath.replace(/^.*node_modules\//, '');
      const parentVersion = meta.version || '0.0.0';
      const parentNode    = ensureNode(parentName, parentVersion);

      const childDeps = { ...(meta.dependencies || {}), ...(meta.optionalDependencies || {}) };
      for (const depName of Object.keys(childDeps)) {
        const installed = findInstalledVersion(lock.packages, depName, nodePath);
        if (installed) {
          const childKey = `${depName}@${installed}`;
          ensureNode(depName, installed);
          parentNode.deps.add(childKey);
        }
      }
    }
  }

  // ── v1 (nested "dependencies" map) ───────────────────────────
  else if (lock.dependencies) {
    function walkV1(deps, parentKey) {
      for (const [name, meta] of Object.entries(deps)) {
        if (meta.dev && noDev) continue;
        const version = meta.version || '0.0.0';
        const node    = ensureNode(name, version);
        if (parentKey) {
          packages.get(parentKey)?.deps.add(node.key);
        } else {
          roots.add(node.key);
        }
        if (meta.dependencies) walkV1(meta.dependencies, node.key);
      }
    }
    walkV1(lock.dependencies, null);
  }

  return { packages, roots };
}

// Resolve which version of `depName` is actually installed for a given nodePath.
// Mimics npm's hoisting resolution: walk up the tree, prefer deepest match.
function findInstalledVersion(pkgMap, depName, fromPath) {
  const segments = fromPath.split('/node_modules/');
  for (let i = segments.length; i >= 0; i--) {
    const full = i === 0
      ? `node_modules/${depName}`
      : [...segments.slice(0, i), depName].join('/node_modules/');
    if (pkgMap[full]) return pkgMap[full].version || '0.0.0';
  }
  // fallback: first match anywhere in tree
  for (const [k, v] of Object.entries(pkgMap)) {
    if (k.endsWith(`/node_modules/${depName}`) || k === `node_modules/${depName}`) {
      return v.version || '0.0.0';
    }
  }
  return null;
}

// ─── 3. Flatten packages for OSV batch query ─────────────────────

function flattenPackages(packages) {
  const seen = new Map();
  for (const [, node] of packages.entries()) {
    const key = `${node.name}||${node.version}`;
    if (!seen.has(key)) {
      seen.set(key, { name: node.name, version: node.version, keys: [] });
    }
    seen.get(key).keys.push(node.key);
  }
  return [...seen.values()];
}

// ─── 4. OSV.dev batch query ──────────────────────────────────────

const OSV_HOST  = 'api.osv.dev';
const OSV_PATH  = '/v1/querybatch';
const BATCH_MAX = 1000; // OSV supports up to 1000 per request

function osvQuery(flatPkgs) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      queries: flatPkgs.map(p => ({
        package: { name: p.name, ecosystem: 'npm' },
        version: p.version,
      })),
    });

    const req = https.request({
      hostname: OSV_HOST,
      path:     OSV_PATH,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent':     'vuln-scanner/1.0',
      },
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`OSV API returned ${res.statusCode}: ${data}`));
        }
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function queryOSV(flatPkgs) {
  const results = [];
  for (let i = 0; i < flatPkgs.length; i += BATCH_MAX) {
    const batch   = flatPkgs.slice(i, i + BATCH_MAX);
    const resp    = await osvQuery(batch);
    const entries = resp.results || [];
    for (let j = 0; j < batch.length; j++) {
      results.push({ pkg: batch[j], vulns: entries[j]?.vulns || [] });
    }
    if (i + BATCH_MAX < flatPkgs.length) await sleep(300); // rate-limit courtesy
  }
  return results;
}

// ─── 5. Fetch full vulnerability details from OSV ────────────────
//
//  The /v1/querybatch endpoint only returns { id, modified } per vuln.
//  Severity, affected ranges, and fix versions require fetching each
//  vuln individually via GET /v1/vulns/{id}.
//  We fan-out in parallel batches to stay fast without hammering the API.

function fetchVulnDetail(id) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: OSV_HOST,
      path:     `/v1/vulns/${encodeURIComponent(id)}`,
      method:   'GET',
      headers:  { 'User-Agent': 'vuln-scanner/1.0' },
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) return resolve(null); // skip on error
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function enrichVulns(osvResults) {
  // Collect all unique vuln IDs across all packages
  const allIds = new Set();
  for (const { vulns } of osvResults) {
    for (const v of vulns) allIds.add(v.id);
  }

  // Fetch full details in parallel batches of 20
  const CONCURRENCY = 20;
  const ids    = [...allIds];
  const detail = new Map(); // id → full vuln object

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const full  = await Promise.all(batch.map(fetchVulnDetail));
    for (let j = 0; j < batch.length; j++) {
      if (full[j]) detail.set(batch[j], full[j]);
    }
    if (i + CONCURRENCY < ids.length) await sleep(100);
  }

  // Replace the stub vulns ({id,modified}) with the full objects
  return osvResults.map(entry => ({
    pkg:   entry.pkg,
    vulns: entry.vulns.map(v => detail.get(v.id) || v),
  }));
}

// ─── 7. Trace paths: root → vulnerable package ───────────────────
//
//  Iterative DFS with an explicit stack — no recursion, so large
//  graphs (1000+ packages) never hit the JS call-stack limit.
//
//  Stack entries: [nodeKey, pathArrayLeadingUpToNode]

function tracePaths(vulnerableKey, packages, roots) {
  const paths = [];

  for (const rootKey of roots) {
    if (paths.length >= 10) break;

    const stack = [[rootKey, ['[project]']]];

    while (stack.length > 0 && paths.length < 10) {
      const [currentKey, currentPath] = stack.pop();

      if (currentKey === vulnerableKey) {
        paths.push([...currentPath, currentKey]);
        continue; // found — don't recurse past the vulnerable node
      }

      // Cycle guard: skip if this key already appears in the current path
      if (currentPath.includes(currentKey)) continue;

      // Depth cap: skip absurdly long chains (saves time, avoids re-overflow)
      if (currentPath.length > 15) continue;

      const node = packages.get(currentKey);
      if (!node) continue;

      for (const childKey of node.deps) {
        stack.push([childKey, [...currentPath, currentKey]]);
      }
    }
  }

  // Edge case: vulnerable package is itself a direct dependency
  if (roots.has(vulnerableKey) && !paths.some(p => p.length === 2)) {
    paths.unshift(['[project]', vulnerableKey]);
  }

  return paths.slice(0, 10);
}

// ─── 8. Derive severity from OSV data ────────────────────────────
//
//  OSV / GHSA store severity in several places — we check all of them:
//
//  1. database_specific.cvss.score          — numeric (e.g. 7.5)
//     GitHub Advisory DB always populates this.
//
//  2. severity[].score where type=CVSS_V3/V2 — usually a CVSS vector
//     string ("CVSS:3.1/AV:N/..."), NOT a plain number, so parseFloat
//     returns NaN.  We skip those and fall through.
//
//  3. database_specific.severity            — label string.
//     GitHub uses "CRITICAL" | "HIGH" | "MODERATE" | "LOW".
//     Note: "MODERATE" must be mapped to "MEDIUM".

function deriveSeverity(vuln) {
  // 1. Numeric score from GitHub's cvss object (most reliable)
  const cvssNum = vuln.database_specific?.cvss?.score;
  if (cvssNum != null) {
    const n = parseFloat(cvssNum);
    if (!isNaN(n)) return cvssLabel(n);
  }

  // 2. severity[] array — type CVSS_V3 / CVSS_V4 / CVSS_V2
  for (const s of (vuln.severity || [])) {
    if (s.type === 'CVSS_V3' || s.type === 'CVSS_V2' || s.type === 'CVSS_V4') {
      const direct = parseFloat(s.score);
      if (!isNaN(direct)) return cvssLabel(direct);
      // CVSS vector strings end with letters, not numbers — skip them.
    }
  }

  // 3. database_specific.severity label string
  const raw = vuln.database_specific?.severity?.toUpperCase();
  if (raw) {
    const label = raw === 'MODERATE' ? 'MEDIUM' : raw; // GHSA uses MODERATE, not MEDIUM
    if (SEV_ORDER[label] !== undefined) return { label, score: null };
  }

  return { label: 'UNKNOWN', score: null };
}

function cvssLabel(score) {
  if (score >= 9.0) return { label: 'CRITICAL', score };
  if (score >= 7.0) return { label: 'HIGH',     score };
  if (score >= 4.0) return { label: 'MEDIUM',   score };
  return               { label: 'LOW',      score };
}

// ─── 9. Extract fix versions from OSV affected ranges ────────────
//
//  OSV fix data lives in two places depending on the advisory source:
//
//  A. affected[].ranges[].events[].fixed      — standard OSV schema
//  B. affected[].database_specific.fixed_versions[]  — GitHub Advisory DB

function extractFix(vuln) {
  const fixes = new Set();
  for (const affected of (vuln.affected || [])) {
    // A. Standard OSV ranges
    for (const range of (affected.ranges || [])) {
      for (const event of (range.events || [])) {
        if (event.fixed) fixes.add(event.fixed);
      }
    }
    // B. GitHub Advisory database_specific.fixed_versions
    for (const v of (affected.database_specific?.fixed_versions || [])) {
      if (v) fixes.add(v);
    }
  }
  return [...fixes];
}

// ─── 10. Root-cause: which direct dep introduces the vulnerability ─

function findRootCauses(paths) {
  const causes = new Set();
  for (const p of paths) {
    if (p.length >= 2) causes.add(p[1]); // index 0 = [project], 1 = direct dep
  }
  return [...causes];
}

// ─── 11. Main scan pipeline ───────────────────────────────────────

async function scan(lockFilePath) {
  progress(`\n${C.bold}${C.cyan}vuln-scanner${C.reset}  –  powered by OSV.dev\n`);
  progress(`${C.dim}Lockfile : ${lockFilePath}${C.reset}`);

  const lock = loadLockfile(lockFilePath);
  progress(`${C.dim}Lockfile version: ${lock.lockfileVersion}${C.reset}`);

  progress('\n⚙  Building dependency graph…');
  const { packages, roots } = buildGraph(lock);
  progress(`   ${packages.size} packages  |  ${roots.size} direct dependencies`);

  if (packages.size === 0) {
    progress(`\n${C.yellow}No packages found. Is this a valid lockfile?${C.reset}`);
    process.exit(0);
  }

  const flatPkgs = flattenPackages(packages);
  progress(`\n🔍 Querying OSV.dev for ${flatPkgs.length} unique package versions…`);

  let osvResults;
  try {
    osvResults = await queryOSV(flatPkgs);
  } catch (err) {
    fatal(`OSV API error: ${err.message}`);
  }

  // Enrich stub vulns ({id,modified}) with full details (severity, affected, fixes)
  const vulnCount = osvResults.reduce((n, r) => n + r.vulns.length, 0);
  if (vulnCount > 0) {
    progress(`\n📦 Fetching full details for ${vulnCount} vulnerabilities…`);
    osvResults = await enrichVulns(osvResults);
  }

  const findings = [];

  for (const { pkg, vulns } of osvResults) {
    if (!vulns.length) continue;

    for (const vuln of vulns) {
      const sev     = deriveSeverity(vuln);
      const fixes   = extractFix(vuln);
      const aliases = (vuln.aliases || []).filter(a => a.startsWith('CVE-'));
      const cveList = aliases.length ? aliases : [vuln.id];

      // Trace paths for every graph key that matches this name@version
      const allPaths = [];
      for (const key of pkg.keys) {
        allPaths.push(...tracePaths(key, packages, roots));
      }

      // Deduplicate paths by signature
      const seenSigs  = new Set();
      const uniqPaths = allPaths.filter(p => {
        const sig = p.join('>');
        if (seenSigs.has(sig)) return false;
        seenSigs.add(sig);
        return true;
      });

      findings.push({
        package:    pkg.name,
        version:    pkg.version,
        vuln_id:    vuln.id,
        cves:       cveList,
        title:      vuln.summary || vuln.details?.split('\n')[0] || '(no description)',
        severity:   sev.label,
        score:      sev.score,
        fixes,
        paths:      uniqPaths,
        rootCauses: findRootCauses(uniqPaths),
        url:        `https://osv.dev/vulnerability/${vuln.id}`,
      });
    }
  }

  // Sort: severity first, then highest path count (most widespread)
  findings.sort((a, b) => {
    const sd = SEV_ORDER[a.severity] - SEV_ORDER[b.severity];
    return sd !== 0 ? sd : b.paths.length - a.paths.length;
  });

  // Apply --min-severity and --fix-only filters
  const filtered = findings.filter(f => {
    if (MIN_SEV && SEV_ORDER[f.severity] > SEV_ORDER[MIN_SEV]) return false;
    if (fixOnly  && f.fixes.length === 0) return false;
    return true;
  });

  return { findings: filtered, totalPackages: packages.size, directDeps: roots.size };
}

// ─── 10. CLI renderer ─────────────────────────────────────────────

function renderCLI({ findings, totalPackages, directDeps }) {
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  for (const f of findings) counts[f.severity]++;

  if (findings.length === 0) {
    log(`\n${C.green}${C.bold}✅  No vulnerabilities found!${C.reset}`);
    log(`${C.dim}   Scanned ${totalPackages} packages (${directDeps} direct)${C.reset}\n`);
    return;
  }

  log(`\n${'─'.repeat(70)}`);
  log(`${C.bold}VULNERABILITY SUMMARY${C.reset}`);
  log(`${'─'.repeat(70)}`);
  log(`Scanned : ${totalPackages} packages (${directDeps} direct deps)`);
  log(`Found   : ${findings.length} vulnerabilities\n`);
  log(
    Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([s, n]) => `${SEV_COLOR[s]}${s}: ${n}${C.reset}`)
      .join('   ')
  );

  log('');
  for (const f of findings) {
    const sc  = f.score != null ? ` (${f.score})` : '';
    const col = SEV_COLOR[f.severity];

    log(`${'═'.repeat(70)}`);
    log(`${col}${C.bold}[${f.severity}${sc}]  ${f.package}@${f.version}${C.reset}`);
    log(`${C.bold}${f.title}${C.reset}`);
    log(`${C.dim}ID  : ${f.vuln_id}${C.reset}`);
    if (f.cves.some(c => c.startsWith('CVE-'))) {
      log(`${C.dim}CVE : ${f.cves.join(', ')}${C.reset}`);
    }
    log(`${C.dim}URL : ${f.url}${C.reset}`);

    if (f.paths.length) {
      log(`\n${C.cyan}Introduced via (${f.paths.length} path${f.paths.length > 1 ? 's' : ''}):${C.reset}`);
      for (const p of f.paths.slice(0, 5)) log(`  ${C.dim}${p.join(' → ')}${C.reset}`);
      if (f.paths.length > 5) log(`  ${C.dim}… and ${f.paths.length - 5} more${C.reset}`);
    } else {
      log(`\n${C.dim}(direct dependency — no parent chain)${C.reset}`);
    }

    if (f.rootCauses.length) {
      log(`\n${C.magenta}Root cause (direct dep to upgrade):${C.reset}`);
      for (const rc of f.rootCauses) log(`  ${C.bold}${rc}${C.reset}`);
    }

    if (f.fixes.length) {
      log(`\n${C.green}Fix:${C.reset}`);
      log(`  Upgrade ${C.bold}${f.package}${C.reset} to ${C.green}>= ${f.fixes.join(' or ')}${C.reset}`);
      if (f.rootCauses.length) log(`  ${C.dim}Or upgrade the root dep: ${f.rootCauses.join(', ')}${C.reset}`);
    } else {
      log(`\n${C.yellow}Fix: No patched version known yet — monitor for updates.${C.reset}`);
    }
    log('');
  }

  log(`${'═'.repeat(70)}`);
  log(`\n${C.bold}Total: ${findings.length} issue(s) found.${C.reset}\n`);
}

// ─── 12. Table renderer ──────────────────────────────────────────
//  Compact ASCII table: one row per vuln with dynamic column widths.

function renderTable({ findings, totalPackages, directDeps }) {
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  for (const f of findings) counts[f.severity]++;

  log(`\n${'─'.repeat(70)}`);
  log(`${C.bold}VULNERABILITY SUMMARY${C.reset}`);
  log(`${'─'.repeat(70)}`);
  log(`Scanned : ${totalPackages} packages (${directDeps} direct deps)`);
  log(`Found   : ${findings.length} vulnerabilities\n`);

  if (findings.length === 0) {
    log(`${C.green}${C.bold}✅  No vulnerabilities found!${C.reset}\n`);
    return;
  }

  log(
    Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([s, n]) => `${SEV_COLOR[s]}${s}: ${n}${C.reset}`)
      .join('   ')
  );

  // Column definitions: [header, maxWidth, accessor]
  const cols = [
    { h: 'SEVERITY',  w: 10, get: f => f.severity + (f.score != null ? ` (${f.score})` : '') },
    { h: 'PACKAGE',   w: 36, get: f => `${f.package}@${f.version}` },
    { h: 'ID / CVE',  w: 22, get: f => f.cves.find(c => c.startsWith('CVE-')) || f.vuln_id },
    { h: 'FIX',       w: 14, get: f => f.fixes.length ? `>= ${f.fixes[0]}` : '—' },
    { h: 'TITLE',     w: 50, get: f => f.title },
  ];

  function pad(str, w)  { return str.length <= w ? str.padEnd(w) : str.slice(0, w - 1) + '…'; }
  function line(ch, jl, jm, jr) {
    return jl + cols.map(c => ch.repeat(c.w + 2)).join(jm) + jr;
  }

  const out = [];
  out.push('\n' + line('─', '┌', '┬', '┐'));
  out.push('│ ' + cols.map(c => C.bold + pad(c.h, c.w) + C.reset).join(' │ ') + ' │');
  out.push(line('─', '├', '┼', '┤'));

  for (const f of findings) {
    const col = SEV_COLOR[f.severity];
    const cells = cols.map((c, i) => {
      const val = pad(c.get(f), c.w);
      return i === 0 ? col + val + C.reset : val;
    });
    out.push('│ ' + cells.join(' │ ') + ' │');
  }

  out.push(line('─', '└', '┴', '┘'));
  out.push(`\n${C.bold}Total: ${findings.length} issue(s)${C.reset}  ` +
    (MIN_SEV  ? `[min-severity: ${MIN_SEV}]  ` : '') +
    (fixOnly  ? `[fix-only]  `                 : '') +
    '\n');

  const text = out.join('\n');
  if (outFile) {
    // strip ANSI for file output
    fs.writeFileSync(outFile, text.replace(/\x1b\[[0-9;]*m/g, ''), 'utf8');
    process.stderr.write(`Report written to: ${outFile}\n`);
  } else {
    process.stdout.write(text + '\n');
  }
}

// ─── 13. List renderer ───────────────────────────────────────────
//  One line per vuln: ● [SEVERITY] package@ver — title  →  fix / no fix

function renderList({ findings, totalPackages, directDeps }) {
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  for (const f of findings) counts[f.severity]++;

  const lines = [];
  lines.push(`vuln-scanner — ${findings.length} finding(s) in ${totalPackages} packages`);
  if (findings.length === 0) {
    lines.push('✅  No vulnerabilities found!\n');
    const text = lines.join('\n');
    outFile ? fs.writeFileSync(outFile, text, 'utf8') : process.stdout.write(text + '\n');
    return;
  }

  lines.push(
    Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([s, n]) => `${SEV_COLOR[s]}${s}: ${n}${C.reset}`)
      .join('  ')
  );
  lines.push('');

  // Group by severity
  for (const level of SEV_LEVELS) {
    const group = findings.filter(f => f.severity === level);
    if (!group.length) continue;
    lines.push(`${SEV_COLOR[level]}${C.bold}── ${level} (${group.length}) ${'─'.repeat(Math.max(0, 60 - level.length - 6))}${C.reset}`);
    for (const f of group) {
      const id  = f.cves.find(c => c.startsWith('CVE-')) || f.vuln_id;
      const fix = f.fixes.length ? `${C.green}fix >= ${f.fixes[0]}${C.reset}` : `${C.yellow}no fix yet${C.reset}`;
      const title = f.title.length > 55 ? f.title.slice(0, 54) + '…' : f.title;
      lines.push(`  ${SEV_COLOR[f.severity]}●${C.reset} ${C.bold}${f.package}@${f.version}${C.reset}  ${C.dim}${id}${C.reset}`);
      lines.push(`    ${title}  →  ${fix}`);
    }
    lines.push('');
  }

  lines.push(`${C.dim}Scanned ${totalPackages} packages (${directDeps} direct deps)${C.reset}`);
  const text = lines.join('\n');
  if (outFile) {
    fs.writeFileSync(outFile, text.replace(/\x1b\[[0-9;]*m/g, ''), 'utf8');
    process.stderr.write(`Report written to: ${outFile}\n`);
  } else {
    process.stdout.write(text + '\n');
  }
}

// ─── 14. CSV renderer ────────────────────────────────────────────

function renderCSV({ findings }) {
  function csvCell(v) {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  }

  const header = ['severity','score','package','version','vuln_id','cve','title','fix_versions','root_causes','url'];
  const rows   = findings.map(f => [
    f.severity,
    f.score ?? '',
    f.package,
    f.version,
    f.vuln_id,
    f.cves.join(' | '),
    f.title,
    f.fixes.join(' | '),
    f.rootCauses.join(' | '),
    f.url,
  ].map(csvCell).join(','));

  const csv = [header.join(','), ...rows].join('\n') + '\n';
  if (outFile) {
    fs.writeFileSync(outFile, csv, 'utf8');
    process.stderr.write(`Report written to: ${outFile}\n`);
  } else {
    process.stdout.write(csv);
  }
}

// ─── 15. Markdown renderer ───────────────────────────────────────

function renderMarkdown({ findings, totalPackages, directDeps }) {
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 };
  for (const f of findings) counts[f.severity]++;

  const lines = [];
  lines.push('# Vulnerability Report');
  lines.push('');
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push(`> Scanned **${totalPackages}** packages (${directDeps} direct deps)`);
  lines.push('');

  const summary = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([s, n]) => `**${s}**: ${n}`)
    .join('  •  ');
  lines.push(`**Total: ${findings.length}**  —  ${summary}`);
  lines.push('');

  if (findings.length === 0) {
    lines.push('✅ No vulnerabilities found!');
  } else {
    lines.push('| Severity | Package | ID / CVE | Fix | Title |');
    lines.push('|----------|---------|----------|-----|-------|');
    for (const f of findings) {
      const sev  = f.score != null ? `${f.severity} (${f.score})` : f.severity;
      const pkg  = `\`${f.package}@${f.version}\``;
      const id   = f.cves.find(c => c.startsWith('CVE-')) || f.vuln_id;
      const fix  = f.fixes.length ? `\`>= ${f.fixes[0]}\`` : '—';
      const title = f.title.replace(/\|/g, '\\|');
      lines.push(`| ${sev} | ${pkg} | ${id} | ${fix} | ${title} |`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('*Powered by [OSV.dev](https://osv.dev)*');

  const md = lines.join('\n') + '\n';
  if (outFile) {
    fs.writeFileSync(outFile, md, 'utf8');
    process.stderr.write(`Report written to: ${outFile}\n`);
  } else {
    process.stdout.write(md);
  }
}

// ─── 16. JSON renderer ───────────────────────────────────────────

function renderJSON({ findings, totalPackages, directDeps }) {
  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      total_packages:  totalPackages,
      direct_deps:     directDeps,
      vulnerabilities: findings.length,
      by_severity:     { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 },
    },
    findings: findings.map(f => ({
      package:      f.package,
      version:      f.version,
      vuln_id:      f.vuln_id,
      cves:         f.cves,
      title:        f.title,
      severity:     f.severity,
      cvss_score:   f.score,
      fix_versions: f.fixes,
      paths:        f.paths,
      root_causes:  f.rootCauses,
      url:          f.url,
    })),
  };
  for (const f of findings) report.summary.by_severity[f.severity]++;
  const json = JSON.stringify(report, null, 2);
  if (outFile) {
    fs.writeFileSync(outFile, json, 'utf8');
    process.stderr.write(`Report written to: ${outFile}\n`);
  } else {
    process.stdout.write(json + '\n');
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

// progress() — scan progress lines → stderr, suppressed by --quiet
function progress(msg) { if (!quiet) process.stderr.write(msg + '\n'); }
// log() — report output → stdout (used by full/table renderers)
function log(msg)      { process.stdout.write(msg + '\n'); }
function fatal(msg)    { process.stderr.write(`\n❌  Error: ${msg}\n\n`); process.exit(1); }
function sleep(ms)     { return new Promise(r => setTimeout(r, ms)); }

// ─── Entry point ─────────────────────────────────────────────────

(async () => {
  try {
    const result = await scan(lockPath);

    const renderers = {
      full:     renderCLI,
      table:    renderTable,
      list:     renderList,
      csv:      renderCSV,
      markdown: renderMarkdown,
      json:     renderJSON,
    };
    const render = renderers[FORMAT] ?? renderCLI;
    render(result);

    const hasCriticalOrHigh = result.findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
    process.exit(hasCriticalOrHigh ? 1 : 0);
  } catch (err) {
    fatal(err.message);
  }
})();
