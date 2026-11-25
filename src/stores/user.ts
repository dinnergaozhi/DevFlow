import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { storage } from '@/utils/storage'
import { TOKEN_STORAGE_KEY } from '@/utils/request'
import type { LoginPayload, RegisterPayload, User } from '@/types'

/**
 * 用户态 store（方案 5.2）：只放跨页面共享的登录信息与 token。
 * 文章详情这类页面级数据不放 store，直接用组件内的 ref。
 */
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(storage.get<string>(TOKEN_STORAGE_KEY, ''))
  const profile = ref<User | null>(storage.get<User | null>('user', null))

  const isLogin = computed(() => Boolean(token.value))
  const displayName = computed(() => profile.value?.nickname || profile.value?.username || '游客')

  function persist(nextToken: string, user: User): void {
    token.value = nextToken
    profile.value = user
    storage.set(TOKEN_STORAGE_KEY, nextToken)
    storage.set('user', user)
  }

  async function login(payload: LoginPayload): Promise<User> {
    const result = await authApi.login(payload)
    persist(result.token, result.user)
    return result.user
  }

  async function register(payload: RegisterPayload): Promise<User> {
    const result = await authApi.register(payload)
    persist(result.token, result.user)
    return result.user
  }

  async function refresh(): Promise<void> {
    if (!token.value) return
    try {
      const user = await authApi.fetchProfile()
      profile.value = user
      storage.set('user', user)
    } catch {
      logout()
    }
  }

  function logout(): void {
    token.value = ''
    profile.value = null
    storage.remove(TOKEN_STORAGE_KEY)
    storage.remove('user')
  }

  return { token, profile, isLogin, displayName, login, register, refresh, logout, persist }
})
