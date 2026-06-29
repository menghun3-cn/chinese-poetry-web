import { Router, IRequest } from 'itty-router';

// ── Types ──────────────────────────────────────────────────
interface Poem {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  collection: string;
  collection_id: string;
  rhythmic: string;
  tags: string[];
  excerpt: string;
  length: number;
  source_path: string;
  paragraphs: string[];
}

interface Env {
  DB: D1Database;
  CACHE_TTL?: string;
  CACHE_TTL_LONG?: string;
}

interface CFRequest extends Request {
  params?: Record<string, string>;
}

// ── Router & CORS ─────────────────────────────────────────
const router = Router();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// ── Cache Helpers ─────────────────────────────────────────
function cacheKey(url: URL): string {
  return url.pathname + url.search;
}

async function getFromCache(env: Env, key: string): Promise<Response | null> {
  const cache = caches.default;
  const req = new Request(`https://cache.internal/${key}`);
  return cache.match(req);
}

async function setCache(env: Env, key: string, response: Response, ttl: number = 60): Promise<void> {
  const cache = caches.default;
  const req = new Request(`https://cache.internal/${key}`);
  const resp = new Response(response.body, response);
  resp.headers.set('Cache-Control', `public, max-age=${ttl}`);
  // Cloudflare Cache API respects s-maxage
  await cache.put(req, resp);
}

function jsonResponse(data: unknown, status = 200, cacheTTL?: number): Response {
  const body = JSON.stringify(data);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders,
  };
  if (cacheTTL) {
    headers['Cache-Control'] = `public, max-age=${cacheTTL}`;
  }
  return new Response(body, { status, headers });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

// ── GET /api/catalog ──────────────────────────────────────
// 返回文集目录（已缓存 1 小时）
router.get('/api/catalog', async (_req: CFRequest, env: Env) => {
  const collections = await env.DB.prepare(
    'SELECT id, name, dynasty, description, count FROM collections ORDER BY count DESC'
  ).all<{ id: string; name: string; dynasty: string; description: string; count: number }>();

  const total = collections.results.reduce((sum, c) => sum + c.count, 0);

  return jsonResponse({
    generatedAt: new Date().toISOString(),
    sourceRepository: 'https://github.com/menghun3-cn/chinese-poetry-simplified.git',
    total,
    collections: collections.results,
  }, 200, 3600);
});

// ── GET /api/search ───────────────────────────────────────
// 搜索诗词，支持 keyword / author / collection_id / tags / page / page_size
router.get('/api/search', async (request: CFRequest, env: Env) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() || '';
  const author = url.searchParams.get('author')?.trim() || '';
  const collectionId = url.searchParams.get('collection_id')?.trim() || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('page_size') || '20')));
  const offset = (page - 1) * pageSize;

  // Build dynamic WHERE clause with parameterized queries
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (keyword) {
    conditions.push('(title LIKE ? OR author LIKE ? OR excerpt LIKE ?)');
    const kw = '%' + keyword + '%';
    params.push(kw, kw, kw);
  }
  if (author) {
    conditions.push('author = ?');
    params.push(author);
  }
  if (collectionId && collectionId !== 'all') {
    conditions.push('collection_id = ?');
    params.push(collectionId);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  // Get total count
  const countResult = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM poems ' + where
  ).bind(...params).first<{ total: number }>();

  // Get page data (exclude paragraphs for list view)
  const poems = await env.DB.prepare(
    `SELECT id, title, author, dynasty, collection, collection_id, rhythmic, tags, excerpt, length, source_path
     FROM poems ${where} ORDER BY length DESC LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all<Omit<Poem, 'paragraphs'>>();

  const items = poems.results.map(p => ({
    ...p,
    tags: JSON.parse(p.tags as unknown as string),
  }));

  return jsonResponse({
    items,
    total: countResult?.total || 0,
    page,
    pageSize,
    hasMore: (countResult?.total || 0) > offset + pageSize,
  }, 200, 60);
});

// ── GET /api/detail ───────────────────────────────────────
// 获取诗词详情（含正文）
router.get('/api/detail', async (request: CFRequest, env: Env) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return errorResponse('缺少 id 参数');

  const poem = await env.DB.prepare(
    'SELECT * FROM poems WHERE id = ?'
  ).bind(id).first<Poem>();

  if (!poem) return errorResponse('诗词未找到', 404);

  poem.tags = JSON.parse(poem.tags as unknown as string);
  poem.paragraphs = JSON.parse(poem.paragraphs as unknown as string);

  return jsonResponse(poem, 200, 300);
});

// ── GET /api/authors ──────────────────────────────────────
// 获取作者列表（按作品数排序），支持搜索
router.get('/api/authors', async (request: CFRequest, env: Env) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() || '';
  const collectionId = url.searchParams.get('collection_id')?.trim() || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('page_size') || '20')));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (keyword) {
    conditions.push('author LIKE ?');
    params.push('%' + keyword + '%');
  }
  if (collectionId && collectionId !== 'all') {
    conditions.push('collection_id = ?');
    params.push(collectionId);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const authors = await env.DB.prepare(
    `SELECT author, COUNT(*) as count FROM poems ${where}
     GROUP BY author ORDER BY count DESC LIMIT ? OFFSET ?`
  ).bind(...params, pageSize, offset).all();

  return jsonResponse({ authors: authors.results, page, pageSize }, 200, 300);
});

// ── GET /api/random ───────────────────────────────────────
// 随机诗词
router.get('/api/random', async (request: CFRequest, env: Env) => {
  const url = new URL(request.url);
  const count = Math.min(10, Math.max(1, parseInt(url.searchParams.get('count') || '1')));
  const collectionId = url.searchParams.get('collection_id')?.trim() || '';

  let sql: string;
  let params: unknown[];

  if (collectionId && collectionId !== 'all') {
    sql = 'SELECT id, title, author, dynasty, collection, collection_id, rhythmic, tags, excerpt, length FROM poems WHERE collection_id = ? ORDER BY RANDOM() LIMIT ?';
    params = [collectionId, count];
  } else {
    sql = 'SELECT id, title, author, dynasty, collection, collection_id, rhythmic, tags, excerpt, length FROM poems ORDER BY RANDOM() LIMIT ?';
    params = [count];
  }

  const poems = await env.DB.prepare(sql).bind(...params).all();

  const items = poems.results.map(p => ({
    ...p,
    tags: JSON.parse((p.tags as unknown as string) || '[]'),
  }));

  return jsonResponse({ items }, 200, 0);
});

// ── GET /api/tags ─────────────────────────────────────────
// 获取常用标签（通过查询有标签的诗词统计）
router.get('/api/tags', async (request: CFRequest, env: Env) => {
  const url = new URL(request.url);
  const collectionId = url.searchParams.get('collection_id')?.trim() || '';
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));

  let sql: string;
  let params: unknown[];

  if (collectionId && collectionId !== 'all') {
    sql = 'SELECT tags FROM poems WHERE collection_id = ? AND tags != "[]" AND tags IS NOT NULL LIMIT ?';
    params = [collectionId, 2000];
  } else {
    sql = 'SELECT tags FROM poems WHERE tags != "[]" AND tags IS NOT NULL LIMIT ?';
    params = [2000];
  }

  const result = await env.DB.prepare(sql).bind(...params).all<{ tags: string }>();
  
  // Aggregate tag frequency
  const freq: Record<string, number> = {};
  for (const row of result.results) {
    try {
      const tags = JSON.parse(row.tags as unknown as string) as string[];
      for (const tag of tags) {
        freq[tag] = (freq[tag] || 0) + 1;
      }
    } catch { /* skip */ }
  }

  const tags = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));

  return jsonResponse({ tags }, 200, 600);
});

// ── GET /api/stats ────────────────────────────────────────
// 基础统计信息
router.get('/api/stats', async (_req: CFRequest, env: Env) => {
  const totalPoems = await env.DB.prepare('SELECT COUNT(*) as c FROM poems').first<{ c: number }>();
  const totalAuthors = await env.DB.prepare('SELECT COUNT(DISTINCT author) as c FROM poems').first<{ c: number }>();
  const totalCollections = await env.DB.prepare('SELECT COUNT(*) as c FROM collections').first<{ c: number }>();

  return jsonResponse({
    totalPoems: totalPoems?.c || 0,
    totalAuthors: totalAuthors?.c || 0,
    totalCollections: totalCollections?.c || 0,
  }, 200, 600);
});

// ── 404 Handler ───────────────────────────────────────────
router.all('*', () => new Response('Not Found', { status: 404 }));

// ── Worker Entry ──────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      return await router.handle(request, env);
    } catch (err) {
      console.error('Worker error:', err);
      return errorResponse('服务器内部错误', 500);
    }
  },
};
