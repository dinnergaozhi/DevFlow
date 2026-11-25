#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成前端 mock 数据（public/data/*.json）。

复用 seed_generator.py 的造数逻辑（同一随机种子 => 与 blog_seed_data.sql 一致的
标题/摘要/作者/标签/浏览量），并把正文替换成更贴近真实阅读端的 Markdown 长文，
方便前端详情页演示 marked + DOMPurify 渲染效果。

原 seed_generator.py 第 98 行有语法错误（join 少一个括号）、第 40 行 randint 少一个参数，
且第 118 行出现被截断的 `password=***`，因此这里内置一份等价的造数实现，不修改原文件。

用法： python scripts/gen_mock_data.py
"""
import datetime
import json
import os
import random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data")
os.makedirs(OUT, exist_ok=True)

# ---------------- 词库（与 seed_generator.py 一致） ----------------
LANGS = ["Python", "Go", "Rust", "Java", "JavaScript", "TypeScript", "C++", "Kotlin", "Swift", "C#"]
FRAMEWORKS = ["FastAPI", "Django", "Flask", "Spring Boot", "Gin", "Echo", "React", "Vue", "Next.js",
              "NestJS", "Actix", "Axum"]
TOPICS = ["异步编程", "协程", "并发模型", "微服务", "容器化", "Kubernetes", "DevOps", "CI/CD", "单元测试",
          "性能调优", "内存管理", "缓存策略", "消息队列", "Kafka", "RabbitMQ", "Redis", "MySQL",
          "PostgreSQL", "MongoDB", "数据库索引", "事务隔离", "分库分表", "读写分离", "ORM", "SQLAlchemy",
          "连接池", "限流熔断", "负载均衡", "服务发现", "链路追踪", "日志系统", "监控告警", "GraphQL",
          "RESTful", "WebSocket", "gRPC", "OAuth2", "JWT", "爬虫", "设计模式", "代码重构", "领域驱动",
          "RAG", "大模型微调", "向量数据库", "Embedding", "提示工程"]
ACTIONS = ["踩坑记", "实战总结", "原理解析", "源码阅读", "性能优化", "从0到1", "最佳实践", "避坑指南",
           "深度剖析", "入门到精通"]
COMPANIES = ["阿里云", "字节跳动", "腾讯", "美团", "京东", "滴滴", "B站", "网易", "小米", "快手"]
SURNAME = list("林陈王李张刘赵孙周吴郑冯蒋沈韩杨朱秦许何")
NICKS = ["代码", "编程", "算法", "后端", "全栈", "极客", "螺丝", "咖啡", "夜灯", "山客", "拾光", "长风",
         "青崖", "半夏", "孤舟", "无涯", "知行", "墨白"]
CATEGS = ["后端", "前端", "数据库", "云原生", "AI/大模型", "算法", "工程效能", "安全"]

# 标签 -> 分类的映射，保证列表页的分类筛选与标签语义一致
TAG_NAMES = list(dict.fromkeys(LANGS + FRAMEWORKS + TOPICS))
TAG_BY_NAME = {name: index for index, name in enumerate(TAG_NAMES, 1)}

_BACKEND = set(LANGS) - {"JavaScript", "TypeScript"} | {"FastAPI", "Django", "Flask", "Spring Boot",
                                                       "Gin", "Echo", "Actix", "Axum", "异步编程",
                                                       "协程", "并发模型", "内存管理", "性能调优",
                                                       "缓存策略", "消息队列", "Kafka", "RabbitMQ",
                                                       "ORM", "设计模式", "代码重构", "领域驱动",
                                                       "GraphQL", "RESTful", "WebSocket", "gRPC"}
_FRONTEND = {"JavaScript", "TypeScript", "React", "Vue", "Next.js", "NestJS"}
_DATABASE = {"Redis", "MySQL", "PostgreSQL", "MongoDB", "数据库索引", "事务隔离", "分库分表",
             "读写分离", "SQLAlchemy", "连接池"}
_CLOUD = {"容器化", "Kubernetes", "DevOps", "CI/CD", "微服务", "负载均衡", "服务发现", "限流熔断",
          "链路追踪", "监控告警", "日志系统"}
_AI = {"RAG", "大模型微调", "向量数据库", "Embedding", "提示工程"}
_SECURITY = {"OAuth2", "JWT", "爬虫"}
_EFFICIENCY = {"单元测试"}

CATEGORY_OF = {}
for name in TAG_NAMES:
    if name in _FRONTEND:
        CATEGORY_OF[name] = "前端"
    elif name in _DATABASE:
        CATEGORY_OF[name] = "数据库"
    elif name in _CLOUD:
        CATEGORY_OF[name] = "云原生"
    elif name in _AI:
        CATEGORY_OF[name] = "AI/大模型"
    elif name in _SECURITY:
        CATEGORY_OF[name] = "安全"
    elif name in _EFFICIENCY:
        CATEGORY_OF[name] = "工程效能"
    elif name in _BACKEND:
        CATEGORY_OF[name] = "后端"
    else:
        CATEGORY_OF[name] = "工程效能"


N_ARTICLES = 1200
N_AUTHORS = 120
N_USERS = 800
N_FAVORITES = 8000
N_HISTORY = 30000


def esc(s):
    return str(s).replace("\\", "\\\\").replace("'", "''")


def build_seed(seed_value=20261125):
    random.seed(seed_value)
    now = datetime.datetime(2026, 11, 25, 8, 0, 0)

    def rd(back=720, hour=False):
        d = now - datetime.timedelta(
            days=random.randint(1, back),
            hours=random.randint(0, 23) if hour else 0,
            minutes=random.randint(0, 59),
            seconds=random.randint(0, 59),
        )
        return d.strftime("%Y-%m-%d %H:%M:%S")

    tag_names = list(dict.fromkeys(LANGS + FRAMEWORKS + TOPICS))
    tags = [(i, n, f"{n}相关技术文章", "#%06x" % random.randint(0, 0xFFFFFF), random.randint(5, 800), rd(400))
            for i, n in enumerate(tag_names, 1)]

    authors = []
    for i in range(1, N_AUTHORS + 1):
        nick = random.choice(NICKS) + random.choice(["", "哥", "君", "叔", "同学", "的随笔", "笔记", "小站"])
        real = random.choice(SURNAME) + random.choice("工明伟芳磊洋静强")
        comp = (random.choice(COMPANIES) + "技术团队") if random.random() < 0.4 else ""
        title = random.choice(["后端工程师", "全栈工程师", "架构师", "技术专家", "高级开发", "初级开发", "实习生", "独立开发者"])
        bio = f"专注 {random.choice(LANGS + FRAMEWORKS)} 与 {random.choice(TOPICS)}"
        authors.append((i, esc(nick), esc(real), esc(comp), esc(title), esc(bio),
                        random.randint(0, 50000), random.randint(1, 300), rd(600)))

    users = []
    for i in range(1, N_USERS + 1):
        u = f"user_{i:04d}"
        e = f"{u}@{random.choice(['qq.com', '163.com', 'gmail.com'])}"
        users.append((i, esc(u), "hash", esc(e),
                      esc(random.choice(NICKS) + random.choice(["", "_cn", "_dev"])),
                      random.randint(0, 300), rd(600)))

    articles = []
    tset = set()
    for i in range(1, N_ARTICLES + 1):
        while True:
            t1 = random.choice(LANGS + FRAMEWORKS + TOPICS)
            t2 = random.choice(LANGS + FRAMEWORKS + TOPICS)
            title = f"{t1} {random.choice(ACTIONS)}：{t2}实践"
            if title not in tset:
                tset.add(title)
                break
        views = random.randint(1, 120000) if random.random() < 0.8 else random.randint(120000, 900000)
        likes = int(views * random.uniform(0.01, 0.08))
        cmts = int(likes * 0.2)
        favs = int(likes * 0.3)
        summary = f"本文围绕 {t1} 展开，结合 {t2} 场景，适合进阶读者。"
        status = 1
        if random.random() < 0.05:
            status = 0
        elif random.random() < 0.05:
            status = 2
        pub = rd(700)
        # 让标签 / 分类与标题的技术栈一致，避免出现“标题讲 RabbitMQ、标签却是 Next.js”的割裂感
        tag_id = TAG_BY_NAME.get(t1, random.randint(1, len(tags)))
        category = CATEGORY_OF.get(t1, random.choice(CATEGS))
        articles.append((i, esc(title), esc(summary), "", esc(category),
                         tag_id, random.randint(1, N_AUTHORS),
                         views, likes, cmts, favs, status, pub, pub, pub))

    favorites = []
    fset = set()
    fid = 0
    while len(favorites) < N_FAVORITES:
        uid = random.randint(1, N_USERS)
        aid = random.randint(1, N_ARTICLES)
        if (uid, aid) in fset:
            continue
        fset.add((uid, aid))
        fid += 1
        favorites.append((fid, uid, aid, rd(300, hour=True)))

    hist = []
    hset = set()
    hid = 0
    while len(hist) < N_HISTORY:
        uid = random.randint(1, N_USERS)
        aid = random.randint(1, N_ARTICLES)
        key = (uid, aid)
        if key in hset and random.random() < 0.7:
            continue
        hset.add(key)
        hid += 1
        hist.append((hid, uid, aid, rd(120, hour=True)))

    return tags, authors, users, articles, favorites, hist


tags, authors, users, articles, favorites, hist = build_seed()

# ---------------- 正文 / 代码片段 ----------------
LANG_OF = {
    "Python": "python", "Go": "go", "Rust": "rust", "Java": "java",
    "JavaScript": "javascript", "TypeScript": "typescript", "C++": "cpp",
    "Kotlin": "kotlin", "Swift": "swift", "C#": "csharp",
    "React": "tsx", "Vue": "vue", "Next.js": "tsx", "NestJS": "ts",
    "Spring Boot": "java", "FastAPI": "python", "Django": "python", "Flask": "python",
    "Gin": "go", "Echo": "go", "Actix": "rust", "Axum": "rust",
    "MySQL": "sql", "PostgreSQL": "sql", "MongoDB": "javascript", "Redis": "bash",
}

CODE = {
    "python": '''from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/articles", tags=["article"])


@router.get("/{article_id}")
async def get_article(article_id: int, db: AsyncSession = Depends(get_db)):
    article = await db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="article not found")
    # 浏览量先写 Redis，定时批量回刷 MySQL，避免热点行锁
    await redis.zincrby("article:views", 1, article_id)
    return {"code": 0, "data": article, "msg": "ok"}''',
    "typescript": '''import { ref, shallowRef, type Ref } from 'vue'
import { getArticleList } from '@/api/article'

export function useArticleList(params: Ref<ArticleQuery>) {
  const list = shallowRef<Article[]>([])
  const loading = ref(false)
  const finished = ref(false)

  async function load(page: number) {
    loading.value = true
    try {
      const data = await getArticleList({ ...params.value, page })
      list.value = page === 1 ? data.items : [...list.value, ...data.items]
      finished.value = page >= data.pages
    } finally {
      loading.value = false
    }
  }

  return { list, loading, finished, load }
}''',
    "tsx": '''import { useEffect, useState } from 'react'

export function useArticle(id: number) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch(`/api/articles/${id}`)
      .then((r) => r.json())
      .then(({ data }) => alive && setArticle(data))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [id])

  return { article, loading }
}''',
    "ts": '''@Controller('articles')
export class ArticleController {
  constructor(private readonly service: ArticleService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id)
  }
}''',
    "vue": '''<script setup lang="ts">
import { computed } from 'vue'
import type { Article } from '@/types'

const props = defineProps<{ article: Article }>()
const emit = defineEmits<{ (e: 'open', id: number): void }>()

const meta = computed(() => `${props.article.views} 阅读 · ${props.article.likes} 点赞`)
</script>

<template>
  <article class="card" @click="emit('open', article.id)">
    <h3>{{ article.title }}</h3>
    <p>{{ article.summary }}</p>
    <span>{{ meta }}</span>
  </article>
</template>''',
    "go": '''func (h *ArticleHandler) Detail(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"code": 400, "msg": "invalid id"})
		return
	}

	cacheKey := fmt.Sprintf("article:%d", id)
	if raw, err := h.rdb.Get(c, cacheKey).Result(); err == nil {
		c.Data(http.StatusOK, "application/json", []byte(raw))
		return
	}

	article, err := h.repo.FindByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"code": 404, "msg": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 0, "data": article, "msg": "ok"})
}''',
    "rust": '''use axum::{extract::{Path, State}, Json};
use serde_json::{json, Value};

pub async fn detail(Path(id): Path<i64>, state: State<AppState>) -> Json<Value> {
    let key = format!("article:{id}");
    if let Ok(Some(cached)) = state.cache.get(&key).await {
        return Json(serde_json::from_str(&cached).unwrap());
    }

    let article = sqlx::query_as!(Article, "SELECT * FROM articles WHERE id = ?", id)
        .fetch_one(&state.pool)
        .await
        .expect("query failed");

    Json(json!({ "code": 0, "data": article, "msg": "ok" }))
}''',
    "java": '''@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleMapper articleMapper;
    private final StringRedisTemplate redisTemplate;

    @Cacheable(value = "article", key = "#id", unless = "#result == null")
    public ArticleVO detail(Long id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BizException(404, "文章不存在");
        }
        redisTemplate.opsForZSet().incrementScore("article:hot", String.valueOf(id), 1);
        return ArticleConverter.toVO(article);
    }
}''',
    "javascript": '''export async function fetchArticles({ page = 1, size = 10, tagId } = {}) {
  const params = new URLSearchParams({ page, size })
  if (tagId) params.set('tag_id', tagId)

  const res = await fetch(`/api/articles?${params}`)
  if (!res.ok) throw new Error(`request failed: ${res.status}`)

  const { code, data, msg } = await res.json()
  if (code !== 0) throw new Error(msg)
  return data
}''',
    "sql": '''-- 列表页走覆盖索引，避免回表
EXPLAIN SELECT id, title, summary, author_id, published_at
FROM articles
WHERE status = 1 AND tag_id = 12
ORDER BY published_at DESC
LIMIT 20;

CREATE INDEX idx_status_tag_pub ON articles (status, tag_id, published_at DESC);

-- 优化前 type=ALL rows=3000 Extra=Using filesort
-- 优化后 type=range rows=41   Extra=Using index''',
    "bash": '''# 排查慢查询与缓存命中率
redis-cli --latency -h 127.0.0.1
redis-cli info stats | grep keyspace
mysql -uroot -p -e "SHOW PROCESSLIST; SELECT * FROM information_schema.INNODB_TRX;"

# 压测同一接口，观察 P99 变化
wrk -t8 -c200 -d30s --latency "http://127.0.0.1:8000/api/articles?page=1"''',
    "cpp": '''#include <vector>
#include <atomic>
#include <mutex>

class ShardQueue {
public:
    explicit ShardQueue(size_t n) : shards_(n) {}

    void push(Task&& t) {
        auto& q = shards_[std::hash<std::thread::id>{}(std::this_thread::get_id()) % shards_.size()];
        std::lock_guard<std::mutex> lk(q.mtx);
        q.tasks.push_back(std::move(t));
    }

private:
    struct Shard { std::mutex mtx; std::vector<Task> tasks; };
    std::vector<Shard> shards_;
};''',
    "kotlin": '''class ArticleService(private val repo: ArticleRepository) {

    suspend fun detail(id: Long): Article? = coroutineScope {
        val cached = async(Dispatchers.IO) { redis.get("article:$id") }
        cached.await() ?: repo.findById(id)?.also { redis.setex("article:$id", 300, it) }
    }
}''',
    "swift": '''struct ArticleService {
    func detail(id: Int) async throws -> Article {
        let (data, _) = try await URLSession.shared.data(from: endpoint(id))
        return try JSONDecoder().decode(Response<Article>.self, from: data).data
    }
}''',
    "csharp": '''public class ArticleController : ControllerBase
{
    private readonly IArticleService _service;

    public ArticleController(IArticleService service) => _service = service;

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ArticleDto>> Detail(int id)
    {
        var article = await _service.GetAsync(id);
        return article is null ? NotFound() : Ok(article);
    }
}''',
}

BODY_INTRO = [
    "这篇文章来自一次真实的线上问题复盘：接口在流量高峰被拖垮，排查下来问题并不在业务代码，而在我们一直忽略的边界条件。",
    "团队最近把核心链路重做了一遍，从选型到落地踩了不少坑，这里把完整过程和数据留下来，希望对正在做同类改造的同学有帮助。",
    "读源码的时候顺手记了笔记，整理成这篇。文中的结论都对照了官方实现和线上压测数据，不是凭感觉写的。",
    "业务增长到一定量级之后，很多“看起来能用”的写法会突然变成瓶颈。这篇把定位过程、验证手段和最终方案完整写了一遍。",
]

BODY_BG = [
    "项目一开始只有几千条数据，所有查询都能在 10ms 内返回。半年后数据量涨到百万级，接口 P99 直接从 80ms 跳到 900ms，告警整晚没停过。",
    "我们做的事并不复杂：一个内容列表、一个详情、一个用户态。看起来没有多少技术含量，但正是这些“简单”的查询在高并发下暴露了所有隐藏问题。",
    "需求本身很朴素 —— 让用户更快地看到想看的文章。为了这个目标，我们重写了请求层、缓存层和数据访问层三块。",
]

PITFALLS = [
    "**坑一：异步上下文里丢了事务。** SQLAlchemy 的 AsyncSession 不是线程安全的，把 session 塞进后台任务后，整个请求的事务直接失效。",
    "**坑二：缓存击穿。** 热点文章的 key 过期瞬间，几百个请求同时打到 MySQL，后来用逻辑过期 + 互斥锁兜住。",
    "**坑三：分页越界。** 前端传了 `page=0`，后端 SQL 变成 `LIMIT -10`，直接报语法错误。参数校验必须在入口做完。",
    "**坑四：N+1 查询。** 列表接口默认懒加载作者信息，20 条文章发了 21 条 SQL，改用 `selectinload` 之后降到 2 条。",
]

SUMMARIES = [
    "改造做完之后，接口 P99 明显下降，数据库 CPU 峰值降低了一半以上。真正的收益不是某个“银弹技术”，而是把边界条件一个个补上。",
    "回头看，最有价值的不是最后的方案，而是建立了一套可复用的定位流程：先量化、再验证、最后才改代码。",
    "如果只能带走一句话：**先让问题可观测，再谈优化**。没有数据支撑的优化大多只是换个地方踩坑。",
]


def article_content(a, tag_name, category):
    rnd = random.Random(int(a[0]) * 7919)
    lang = LANG_OF.get(tag_name, "bash")
    summary = a[2]
    code = CODE.get(lang, CODE["bash"])
    intro = rnd.choice(BODY_INTRO)
    bg = rnd.choice(BODY_BG)
    picks = sorted(rnd.sample(range(len(PITFALLS)), 3))
    p1, p2, p3 = (PITFALLS[index] for index in picks)
    before = rnd.randint(380, 960)
    after = int(before * rnd.uniform(0.18, 0.42))
    mem_before = rnd.randint(18, 42) / 10
    mem_after = round(mem_before * rnd.uniform(0.55, 0.8), 1)
    qps = rnd.randint(800, 9000)

    return f"""> {summary}

## 背景

{bg}

我们面对的是一个日均 {qps} 次请求的{category}服务，技术栈以 {tag_name} 为主。{intro}

## 现象与定位

问题最早出现在监控大盘上：P99 在晚高峰突然拉起，但 CPU、内存、连接数都没有明显异常。逐层排查后，瓶颈集中在三处：

1. 列表接口每次都做全表排序，`ORDER BY` 打满了临时表空间；
2. 详情接口的缓存 key 设计过粗，热点文章无法独立过期；
3. 前端返回列表时重复请求同一批作者信息，放大了后端压力。

先用 `EXPLAIN` 和链路追踪把问题量化，再动代码 —— 这一步很关键，否则很容易优化错方向。

## 关键实现

核心改动集中在数据访问层，下面是最终落地的写法：

```{lang}
{code}
```

几个必须注意的实现细节：

1. **参数校验前置**：所有分页、排序参数在进入 service 前完成归一化，杜绝 `page=0` 之类的脏输入。
2. **读写分离**：列表和详情读从库，写操作走主库，主从延迟用 `published_at` 做兜底判断。
3. **缓存分层**：本地 LRU 挡第一层，Redis 挡第二层，数据库只承接穿透流量。

## 数据对比

| 指标 | 改造前 | 改造后 | 变化 |
| --- | --- | --- | --- |
| P99 延迟 | {before} ms | {after} ms | -{round((1 - after / before) * 100)}% |
| 内存峰值 | {mem_before} GB | {mem_after} GB | -{round((1 - mem_after / mem_before) * 100)}% |
| 慢查询数 / 小时 | {rnd.randint(120, 900)} | {rnd.randint(0, 6)} | 基本清零 |
| 错误率 | {round(rnd.uniform(0.1, 0.6), 2)}% | {round(rnd.uniform(0.01, 0.05), 2)}% | -90% 以上 |

## 踩坑记录

{p1}

{p2}

{p3}

## 总结

{SUMMARIES[int(a[0]) % len(SUMMARIES)]}

如果你也在做类似的改造，建议先跑一次压测建立基线，再逐项替换 —— 一次改太多，出问题时很难定位是谁的锅。
"""


tag_by_id = {t[0]: t for t in tags}
articles_out = []
for a in articles:
    (aid, title, summary, _content, category, tag_id, author_id,
     views, likes, comments, favs, status, pub, _created, _updated) = a
    tag_name = tag_by_id[tag_id][1] if tag_id in tag_by_id else ""
    articles_out.append({
        "id": aid,
        "title": title.replace("''", "'"),
        "summary": summary.replace("''", "'"),
        "content": article_content(a, tag_name, category),
        "category": category,
        "tag_id": tag_id,
        "tag_name": tag_name,
        "author_id": author_id,
        "views": views,
        "likes": likes,
        "comments": comments,
        "favorites": favs,
        "status": status,
        "published_at": pub,
    })

# 标签真实文章数（与 articles 保持一致，避免“标签显示 500 篇、点进去 0 篇”）
tag_count = {}
author_count = {}
for art in articles_out:
    tag_count[art["tag_id"]] = tag_count.get(art["tag_id"], 0) + 1
    author_count[art["author_id"]] = author_count.get(art["author_id"], 0) + 1

tags_out = [
    {
        "id": t[0],
        "name": t[1],
        "description": t[2],
        "color": t[3],
        "article_count": tag_count.get(t[0], 0),
        "created_at": t[5],
    }
    for t in tags
]

authors_out = [
    {
        "id": a[0],
        "nickname": a[1],
        "real_name": a[2],
        "company": a[3],
        "title": a[4],
        "bio": a[5],
        "followers": a[6],
        "article_count": author_count.get(a[0], 0),
        "created_at": a[8],
    }
    for a in authors
]

demo_users = [
    {
        "id": u[0],
        "username": u[1],
        "password": f"pass{u[0]}",
        "email": u[3],
        "nickname": u[4],
        "points": u[5],
        "created_at": u[6],
    }
    for u in users[:8]
]

# 演示账号 user_0001 / user_0002 的收藏与浏览足迹
favs_by_user = {1: [], 2: []}
for f in favorites:
    _, uid, aid, created_at = f
    if uid in favs_by_user and len(favs_by_user[uid]) < 60:
        favs_by_user[uid].append({"article_id": aid, "created_at": created_at})

hist_by_user = {1: [], 2: []}
for h in hist:
    _, uid, aid, viewed_at = h
    if uid in hist_by_user and len(hist_by_user[uid]) < 140:
        hist_by_user[uid].append({"article_id": aid, "viewed_at": viewed_at})


def dump(name, data):
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{name:22s} {len(json.dumps(data, ensure_ascii=False)) / 1024:9.1f} KB")


dump("articles.json", articles_out)
dump("tags.json", tags_out)
dump("authors.json", authors_out)
dump("users.json", demo_users)
dump("favorites.json", favs_by_user)
dump("history.json", hist_by_user)
dump("categories.json", [{"name": name} for name in CATEGS])
print("done:", OUT)
