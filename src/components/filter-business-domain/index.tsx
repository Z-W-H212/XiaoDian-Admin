import { getBusinessDomain, IBusinessDomain } from '@/services/admin/databse'
import { Menu } from 'antd'
import { useCallback, useEffect, useState } from 'react'

interface Props {
  onSelected (key): void
}

export function FilterBusinessDomain (props: Props) {
  const [record, setRecord] = useState<IBusinessDomain[]>([])

  const makeRequest = useCallback(async () => {
    const result = await getBusinessDomain()
    setRecord(result)
  }, [])

  useEffect(() => {
    makeRequest()
  }, [])

  return (
    <Menu
      defaultSelectedKeys={['ALL']}
      onSelect={e => props.onSelected(e.key === 'ALL' ? null : e.key)}
    >
      <Menu.Item key="ALL">全部</Menu.Item>
      {record.map(e => (
        <Menu.Item key={e.domainId}>{e.domainName}</Menu.Item>
      ))}
    </Menu>
  )
}
