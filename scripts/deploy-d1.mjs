#!/usr/bin/env node
// Cloudflare D1 + Worker 一键部署脚本
// 用于创建 D1 数据库、导入数据、部署 Worker

import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createInterface } from 'node:readline'

const ROOT = resolve(import.meta.dirname, '..')
const WORKER_DIR = join(ROOT, 'api', 'worker')
const SQL_DIR = join(ROOT, 'scripts', 'import-sql')
const WRANGLER_TOML = join(WORKER_DIR, 'wrangler.toml')

function run(cmd, opts = {}) {
  console.log('  $ ' + cmd)
  return execSync(cmd, { cwd: WORKER_DIR, stdio: 'inherit', ...opts })
}

function ask(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans) }))
}

async function main() {
  console.log('')
  console.log('====  ??? ? ???? API ??? ====')
  console.log('')

  // 1. ??
  console.log('1? ???? Cloudflare ???...')
  try {
    execSync('npx wrangler whoami', { cwd: WORKER_DIR, stdio: 'pipe' })
    console.log('   ?  ?? Cloudflare')
  } catch {
    console.log('   ??  ???? OAuth ??(?????????)...')
    try {
      run('npx wrangler login')
    } catch {
      console.log('')
      console.log('?? ???')
      await ask('   ????????... ')
    }
  }

  // 2. D1
  console.log('')
  console.log('2?  ?? D1 ???...')
  let dbId = ''
  try {
    const out = execSync('npx wrangler d1 create chinese-poetry-db', {
      cwd: WORKER_DIR, stdio: 'pipe'
    }).toString()
    const m = out.match(/database_id:\s*"([^"]+)"/)
    if (m) { dbId = m[1]; console.log('   ?  D1 ??, ID: ' + dbId) }
  } catch {
    // ???
    try {
      const out = execSync('npx wrangler d1 list', { cwd: WORKER_DIR, stdio: 'pipe' }).toString()
      if (out.includes('chinese-poetry-db')) {
        console.log('   ?  D1 ???')
        const ans = await ask('   ???? database_id: ')
        dbId = ans.trim()
      }
    } catch {
      console.log('   ??  ????????? Dashboard ?? D1 ??')
      dbId = (await ask('   ????? database_id: ')).trim()
    }
  }

  if (dbId) {
    let toml = readFileSync(WRANGLER_TOML, 'utf-8')
    toml = toml.replace(/database_id\s*=\s*"[^"]*"/, 'database_id = "' + dbId + '"')
    writeFileSync(WRANGLER_TOML, toml, 'utf-8')
    console.log('   ?  wrangler.toml ??')
  }

  // 3. Schema
  console.log('')
  console.log('3?  ?? Schema...')
  try {
    run('npx wrangler d1 execute chinese-poetry-db --file="' + join(SQL_DIR, '01-schema.sql') + '"')
    console.log('   ?  Schema ??')
  } catch { console.log('   ?? Schema ???(?????)') }

  try {
    run('npx wrangler d1 execute chinese-poetry-db --file="' + join(SQL_DIR, '00-collections.sql') + '"')
    console.log('   ?  Collections ??')
  } catch { console.log('   ?? Collections ???(?????)') }

  // 4. Import poems
  console.log('')
  console.log('4?  ?? 487 ????(149MB)...')
  console.log('   ??? 15-30 ??')
  const files = readdirSync(SQL_DIR).filter(f => f.startsWith('02-poems-')).sort()
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    process.stdout.write('   [' + (i + 1) + '/' + files.length + '] ' + file + '... ')
    try {
      execSync('npx wrangler d1 execute chinese-poetry-db --file="' + join(SQL_DIR, file) + '"', {
        cwd: WORKER_DIR, stdio: 'pipe', timeout: 60000
      })
      process.stdout.write('?' + '\n')
    } catch {
      process.stdout.write('?\n')
    }
  }
  console.log('   ?  ??')

  // 5. Deploy
  console.log('')
  console.log('5?  ?? Worker API...')
  try {
    run('npx wrangler deploy')
    console.log('   ?  Worker ??')
  } catch (e) {
    console.log('   ?? ???')
  }

  console.log('')
  console.log('==== ?  ====')
  console.log('???:')
  console.log('1. Dashboard ??? Pages ?? D1 ??')
  console.log('2. ????? GitHub Actions ??')
  console.log('===========')
}

main().catch(e => { console.error('??:', e.message); process.exit(1) })
