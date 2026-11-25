<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import SectionCard from '@/components/common/SectionCard.vue'
import HotRank from '@/components/common/HotRank.vue'
import TagChip from '@/components/common/TagChip.vue'
import AuthorAvatar from '@/components/common/AuthorAvatar.vue'
import { getHotArticles } from '@/api/article'
import { getAuthors, getSiteStats, getTags } from '@/api/tag'
import { formatCount } from '@/utils/format'
import { toast } from '@/utils/feedback'
import type { Article, Author, SiteStats, Tag } from '@/types'

const hot = ref<Article[]>([])
const tags = ref<Tag[]>([])
const authors = ref<Author[]>([])
const stats = ref<SiteStats | null>(null)
const loading = ref(true)
const followed = ref<number[]>([])

onMounted(async () => {
  const [hotRes, tagRes, authorRes, statRes] = await Promise.allSettled([
    getHotArticles(8),
    getTags(14),
    getAuthors({ sort: 'followers', limit: 5 }),
    getSiteStats(),
  ])
  if (hotRes.status === 'fulfilled') hot.value = hotRes.value
  if (tagRes.status === 'fulfilled') tags.value = tagRes.value
  if (authorRes.status === 'fulfilled') authors.value = authorRes.value
  if (statRes.status === 'fulfilled') stats.value = statRes.value
  loading.value = false
})

function toggleFollow(id: number): void {
  followed.value = followed.value.includes(id)
    ? followed.value.filter((item) => item !== id)
    : [...followed.value, id]
  toast.success(followed.value.includes(id) ? '已关注该作者' : '已取消关注')
}
</script>

<template>
  <aside class="sidebar">
    <SectionCard title="今日热榜" more-text="更多" more-to="/articles?sort=hot">
      <div v-if="loading" class="skeleton">
        <el-skeleton :rows="6" animated />
      </div>
      <HotRank v-else :articles="hot" />
    </SectionCard>

    <SectionCard title="热门标签" more-text="全部标签" more-to="/articles">
      <div class="tag-cloud">
        <TagChip
          v-for="tag in tags"
          :key="tag.id"
          :name="tag.name"
          :color="tag.color"
          :tag-id="tag.id"
          :count="tag.article_count"
          size="md"
        />
      </div>
    </SectionCard>

    <SectionCard title="值得关注的作者">
      <ul class="author-list">
        <li v-for="author in authors" :key="author.id" class="author-list__item">
          <RouterLink class="author-list__main" :to="`/author/${author.id}`">
            <AuthorAvatar :name="author.nickname" :size="38" />
            <div class="author-list__info">
              <div class="author-list__name text-ellipsis">{{ author.nickname }}</div>
              <div class="author-list__meta text-ellipsis">
                {{ author.company || author.title }} · {{ formatCount(author.followers) }} 关注者
              </div>
            </div>
          </RouterLink>
          <button
            class="follow-btn"
            :class="{ 'is-followed': followed.includes(author.id) }"
            type="button"
            @click="toggleFollow(author.id)"
          >
            <el-icon v-if="!followed.includes(author.id)"><Plus /></el-icon>
            {{ followed.includes(author.id) ? '已关注' : '关注' }}
          </button>
        </li>
      </ul>
    </SectionCard>

    <div class="sidebar-tip">
      <p class="sidebar-tip__title">📚 关于本站</p>
      <p class="sidebar-tip__text">
        聚合 {{ stats?.tags ?? '—' }} 个技术标签与 {{ stats?.authors ?? '—' }} 位作者的文章，按标签、作者、热度多维组织，帮你在碎片时间里读到真正有用的内容。
      </p>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  position: sticky;
  top: calc(var(--header-h) + 20px);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.skeleton {
  padding: 12px 18px 18px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 18px 18px;
}

.author-list {
  padding: 6px 18px 12px;

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;

    & + & {
      border-top: 1px dashed var(--c-border);
    }
  }

  &__main {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  &__info {
    min-width: 0;
  }

  &__name {
    font-size: 13.5px;
    font-weight: 650;
    color: var(--c-text);
  }

  &__meta {
    margin-top: 2px;
    font-size: 11.5px;
    color: var(--c-text-3);
  }
}

.follow-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--c-primary-line);
  border-radius: 999px;
  background: var(--c-primary-weak);
  color: var(--c-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;

  &.is-followed {
    border-color: var(--c-border-strong);
    background: #f5f7fb;
    color: var(--c-text-3);
  }
}

.sidebar-tip {
  padding: 18px;
  border-radius: var(--radius);
  background: linear-gradient(140deg, #eef4ff, #f7f9ff 60%, #fff);
  border: 1px solid var(--c-primary-line);

  &__title {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--c-primary-deep);
  }

  &__text {
    margin-top: 8px;
    font-size: 12.5px;
    line-height: 1.75;
    color: #5b6580;
  }
}

@media (max-width: 1080px) {
  .sidebar {
    position: static;
  }
}
</style>
