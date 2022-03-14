import { useEffect } from 'react'
import { getUserRoles, changeDataRole } from '@/services/admin/permission-data'
import { getAsRole } from '@/services/permissionService'

import useRequest from '@/hooks/useFetch'

import { Select } from 'antd'
const { Option } = Select

export default function Report (props) {
  const [{ data }, fetchUserRoles] = useRequest(getUserRoles, { data: [] })
  const [, fetchSetRole] = useRequest(changeDataRole)
  const [{ data: roleData }, fethGetAsRole] = useRequest(getAsRole)

  useEffect(() => {
    Promise.all([fethGetAsRole(), fetchUserRoles()])
      .then(([roleData, data]) => {
        const { userId } = roleData || {}
        if (data?.length > 0 && !userId) {
          const { userId, deptId } = data[0]
          fetchSetRole({ asUserId: userId, asDeptId: deptId })
        }
      })
  }, [])

  const onChange = async (value) => {
    const [uid, did] = value.split('-')
    const item = data.find(({ userId, deptId }) => {
      return userId === uid && deptId === did
    })
    const { userId, deptId } = item
    await fetchSetRole({ asUserId: userId, asDeptId: deptId })
    location.reload()
  }

  if (!data || data.length === 0) {
    return <span>（暂无）</span>
  }

  const { userId, deptId } = roleData || {}
  const selectedVal = `${userId}-${deptId}`

  return (
    <Select {...props} className="select-size-l" value={selectedVal} onChange={onChange}>
      {data.map((item) => {
        const { userId, nickName, deptId, departName } = item
        const key = `${userId}-${deptId}`
        return <Option key={key} value={key}>{nickName}-{departName}</Option>
      })}
    </Select>
  )
}
