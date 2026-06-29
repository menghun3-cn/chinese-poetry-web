// D1 ??? - ???? wrangler d1 execute ?? SQL ??
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const WORKER_DIR = resolve(import.meta.dirname, '..', 'api', 'worker')
const SQL_DIR = resolve(import.meta.dirname, '..', 'scripts', 'import-sql')

// ??? SQL ? 50 ???,? 1 5 ?
const BATCH_SIZE = 50

async function main() {
  const files = readdirSync(SQL_DIR).filter(f => f.startsWith('02-poems-')).sort()
  console.log('?? ' + files.length + ' ? SQL ??')

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE)
    const mergedSql = batch.map(f => readFileSync(join(SQL_DIR, f), 'utf8')).join('\\n')
    const tmpFile = join(WORKER_DIR, '_batch_' + Math.floor(i / BATCH_SIZE) + '.sql')
    writeFileSync(tmpFile, mergedSql, 'utf8')

    process.stdout.write('  [' + Math.floor(i / BATCH_SIZE + 1) + '/' + Math.ceil(files.length / BATCH_SIZE) + '] ?' + batch[0] + ' - ' + batch[batch.length - 1] + '... ')
    try {
      execSync('npx wrangler d1 execute chinese-poetry-db --file="' + tmpFile + '"', {
        cwd: WORKER_DIR, stdio: 'pipe', timeout: 120000
      })
      process.stdout.write('?' + '\\n')
    } catch (e) {
      process.stdout.write('??\\n')
    }
    // ??
    try { require('node:fs').unlinkSync(tmpFile) } catch {}
  }
  console.log('\\n? ???')
}

main().catch(e => { console.error('??:', e.message); process.exit(1) })