import { useEffect, useCallback, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { Spin } from 'antd'
import { parse } from 'query-string'
import { dcapi } from '@/utils/axios'
import { isLocalEnv } from '@dian/app-utils'
import { env } from '@/env/admin'

function Login () {
  const location = useLocation()
  const history = useHistory()
  const qs = parse(location.search)
  const [userData, setUserData] = useState(null)

  const setCookieByTicket = useCallback(async (ticket) => {
    await dcapi.post('/gateway/auth/v1/permission/setAsCookie', { ticket })
    return ticket
  }, [])

  const getUserProps = useCallback(async (ticket) => {
    const result = await dcapi.get('/diana/user/v1/getUserProps')
    setUserData(result)
  }, [])

  useEffect(() => {
    if (!qs.ticket) {
      const url = `${env.dcapi}/gateway/auth/login?client_id=10003&callback=${window.location.origin}/login`
      window.location.href = url
    } else {
      if (isLocalEnv()) {
        setCookieByTicket(qs.ticket).then(getUserProps)
      } else {
        getUserProps()
      }
    }
  }, [qs])

  useEffect(() => {
    if (userData) {
      window.localStorage.setItem('token', qs.ticket)
      window.localStorage.setItem('role', 'admin')
      window.localStorage.setItem('userInfo', JSON.stringify(userData.userInfo))
      history.replace('/')
    }
  }, [qs.ticket, userData])

  // if (userData && userData.adminModal === 0) {
  //   return (
  //     <div style={{ position: 'absolute', left: '50%', background: '#fff', width: '500px', marginLeft: '-250px', height: '500px', marginTop: '10%', borderRadius: '20px' }}>
  //       <Result
  //         status="403"
  //         title="没有权限"
  //         subTitle="很抱歉，您没有访问数据后台的权限，请向主管或HR申请"
  //       />
  //     </div>
  //   )
  // }

  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%' }}>
      <Spin tip="发电中" />
    </div>
  )
}

export default Login
