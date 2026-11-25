import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * 无限滚动：把哨兵元素交给 IntersectionObserver，
 * 列表底部进入视口时触发加载，避免一次性渲染 3000 条（方案 5.5）。
 */
export function useInfiniteScroll(target: Ref<HTMLElement | null>, onReach: () => void, enabled: Ref<boolean>) {
  const observer = ref<IntersectionObserver | null>(null)

  const start = (): void => {
    if (!target.value || observer.value) return
    observer.value = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && enabled.value) {
          onReach()
        }
      },
      { rootMargin: '240px 0px' },
    )
    observer.value.observe(target.value)
  }

  const stop = (): void => {
    observer.value?.disconnect()
    observer.value = null
  }

  onMounted(start)
  onBeforeUnmount(stop)

  return { start, stop }
}
