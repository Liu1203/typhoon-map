import { ref } from 'vue'

const saved = localStorage.getItem('theme')
const isDark = ref(saved === 'dark')

document.documentElement.classList.toggle('dark', isDark.value)

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  return { isDark, toggle }
}
