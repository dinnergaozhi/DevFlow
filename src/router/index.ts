import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/HomeFeed.vue'),
    meta: { title: '首页信息流', layout: 'default' },
  },
  {
    path: '/articles',
    name: 'articles',
    component: () => import('@/views/article/ArticleList.vue'),
    meta: { title: '文章列表', layout: 'default' },
  },
  {
    path: '/article/:id(\\d+)',
    name: 'article-detail',
    component: () => import('@/views/article/ArticleDetail.vue'),
    meta: { title: '文章详情', layout: 'default' },
  },
  {
    path: '/tag/:id(\\d+)',
    name: 'tag',
    component: () => import('@/views/tag/TagPage.vue'),
    meta: { title: '标签聚合', layout: 'default' },
  },
  {
    path: '/author/:id(\\d+)',
    name: 'author',
    component: () => import('@/views/author/AuthorPage.vue'),
    meta: { title: '作者主页', layout: 'default' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/user/LoginPage.vue'),
    meta: { title: '登录', layout: 'blank' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/user/RegisterPage.vue'),
    meta: { title: '注册', layout: 'blank' },
  },
  {
    path: '/user/favorites',
    name: 'favorites',
    component: () => import('@/views/user/FavoritesPage.vue'),
    // /user/* 统一要求登录，由全局守卫拦截（方案 5.4）
    meta: { title: '我的收藏', layout: 'default', requiresAuth: true },
  },
  {
    path: '/user/history',
    name: 'history',
    component: () => import('@/views/user/HistoryPage.vue'),
    meta: { title: '浏览足迹', layout: 'default', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/error/NotFound.vue'),
    meta: { title: '页面不存在', layout: 'default' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' }
    // 列表 -> 详情 之类的跳转回到顶部；首页与文章列表互相切换时保留阅读位置
    if (to.path === from.path) return {}
    return { top: 0 }
  },
})

const APP_TITLE = 'AI 掘金头条'

router.beforeEach(async (to) => {
  const userStore = useUserStore()

  // 有 token 但没有用户信息（例如刷新后）时补一次 /auth/me
  if (userStore.isLogin && !userStore.profile) {
    await userStore.refresh()
  }

  if (to.meta.requiresAuth && !userStore.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 已登录用户不再进登录/注册页
  if (userStore.isLogin && (to.name === 'login' || to.name === 'register')) {
    return { path: '/' }
  }

  return true
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = title ? `${title} · ${APP_TITLE}` : APP_TITLE
})

export default router
