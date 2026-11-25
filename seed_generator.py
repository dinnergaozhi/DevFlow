#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
技术博客/文章聚合系统 —— 造数脚本
内核沿用: FastAPI + SQLAlchemy(异步) + MySQL + Redis
实体映射: 新闻->articles  分类->tags  新增 authors 维度

用法:
  1) 只导出 SQL（默认）:
     python seed_generator.py --out blog_seed_data.sql
  2) 自定义规模:
     python seed_generator.py --articles 5000 --users 2000 --authors 200 --favorites 20000 --history 80000
  3) 直连 MySQL 异步灌库（需 pip install aiomysql）:
     python seed_generator.py --mysql "mysql://root:123456@127.0.0.1:3306/toutiao_blog"
  默认密码规则: pass{用户ID}，如 user_0001 -> pass1
"""
import argparse, random, hashlib, datetime, asyncio, re

# ---------------- 词库 ----------------
LANGS=["Python","Go","Rust","Java","JavaScript","TypeScript","C++","Kotlin","Swift","C#"]
FRAMEWORKS=["FastAPI","Django","Flask","Spring Boot","Gin","Echo","React","Vue","Next.js","NestJS","Actix","Axum"]
TOPICS=["异步编程","协程","并发模型","微服务","容器化","Kubernetes","DevOps","CI/CD","单元测试","性能调优","内存管理","缓存策略","消息队列","Kafka","RabbitMQ","Redis","MySQL","PostgreSQL","MongoDB","数据库索引","事务隔离","分库分表","读写分离","ORM","SQLAlchemy","连接池","限流熔断","负载均衡","服务发现","链路追踪","日志系统","监控告警","GraphQL","RESTful","WebSocket","gRPC","OAuth2","JWT","爬虫","设计模式","代码重构","领域驱动","RAG","大模型微调","向量数据库","Embedding","提示工程"]
ACTIONS=["踩坑记","实战总结","原理解析","源码阅读","性能优化","从0到1","最佳实践","避坑指南","深度剖析","入门到精通"]
COMPANIES=["阿里云","字节跳动","腾讯","美团","京东","滴滴","B站","网易","小米","快手"]
SURNAME=list("林陈王李张刘赵孙周吴郑冯蒋沈韩杨朱秦许何")
NICKS=["代码","编程","算法","后端","全栈","极客","螺丝","咖啡","夜灯","山客","拾光","长风","青崖","半夏","孤舟","无涯","知行","墨白"]
CATEGS=["后端","前端","数据库","云原生","AI/大模型","算法","工程效能","安全"]

def esc(s): return str(s).replace("\\","\\\\").replace("'","''")
def pwd(pw): return hashlib.sha256((pw+"|salt").encode()).hexdigest()

def gen(seed, n_articles, n_users, n_authors, n_fav, n_hist):
    random.seed(seed)
    now=datetime.datetime(2026,11,25,8,0,0)
    def rd(back=720,hour=False):
        d=now-datetime.timedelta(days=random.randint(1,back),hours=random.randint(0,23) if hour else 0,minutes=random.randint(0,59),seconds=random.randint(0,59))
        return d.strftime("%Y-%m-%d %H:%M:%S")

    tag_names=list(dict.fromkeys(LANGS+FRAMEWORKS+TOPICS))
    tags=[(i,n,f"{n}相关技术文章","#%06x"%random.randint(0xFFFFFF),random.randint(5,800),rd(400)) for i,n in enumerate(tag_names,1)]

    authors=[]
    for i in range(1,n_authors+1):
        nick=random.choice(NICKS)+random.choice(["","哥","君","叔","同学","的随笔","笔记","小站"])
        real=random.choice(SURNAME)+random.choice("工明伟芳磊洋静强")
        comp=(random.choice(COMPANIES)+"技术团队") if random.random()<0.4 else ""
        title=random.choice(["后端工程师","全栈工程师","架构师","技术专家","高级开发","初级开发","实习生","独立开发者"])
        bio=f"专注 {random.choice(LANGS+FRAMEWORKS)} 与 {random.choice(TOPICS)}"
        authors.append((i,esc(nick),esc(real),esc(comp),esc(title),esc(bio),random.randint(0,50000),random.randint(1,300),rd(600)))

    users=[]
    for i in range(1,n_users+1):
        u=f"user_{i:04d}"; e=f"{u}@{random.choice(['qq.com','163.com','gmail.com'])}"
        users.append((i,esc(u),pwd(f"pass{i}"),esc(e),esc(random.choice(NICKS)+random.choice(["","_cn","_dev"])),random.randint(0,300),rd(600)))

    articles=[]; tset=set()
    for i in range(1,n_articles+1):
        while True:
            t1=random.choice(LANGS+FRAMEWORKS+TOPICS); t2=random.choice(LANGS+FRAMEWORKS+TOPICS)
            title=f"{t1} {random.choice(ACTIONS)}：{t2}实践"
            if title not in tset: tset.add(title); break
        views=random.randint(1,120000) if random.random()<0.8 else random.randint(120000,900000)
        likes=int(views*random.uniform(0.01,0.08)); cmts=int(likes*0.2); favs=int(likes*0.3)
        summary=f"本文围绕 {t1} 展开，结合 {t2} 场景，适合进阶读者。"
        content=f"# {title}\n\n## 背景\n{summary}\n\n## 正文\n关于 {t2} 的工程实践与 {random.choice(TOPICS)} 优化。\n\n## 结论\n关键在于 {random.choice(TOPICS)}。"
        status=1
        if random.random()<0.05: status=0
        elif random.random()<0.05: status=2
        pub=rd(700)
        articles.append((i,esc(title),esc(summary),esc(content),esc(random.choice(CATEGS)),random.randint(1,len(tags)),random.randint(1,n_authors),views,likes,cmts,favs,status,pub,pub,pub))

    favorites=[]; fset=set(); fid=0
    while len(favorites)<n_fav:
        uid=random.randint(1,n_users); aid=random.randint(1,n_articles)
        if (uid,aid) in fset: continue
        fset.add((uid,aid)); fid+=1; favorites.append((fid,uid,aid,rd(300,hour=True)))

    hist=[]; hset=set(); hid=0
    while len(hist)<n_hist:
        uid=random.randint(1,n_users); aid=random.randint(1,n_articles); key=(uid,aid)
        if key in hset and random.random()<0.7: continue
        hset.add(key); hid+=1; hist.append((hid,uid,aid,rd(120,hour=True)))

    return tags,authors,users,articles,favorites,hist

SCHEMA=re.sub(r"\n\s*\n","\n",open("blog_seed_data.sql").read() if os.path.exists("blog_seed_data.sql") else "")  # 可选
SCHEMA_DDL="""
DROP TABLE IF EXISTS favorites, browse_history, articles, tags, authors, users;
CREATE TABLE authors(id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,nickname VARCHAR(64) NOT NULL,real_name VARCHAR(64) DEFAULT '',company VARCHAR(128) DEFAULT '',title VARCHAR(64) DEFAULT '',bio VARCHAR(255) DEFAULT '',followers INT UNSIGNED DEFAULT 0,article_count INT UNSIGNED DEFAULT 0,created_at DATETIME NOT NULL,KEY idx_followers(followers))ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE tags(id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,name VARCHAR(64) NOT NULL UNIQUE,description VARCHAR(255) DEFAULT '',color VARCHAR(16) DEFAULT '#1890ff',article_count INT UNSIGNED DEFAULT 0,created_at DATETIME NOT NULL)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE users(id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,username VARCHAR(64) NOT NULL UNIQUE,password_hash VARCHAR(128) NOT NULL,email VARCHAR(128) NOT NULL UNIQUE,nickname VARCHAR(64) DEFAULT '',points INT UNSIGNED DEFAULT 0,created_at DATETIME NOT NULL)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE articles(id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,title VARCHAR(255) NOT NULL,summary VARCHAR(255) DEFAULT '',content MEDIUMTEXT NOT NULL,category VARCHAR(32) DEFAULT '',tag_id INT UNSIGNED,author_id INT UNSIGNED,views INT UNSIGNED DEFAULT 0,likes INT UNSIGNED DEFAULT 0,comments INT UNSIGNED DEFAULT 0,favorites INT UNSIGNED DEFAULT 0,status TINYINT DEFAULT 1,published_at DATETIME,created_at DATETIME NOT NULL,updated_at DATETIME NOT NULL,KEY idx_tag(tag_id),KEY idx_author(author_id),KEY idx_status_pub(status,published_at),KEY idx_views(views),FULLTEXT KEY ft(title,summary))ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE favorites(id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,user_id INT UNSIGNED NOT NULL,article_id INT UNSIGNED NOT NULL,created_at DATETIME NOT NULL,UNIQUE KEY uk(user_id,article_id),KEY idx_article(article_id))ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE browse_history(id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,user_id INT UNSIGNED NOT NULL,article_id INT UNSIGNED NOT NULL,viewed_at DATETIME NOT NULL,KEY idx_user_time(user_id,viewed_at),KEY idx_article(article_id))ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

def to_sql(t,a,u,art,f,h,out):
    def row(r): return "("+",".join(str(c) if isinstance(c,int) else "'"+str(c)+"'") for c in r)+")"
    def vals(rows): return [row(r) for r in rows]
    def block(f,table,cols,rows,chunk=200):
        v=vals(rows); head=f"INSERT INTO {table} ({','.join(cols)}) VALUES\n"
        for j in range(0,len(v),chunk):
            f.write(head+",\n".join(v[j:j+chunk])+";\n\n")
    with open(out,"w",encoding="utf-8") as f:
        f.write("SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n"+SCHEMA_DDL+"\n")
        block(f,"authors",["id","nickname","real_name","company","title","bio","followers","article_count","created_at"],a)
        block(f,"tags",["id","name","description","color","article_count","created_at"],t)
        block(f,"users",["id","username","password_hash","email","nickname","points","created_at"],u)
        block(f,"articles",["id","title","summary","content","category","tag_id","author_id","views","likes","comments","favorites","status","published_at","created_at","updated_at"],art,100)
        block(f,"favorites",["id","user_id","article_id","created_at"],f,1000)
        block(f,"browse_history",["id","user_id","article_id","viewed_at"],h,1000)
    print("已写出",out)

async def to_mysql(t,a,u,art,f,h,dsn):
    import aiomysql
    m=re.match(r"mysql://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(\w+)",dsn)
    user,pw,host,port,db=m.group(1),m.group(2),m.group(3),int(m.group(4) or 3306),m.group(5)
    conn=await aiomysql.connect(host=host,port=port,user=user,password=***
    cur=await conn.cursor()
    for stmt in [s.strip() for s in SCHEMA_DDL.split(";") if s.strip()]:
        await cur.execute(stmt)
    def insert(table,cols,rows):
        ph=",".join(["%s"]*len(cols)); sql=f"INSERT INTO {table} ({','.join(cols)}) VALUES ({ph})"
        await cur.executemany(sql,rows)
    await insert("authors","id,nickname,real_name,company,title,bio,followers,article_count,created_at".split(","),a)
    await insert("tags","id,name,description,color,article_count,created_at".split(","),t)
    await insert("users","id,username,password_hash,email,nickname,points,created_at".split(","),u)
    await insert("articles","id,title,summary,content,category,tag_id,author_id,views,likes,comments,favorites,status,published_at,created_at,updated_at".split(","),art)
    await insert("favorites","id,user_id,article_id,created_at".split(","),f)
    await insert("browse_history","id,user_id,article_id,viewed_at".split(","),h)
    await conn.commit(); cur.close(); conn.close()
    print("已灌库到",db)

import os
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--seed",type=int,default=20261125)
    p.add_argument("--articles",type=int,default=3000)
    p.add_argument("--users",type=int,default=800)
    p.add_argument("--authors",type=int,default=120)
    p.add_argument("--favorites",type=int,default=8000)
    p.add_argument("--history",type=int,default=30000)
    p.add_argument("--out",default="blog_seed_data.sql")
    p.add_argument("--mysql",help="mysql://user:pass@host:port/db 直连灌库")
    x=p.parse_args()
    data=gen(x.seed,x.articles,x.users,x.authors,x.favorites,x.history)
    if x.mysql: asyncio.run(to_mysql(*data,x.mysql))
    else: to_sql(*data,x.out)
