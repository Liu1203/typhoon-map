import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoginResult } from '@/types/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<LoginResult['userInfo'] | null>(
    JSON.parse(localStorage.getItem('userInfo') || 'null')
  )

  function setLoginData(data: LoginResult) {
    token.value = data.token
    userInfo.value = data.userInfo
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data.userInfo))
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return { token, userInfo, setLoginData, logout }
})