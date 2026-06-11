import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/api'
import { message } from '@/utils/message'  // 导入独立消息实例

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 10_000,
})

// 请求拦截器（保持不变）
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse<any>
    if (res.code !== 200) {
      message.error(res.message || '请求失败')   // ✅ 这里不再报错
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return response
  },
  (error: AxiosError) => {
    message.error('网络异常，请稍后重试')        // ✅ 这里也一样
    return Promise.reject(error)
  }
)

export default http

// get/post 泛型封装（保持你的代码不变）
export async function get<T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.get<ApiResponse<T>>(url, { params, ...config })
  return response.data.data
}

export async function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.post<ApiResponse<T>>(url, data, config)
  return response.data.data
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await http.delete<ApiResponse<T>>(url, config)
  return response.data.data
}