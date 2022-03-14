import { dcapi, o } from '@/utils/axios'
import filterParams from '@/utils/filterParams'

export async function getAsRole () {
  const data = await dcapi.get('/diana/data/permission/getAsRole', filterParams())
  return data
}

export async function signout () {
  await dcapi.post('/gateway/auth/logout?client_id=10003')
  return {}
}

export async function delDataPerMission (id) {
  await o.get(`/emily/permission/deleteByIds/${id}`)
  return {}
}

// 获取当前登录用户的基本信息
export const getUserInfo = (function () {
  let userInfo
  return async () => {
    if (userInfo) {
      return await new Promise(resolve => resolve(userInfo))
    }
    userInfo = await dcapi.get('/diana/user/v1/getUserProps')
    return userInfo
  }
}())
