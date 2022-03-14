/* eslint-disable no-return-assign */
import axios from 'axios'
import { message } from 'antd'

function request (baseUrl: string, method: 'get' | 'post' | 'put' | 'delete', url: string, options: any, showError?: boolean): any
async function request (baseUrl, method, url, options, showError) {
  async function req () {
    try {
      const res = await axios({
        ...options,
        method,
        headers: { 'dian-referer-uri': location.pathname, 'app-code': 'diana_admin' },
        url,
        baseURL: baseUrl,
        withCredentials: true,
      })
      const { data } = res
      if (data.success === false) {
        throw data.msg || '服务器异常'
      }
      return data
    } catch (error) {
      let msg = typeof error === 'string' ? error : error.message
      if (error.response) {
        const { data, status } = error.response
        if (status === 401) {
          window.history.pushState(null, null, '/login')
        }
        if (data) {
          msg = data.msg
        } else {
          msg = error.message
        }
      }
      if (showError) {
        message.error(msg)
      }
      throw msg
    }
  }

  return await req()
}

const extendRequestMethods = (baseUrl: string): any => {
  return {
    download (url: string): void {
      location.href = baseUrl + url
    },
    async downloadPOST (url: string, data: any = {}, showError = true) {
      const res = await request(baseUrl, 'post', url, { data, responseType: 'blob' }, showError)
      const blob = new Blob([res], { type: 'application/octet-stream' })
      const downloadElement = document.createElement('a')
      const href = window.URL.createObjectURL(blob)
      downloadElement.href = href
      downloadElement.download = `config-${Date.now()}.zip`
      document.body.appendChild(downloadElement)
      downloadElement.click()
      document.body.removeChild(downloadElement)
      window.URL.revokeObjectURL(href)
    },
    upload (url: string, file: any, params: any = {}, showError = true): any {
      const data = new FormData()
      data.append('file', file)
      Object.keys(params).forEach((key) => {
        data.append(key, params[key])
      })
      const options = {
        contentType: 'multipart/form-data',
        data: data,
      }

      return request(baseUrl, 'post', url, options, showError)
    },
  }
}

export default extendRequestMethods
