import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios'
import { env } from '@/env/admin'
import { message } from 'antd'
import extendRequestMethods from './extend-request-methods'

const errorMessageMap = {
  401: '需要登录',
  403: '用户没有权限',
  404: '请求地址有误',
  500: '服务器错误',
  502: '网关错误',
}

function dispatchErrorMessage (desc) {
  message.error({ content: desc, style: { wordBreak: 'break-all' } })
}

function beforeRequestInterceptor (request: AxiosRequestConfig) {
  return request
}

function errorRequestInterceptor (error) {
  throw error
}

function successResponseInterceptor (response: AxiosResponse) {
  const {
    data: {
      data,
      success,
      msg = null,
      code = null,
      message = null,
    },
  } = response

  if (!success) {
    dispatchErrorMessage(msg || message)
    throw new Error(msg || message)
  }

  if (code === 302) {
    window.location = data
    return
  }

  return data
}

function errorResponseInterceptor (error) {
  if (error.code === 'ECONNABORTED') {
    dispatchErrorMessage('请求超时')
  }

  if (error.response) {
    if (error.response.status === 401) {
      window.location.href = '/login'
    }
    dispatchErrorMessage(errorMessageMap[error.response.status])
  } else {
    dispatchErrorMessage(error.message || error.msg)
  }

  throw new Error(error)
}

function ApiInstanceFactory (baseURL) {
  // create instance
  const instance: AxiosInstance = axios.create({
    baseURL,
    timeout: 120000,
    headers: { Accept: '*/*', 'dian-referer-uri': location.pathname, 'app-code': 'diana_admin' },
    withCredentials: true,
  })

  // add request interceptors
  instance.interceptors.request.use(
    beforeRequestInterceptor,
    errorRequestInterceptor,
  )

  // add response interceptors
  instance.interceptors.response.use(
    successResponseInterceptor,
    errorResponseInterceptor,
  )

  return Object.assign(instance, extendRequestMethods(baseURL))
}

export const z = ApiInstanceFactory(env.z)
export const auth = ApiInstanceFactory(env.auth)
export const dcapi = ApiInstanceFactory(env.dcapi)
export const o = ApiInstanceFactory(env.o)
