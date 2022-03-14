import { Layout, Row, Col, Tree, Spin, Input, Select, Button, Space, Form, Tooltip, Typography, message, Modal } from 'antd'
import ProTable, { ActionType } from '@ant-design/pro-table'
import { SearchOutlined } from '@ant-design/icons'
import {
  getTablePreview,
  getBusinessDomain,
  postBusinessDomain,
  getAllDatabase,
  getTableInfo,
  postTableInfo,
  postTableColInfo,
  IAllDatabas,
  IBusinessDomain,
  getTagList,
  checkMatchDw,
} from '@/services/admin/databse'
import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { ModalForm } from '@/components/modal-form'
import { BusinessSelector } from './business-selector'
import UpdateField from './update-field'
import useFetch from '@/hooks/useFetch'
import formatTagName from '@/utils/format-tag-name'

const { Sider, Content } = Layout

enum ModalType {
  NONE = 'NONE',
  EDIT_FIELD = 'EDIT_FIELD',
  EDIT_TABLE = 'EDIT_TABLE',
  PREVIEW_DATA = 'PREVIEW_DATA'
}

interface DetailInfo {
  name: string
  desc: string
  alias: string
  tableId: string
  businessName: string
  businessId: string
  columns: {
    colAlias: string
    colDesc: string
    colName: string
    tagAlias: string
  }[]
  haveAuth: boolean
  tagName: string
  tagRemark: string
}

const DEFAULT_BUSINESS_ID = '__ALL'

function Dataset () {
  const [databaseData, setDatabseData] = useState<IAllDatabas>({}) // 数据库列表
  const [businessDomainData, setBusinessDomainData] = useState<IBusinessDomain[]>([]) // 业务域列表
  const [selectedDbKey, setSelectedDb] = useState<string>('') // 已选中数据库
  const [selectedBusinessID, setSelectBusinessID] = useState(DEFAULT_BUSINESS_ID) // 已选中业务域
  const [selectTableKey, setSelectTableKey] = useState('') // 已选中数据表
  const [searchValue, setSearchValue] = useState('') // 搜索
  const [modalVisible, setModalVisible] = useState<{ modal: ModalType, params?: any }>({ modal: ModalType.NONE })
  const [dBLoading, setDBLoading] = useState<boolean>(false)
  const [detailInfo, setDetailInfo] = useState<DetailInfo>({
    name: '',
    desc: '',
    alias: '',
    businessName: '',
    businessId: null,
    tableId: null,
    columns: [],
    haveAuth: false,
    tagName: '',
    tagRemark: '',
  })

  const actionRef = useRef<ActionType>()
  const [{ data: { status: matchDw } }, fetchMatchDw] = useFetch(checkMatchDw, { data: {} })
  const [tagListRes, fetchTagList] = useFetch(getTagList)
  const taglist = useMemo(() => {
    if (matchDw === false) {
      return []
    }
    return tagListRes.data || []
  }, [tagListRes.data])

  useEffect(() => {
    selectedDbKey && fetchMatchDw(selectedDbKey)
  }, [selectedDbKey])

  useEffect(() => {
    selectTableKey && fetchTagList({ queryString: selectTableKey })
  }, [selectTableKey])

  const getDatabaseData = useCallback(async () => {
    setDBLoading(true)
    const result = await getAllDatabase({ type: 2 })
    setDatabseData(result)
    setDBLoading(false)
    selectedDbKey || setSelectedDb(Object.keys(result)[0])
  }, [selectedDbKey])

  const getBusinessDomainData = useCallback(async () => {
    const result = await getBusinessDomain()
    setBusinessDomainData(result)
  }, [])

  const dbList = useMemo(() => Object.keys(databaseData), [databaseData])

  const tableList = useMemo(() =>
    selectedDbKey &&
    databaseData[selectedDbKey] // 数据库名搜索
      .filter(i => (selectedBusinessID === DEFAULT_BUSINESS_ID || i.businessDomainId === selectedBusinessID)) // 业务域搜索
      .filter(i => (searchValue // 关键词搜索
        ? (
          i.tableName.indexOf(searchValue) > -1 ||
          i.tableAlias.indexOf(searchValue) > -1
        )
        : true))
      .map(e => ({
        key: e.tableId,
        name: e.tableName,
        title: e.tableAlias ? <Tooltip title={e.tableName}>{e.tableAlias}</Tooltip> : e.tableName,
      })), [databaseData, searchValue, selectedBusinessID, selectedDbKey])

  const columns = [
    {
      title: '字段名',
      dataIndex: 'colName',
    },
    {
      title: '数据类型',
      dataIndex: 'colType',
    },
    {
      title: '字段别名',
      dataIndex: 'colAlias',
    },
    {
      title: '业务指标名称',
      dataIndex: 'tagAlias',
      render (value, row) {
        const { tagAlias, tagTimePeriod, tagRemark } = row
        return formatTagName({ tagAlias, tagTimePeriod, tagRemark })
      },
    },
    {
      title: '字段口径',
      dataIndex: 'colDesc',
    },
    {
      title: '操作',
      render (_, row) {
        return (
          <Typography.Link
            disabled={!row.haveAuth}
            onClick={() =>
              setModalVisible({
                modal: ModalType.EDIT_FIELD,
                params: {
                  name: row.colName,
                  type: row.colType,
                  alias: row.colAlias,
                  desc: row.colDesc,
                  tagId: row.tagId,
                  tagName: row.tagName,
                  tagAlias: row.tagAlias,
                  tagRemark: row.tagRemark,
                },
              })}
          >修改</Typography.Link>
        )
      },
    },
  ]

  useEffect(() => {
    getDatabaseData()
    getBusinessDomainData()
  }, [])

  const handleDBChange = (e) => {
    setSelectedDb(e.toString())
    setSelectTableKey('')
  }

  useEffect(() => {
    selectTableKey && actionRef.current?.reloadAndRest()
  }, [selectTableKey])

  return (
    <Layout>
      <Sider theme="light" width={280} style={{ marginRight: '1px', minHeight: 500 }}>
        <Space direction="vertical">
          <Form style={{ padding: 10 }}>
            <Form.Item label="数据库" style={{ marginBottom: 10 }}>
              <Select
                loading={dBLoading}
                style={{ width: 200 }}
                showSearch
                value={selectedDbKey}
                onChange={handleDBChange}
              >
                {
                  dbList.map(e => (
                    <Select.Option key={e} value={e}>{e}</Select.Option>
                  ))
                }
              </Select>
            </Form.Item>
            <Form.Item label="业务域" style={{ marginBottom: 10 }}>
              <Select
                style={{ width: 200 }}
                value={selectedBusinessID}
                onChange={e => setSelectBusinessID(e)}
              >
                <Select.Option value="__ALL">全部</Select.Option>
                {
                  businessDomainData.map(e => (
                    <Select.Option key={e.domainId} value={e.domainId}>{e.domainName}</Select.Option>
                  ))
                }
              </Select>
            </Form.Item>
            <Form.Item noStyle>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="请输入数据集名称"
                onChange={e => setSearchValue(e.target.value)}
              />
            </Form.Item>
          </Form>
          {
            selectedDbKey &&
              <Tree
                height={600}
                blockNode
                onSelect={(e, row: any) => setSelectTableKey(row.node.name)}
                treeData={tableList}
              />
          }
          {dBLoading && <Spin />}
        </Space>
      </Sider>
      <Layout>
        <Content>
          {
            selectTableKey &&
              <Row gutter={[16, 8]} style={{ padding: 10, background: '#fff' }}>
                <Col span={8}>数据集名称：{detailInfo.name}</Col>
                <Col span={8} offset={8} style={{ textAlign: 'right' }}>
                  {
                detailInfo.name && (
                  <Button
                    type="primary"
                    disabled={!detailInfo.haveAuth}
                    onClick={() =>
                      setModalVisible({
                        modal: ModalType.EDIT_TABLE,
                        params: {
                          name: detailInfo.name,
                          alias: detailInfo.alias,
                          desc: detailInfo.desc,
                          businessName: detailInfo.businessName,
                          businessId: detailInfo.businessId,
                        },
                      })}
                  >编辑</Button>
                )
              }
                </Col>
                <Col span={8}>数据集别名：{detailInfo.alias}</Col>
                <Col span={8}>业务域：{detailInfo.businessName || '空'}</Col>
                <Col span={8} style={{ textAlign: 'right' }}>
                  {
                detailInfo.name && (
                  <Button
                    type="primary"
                    onClick={async () => {
                      setModalVisible({
                        modal: ModalType.PREVIEW_DATA,
                      })
                    }}
                  >预览</Button>)
              }
                </Col>
                <Col span={24}>数据集描述：{detailInfo.desc}</Col>
              </Row>
          }

          {
            selectTableKey &&
              <ProTable
                actionRef={actionRef}
                rowKey="colName"
                columns={columns}
                params={{
                  tableName: selectTableKey,
                  dbName: selectedDbKey,
                }}
                toolBarRender={false}
                search={false}
                request={async (params) => {
                  if (!params.tableName || !params.dbName) {
                    return {
                      success: false,
                    }
                  }

                  const result = await getTableInfo({
                    ...params,
                    usage: 2,
                  })
                  setDetailInfo({
                    name: result.tableName,
                    desc: result.tableDesc,
                    alias: result.tableAlias,
                    businessName: result.businessDomainName,
                    businessId: result.businessDomainId,
                    tableId: result.tableId,
                    columns: result.tableColVOList,
                    haveAuth: result.haveAuth,
                    tagName: result.tagName,
                    tagRemark: result.tagRemark,
                  })

                  return {
                    success: true,
                    data: result.tableColVOList,
                  }
                }}
              />
          }
          {modalVisible.modal === ModalType.EDIT_FIELD && (
            <UpdateField
              values={modalVisible.params}
              matchDw={matchDw}
              tagList={taglist}
              onOk={async (values) => {
                try {
                  await postTableColInfo({
                    colAlias: values.alias,
                    colDesc: values.desc,
                    colName: values.name,
                    tagId: values.tagId,
                    tagRemark: values.tagRemark,
                    dbName: selectedDbKey,
                    tableName: selectTableKey,
                  })
                  setModalVisible({ modal: ModalType.NONE })
                  actionRef.current?.reload()
                  message.success('保存成功')
                } catch (err) {
                  message.error('保存失败')
                }
              }}
              onCancel={() => setModalVisible({ modal: ModalType.NONE })}
            />
          )}
          {
            modalVisible.modal === ModalType.EDIT_TABLE && (
              <ModalForm
                title="编辑"
                visible
                initialValues={modalVisible.params}
                onCancel={() => setModalVisible({ modal: ModalType.NONE })}
                onSubmit={async (params: any) => {
                  try {
                    await postTableInfo({
                      dbName: selectedDbKey,
                      tableName: selectTableKey,
                      businessDomainId: params.businessId,
                      tableDesc: params.desc,
                      tableAlias: params.alias,
                    })
                    setModalVisible({ modal: ModalType.NONE })
                    actionRef.current?.reload()
                    message.success('保存成功')
                    getDatabaseData()
                  } catch (err) {
                    message.error('保存失败')
                  }
                }}
              >
                <Form.Item name="name" label="数据集名称">
                  <Input disabled />
                </Form.Item>
                <Form.Item name="alias" label="别名">
                  <Input />
                </Form.Item>
                <Form.Item name="businessId" label="归属业务域">
                  <BusinessSelector
                    data={businessDomainData}
                    onCreate={async (name) => {
                      await postBusinessDomain(name)
                      await getBusinessDomainData()
                      message.success('添加成功')
                    }}
                  />
                </Form.Item>
                <Form.Item name="desc" label="数据集描述">
                  <Input.TextArea showCount maxLength={512} />
                </Form.Item>
              </ModalForm>
            )
          }

          {
            modalVisible.modal === ModalType.PREVIEW_DATA && (
              <Modal
                visible
                width="80vw"
                onCancel={() => setModalVisible({ modal: ModalType.NONE })}
                footer={[
                  <Button key="back" onClick={() => setModalVisible({ modal: ModalType.NONE })}>
                    确定
                  </Button>,
                ]}
              >
                <ProTable
                  toolBarRender={false}
                  search={false}
                  size="small"
                  rowKey="colName"
                  columns={detailInfo.columns.map(e => ({
                    title: formatTagName(e),
                    dataIndex: e.colName,
                    ellipsis: true,
                  }))}
                  request={async () => {
                    const result = await getTablePreview({
                      schemaTableId: detailInfo.tableId,
                    })
                    return {
                      success: true,
                      data: result.rows,
                    }
                  }}
                  scroll={{ x: 'max-content' }}
                />
              </Modal>
            )
          }
        </Content>
      </Layout>
    </Layout>
  )
}

export default Dataset
