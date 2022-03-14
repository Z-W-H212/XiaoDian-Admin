import { useState, useMemo } from 'react'
import { Layout } from 'antd'
import ProCard from '@ant-design/pro-card'

import { DatasetList } from './dataset-list'
import { DatasetRole } from './dataset-role'
import { DatasetUser } from './dataset-user'

const { Sider, Content } = Layout

export default function Dataset () {
  const [selectedGroup, setSelectGroup] = useState<string>()
  const [selectResourceId, setSelectResourceId] = useState<string>()
  const [datasetParams, setDatasetParams] = useState<any>()
  const [selectedRow, setSelectedRow] = useState(false)

  const content = useMemo(() => {
    if (!selectedRow) {
      return null
    }
    const folderId = selectedGroup || selectResourceId
    return (
      <ProCard
        style={{
          position: 'relative',
        }}
        tabs={{
          tabPosition: 'top',
        }}
      >
        <ProCard.TabPane key="torole" tab="赋权给角色">
          <DatasetRole folderId={folderId} fileId={selectResourceId} params={datasetParams} />
        </ProCard.TabPane>
        <ProCard.TabPane key="touser" tab="赋权给用户">
          <DatasetUser folderId={folderId} fileId={selectResourceId} params={datasetParams} />
        </ProCard.TabPane>
      </ProCard>
    )
  }, [selectedRow, selectedGroup, selectResourceId, datasetParams])

  return (
    <Layout>
      <Sider theme="light" width={500}>
        <DatasetList
          folderId={selectedGroup}
          fileId={selectResourceId}
          onDrill={(id) => {
            setSelectGroup(id)
            setSelectResourceId(undefined)
            setSelectedRow(false)
          }}
          onGoback={() => {
            setSelectGroup(undefined)
            setSelectResourceId(undefined)
            setSelectedRow(false)
          }}
          onClickRow={(id, params) => {
            setSelectResourceId(id)
            setDatasetParams(params)
            setSelectedRow(true)
          }}
        />
      </Sider>
      <Content>
        {content}
      </Content>
    </Layout>
  )
}
