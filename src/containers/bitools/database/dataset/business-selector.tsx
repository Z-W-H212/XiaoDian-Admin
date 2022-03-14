import { Divider, Input, Select, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { IBusinessDomain } from '@/services/admin/databse'

interface Props {
  data: IBusinessDomain[]
  value?: string
  onChange?(): void
  onCreate (name: string): void
}

export function BusinessSelector (props: Props) {
  const { data, value, onChange, onCreate } = props
  const [busniessName, setBusniessName] = useState('')
  return (
    <Select
      style={{ width: 240 }}
      placeholder="选择或添加业务域"
      value={value}
      onChange={onChange}
      allowClear
      dropdownRender={menu => (
        <div>
          {menu}
          <Divider style={{ margin: '4px 0' }} />
          <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
            <Input style={{ flex: 'auto' }} value={busniessName} onChange={e => setBusniessName(e.target.value)} />
            <a
              style={{ flex: 'none', padding: '8px', display: 'block', cursor: 'pointer' }}
              onClick={() => {
                if (busniessName) {
                  onCreate(busniessName)
                  setBusniessName('')
                } else {
                  message.warn('业务域不能为空')
                }
              }}
            >
              <PlusOutlined /> 添加业务域
            </a>
          </div>
        </div>
      )}
    >
      {data.map(e => (
        <Select.Option key={e.domainId} value={e.domainId}>{e.domainName}</Select.Option>
      ))}
    </Select>
  )
}
