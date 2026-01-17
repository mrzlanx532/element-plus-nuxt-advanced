import { ref } from 'vue'

export function useMinDelay (minDuration = 500) {
  const loading = ref(false)
  let startTime = 0
  let timer: number | null = null

  function start () {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    startTime = Date.now()
    loading.value = true
  }

  function stop () {
    const elapsed = Date.now() - startTime
    const remaining = minDuration - elapsed

    if (remaining > 0) {
      timer = window.setTimeout(() => {
        loading.value = false
      }, remaining)
    } else {
      loading.value = false
    }
  }

  return { loading, start, stop }
}
