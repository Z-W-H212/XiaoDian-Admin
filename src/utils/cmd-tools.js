import { o } from '@/utils/axios'

export default function initCMDTools () {
  window.login = async (mobile, token) => {
    const data = JSON.stringify({ mobile, token: token || '1' })
    await o.post(encodeURI(`/leo/1.0/h5/login?data=${data}&t=${+new Date()}`))
  }
}
