import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LoginResult } from '@/types/api'

function normalizeAvatar(avatar?: string): string {
  if (!avatar) return ''
  if (avatar.startsWith('https://api.dicebear.com')) return ''
  return avatar
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<LoginResult['userInfo'] | null>(
    (() => {
      try {
        const data = JSON.parse(localStorage.getItem('userInfo') || 'null')
        if (data) {
          data.avatar = normalizeAvatar(data.avatar)
          localStorage.setItem('userInfo', JSON.stringify(data))
        }
        return data
      } catch {
        return null
      }
    })()
  )

  function setLoginData(data: LoginResult) {
    data.userInfo.avatar = normalizeAvatar(data.userInfo.avatar)
    token.value = data.token
    userInfo.value = data.userInfo
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data.userInfo))
  }

  function updateUserAvatar(avatarUrl: string) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, avatar: avatarUrl }
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return { token, userInfo, setLoginData, updateUserAvatar, logout }
})