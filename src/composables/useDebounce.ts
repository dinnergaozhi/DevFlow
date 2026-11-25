import { onBeforeUnmount, ref } from 'vue'

/**
 * 输入防抖：搜索框、筛选条件用它可以显著减少请求次数。
 * 返回的 fn 带 cancel，组件卸载时记得调用。
 */
export function useDebounce<A extends unknown[]>(fn: (...args: A) => void, delay = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: A): void => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delay)
  }

  const cancel = (): void => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  onBeforeUnmount(cancel)

  return { debounced, cancel }
}

/** 防抖后的 ref，v-model 双向绑定输入框时使用 */
export function useDebouncedRef<T>(initial: T, delay = 300) {
  const raw = ref(initial)
  const debounced = ref(initial)
  let timer: ReturnType<typeof setTimeout> | null = null

  const stop = (next: T): void => {
    raw.value = next
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = next
    }, delay)
  }

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { raw, debounced, stop }
}
