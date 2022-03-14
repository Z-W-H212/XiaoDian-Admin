import { useState, useMemo } from 'react'
import { Layout } from 'antd'
import ProCard from '@ant-design/pro-card'

import BiSpaceList from './bispace-list'
import BiSpaceRoleUser from './bispace-role-user'

const { Sider, Content } = Layout

export default function BiSpace () {
  const [selectItem, setSelectItem] = useState()
  const [selectResourceId, setSelectResourceId] = useState()

  return (
    <Layout>
      <Sider theme="light" width={500}>
        <BiSpaceList
          resourceId={selectResourceId}
          onClickRow={(item: any) => {
            setSelectItem(item)
            setSelectResourceId(item.key)
          }}
          onChangeTab={() => {
            setSelectItem(null)
            setSelectResourceId(null)
          }}
        />
      </Sider>
      <Content>
        {selectResourceId && (
          <ProCard
            style={{
              position: 'relative',
            }}
            tabs={{
              tabPosition: 'top',
            }}
          >
            <ProCard.TabPane key="torole" tab="赋权给角色">
              <BiSpaceRoleUser resourceId={selectResourceId} type="role" resource={selectItem} />
            </ProCard.TabPane>
            <ProCard.TabPane key="touser" tab="赋权给用户">
              <BiSpaceRoleUser resourceId={selectResourceId} type="user" resource={selectItem} />
            </ProCard.TabPane>
          </ProCard>
        )}
      </Content>
    </Layout>
  )
}
