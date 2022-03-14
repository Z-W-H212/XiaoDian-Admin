import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Tabs, Layout, Menu, message, Modal, Typography } from 'antd'
import { useLocation, useHistory } from 'react-router-dom'
import qs from 'query-string'
import ProCard from '@ant-design/pro-card'
import { dcapi } from '@/utils/axios'
import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormRadio,
} from '@ant-design/pro-form'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { getRoleList, addRole, updateRole, deleteRole } from '@/services/admin/permission-role'
import Group from '@/components/group'
import UserList from './01-user-list'
import UserMenu from './02-user-menu'
import Department from './03-department'
import { UserDataset } from './04-dataset'
import BISpace from './05-bispace'

const { Sider, Content } = Layout

function PermissionRole () {
  const [selectedGroup, setSelectGroup] = useState(null)
  const [createModal, setCreateModal] = useState(null)
  const [roleDataSource, setRoleDataSource] = useState([])
  const actionRef = useRef()
  const location = useLocation()
  const history = useHistory()
  const querystring = qs.parse(location.search)
  const [userData, setUserData] = useState(null)
  const [defaultSelectedKey, setDefaultSelectedKey] = useState('')
  const [defaultSelectTitle, setDefaultSelectTitle] = useState('')

  const getUserProps = useCallback(async (ticket) => {
    const data = await dcapi.get('/diana/user/v1/getUserProps')
    setUserData(data)
  }, [])

  const setDefaultData = async (name) => {
    const result = await getRoleList()
    for (const item of result) {
      const { roleName, id } = item
      if (roleName === name) {
        history.replace(`${location.pathname}?roleId=${id}`)
      }
    }
  }

  const clearDefaultData = () => {
    setDefaultSelectTitle('')
    setDefaultSelectedKey('')
  }

  const renderDropdown = (item, flatTree) => {
    return (
      <Menu>
        <Menu.Item>
          <ModalForm
            layout="horizontal"
            title="编辑角色"
            initialValues={{
              roleName: item.title,
              roleDesc: item.props.roleDesc,
              roleType: item.props.roleType,
            }}
            trigger={<div>编辑</div>}
            onFinish={async (values) => {
              try {
                await updateRole({
                  ...values,
                  id: item.key,
                })
                message.success('提交成功')
                setDefaultSelectedKey(item.key)
                setDefaultSelectTitle(values.roleName)
                setSelectGroup(item.key)
                await actionRef.current.reload()
                return true
              } catch (err) {
                message.error('提交失败')
              }
            }}
          >
            <ProFormText
              name="roleName"
              label="角色名称"
              rules={[
                { max: 40, message: '字段最长40个字符' },
              ]}
            />
            <ProFormTextArea
              name="roleDesc"
              label="角色描述"
              rules={[
                { max: 512, message: '字段最长512个字符' },
              ]}
            />
            {
              item.props.roleType !== 3 && userData?.adminModal
                ? (
                  <ProFormRadio.Group
                    name="roleType"
                    label="是否设为默认角色"
                    options={[
                      {
                        label: '是',
                        value: 1,
                      },
                      {
                        label: '否',
                        value: 2,
                      },
                    ]}
                  />
                )
                : null
            }

          </ModalForm>
        </Menu.Item>
        {
          item.props.roleType !== 3 && (
            <Menu.Item
              onClick={() => {
                const modelInstance = Modal.confirm({
                  title: '操作不可逆，是否确认删除？',
                  icon: <ExclamationCircleOutlined />,
                  async onOk () {
                    try {
                      await deleteRole(item.key)
                      message.success('提交成功')
                      modelInstance.destroy()
                      clearDefaultData()
                      await actionRef.current.reload()
                      history.replace(location.pathname)
                    } catch (err) {
                      message.error('提交失败')
                    }
                  },
                })
              }}
            >删除</Menu.Item>
          )
        }

      </Menu>
    )
  }
  /**
  * 查询组件传参
  */
  const groupProps = {
    actionRef,
    defaultSelectTitle: defaultSelectTitle,
    defaultSelectedKey: defaultSelectedKey || querystring?.roleId,
    onCreateGroup: flatTree => setCreateModal({ flatTree }),
    onSelect (key) {
      setSelectGroup(key)
      clearDefaultData()
      history.push(`/permit/role?roleId=${key}`)
    },
    renderItem (text, row) {
      return [1, 3].indexOf(row.props.roleType) > -1 ? <span>{text} <span style={{ fontSize: 12, color: 'dimgray' }}>默认</span></span> : text
    },
    itemMenuRender: renderDropdown,
    async onRequest () {
      const result = await getRoleList()
      const data = result.map(({ roleName, id, ...other }) => ({
        title: roleName,
        key: id,
        children: [],
        props: { ...other },
      }))
      setRoleDataSource(data)
      return data
    },
  }

  const roleInfo = useMemo(() => {
    const find = roleDataSource.find(e => e.key === selectedGroup)
    return {
      title: find?.title,
      desc: find?.props?.roleDesc,
    }
  }, [roleDataSource, selectedGroup])

  useEffect(() => {
    if (querystring?.roleId && roleDataSource) {
      const item = roleDataSource.find(e => e.key === querystring?.roleId)
      if (item) {
        setSelectGroup(item.key)
      }
    } else {
      setSelectGroup(null)
    }
  }, [querystring, roleDataSource])

  useEffect(() => {
    getUserProps()
  }, [])

  return (
    <>
      <Tabs>
        <Tabs.TabPane key="0" tab="角色管理" />
      </Tabs>

      <Layout>
        <Sider theme="light" width={272} style={{ marginRight: 1 }}>
          <Group {...groupProps} />
        </Sider>
        <Layout flex="auto">
          {
            selectedGroup && (
              <Content>
                <ProCard title={roleInfo.title}>
                  <Typography.Paragraph ellipsis={{ rows: 2, expandable: true, symbol: '更多' }}>
                    {roleInfo.desc}
                  </Typography.Paragraph>
                </ProCard>
                <Tabs tabBarStyle={{ paddingLeft: 8 }} defaultActiveKey="user" style={{ background: '#fff' }}>
                  <Tabs.TabPane key="user" tab="用户列表">
                    <UserList roleId={selectedGroup} />
                  </Tabs.TabPane>
                  <Tabs.TabPane key="department" tab="部门列表">
                    <Department roleId={selectedGroup} />
                  </Tabs.TabPane>
                  <Tabs.TabPane key="menu" tab="菜单权限">
                    <UserMenu roleId={selectedGroup} />
                  </Tabs.TabPane>
                  <Tabs.TabPane key="dataset" tab="数据集权限">
                    <UserDataset roleId={selectedGroup} />
                  </Tabs.TabPane>
                  <Tabs.TabPane key="bispace" tab="BI空间权限">
                    <BISpace roleId={selectedGroup} />
                  </Tabs.TabPane>
                </Tabs>
              </Content>
            )
          }
        </Layout>
      </Layout>

      {
        createModal && (
          <ModalForm
            initialValues={{
              roleType: 2,
            }}
            visible={createModal}
            layout="horizontal"
            title="新建角色"
            onVisibleChange={visible => !visible && setCreateModal(null)}
            onFinish={async (values) => {
              try {
                await addRole({
                  ...values,
                })
                message.success('提交成功')
                setCreateModal(null)
                setDefaultData(values.roleName)
                await actionRef.current.reload()
                return true
              } catch (err) {
                message.error('提交失败')
              }
            }}
          >
            <ProFormText
              name="roleName"
              label="角色名称"
              rules={[
                { max: 40, message: '字段最长40个字符' },
                () => ({
                  async validator (_, value) {
                    if (!value) {
                      return Promise.reject(Error('请填名称!'))
                    }
                    const result = createModal.flatTree.find(e => e.title === value)
                    if (result) {
                      return Promise.reject(Error('该名称已存在'))
                    }
                  },
                }),
              ]}
            />
            <ProFormTextArea
              name="roleDesc"
              label="角色描述"
              rules={[
                { max: 512, message: '字段最长512个字符' },
              ]}
            />
            {
              userData?.adminModal
                ? (
                  <ProFormRadio.Group
                    name="roleType"
                    label="是否设为默认角色"
                    options={[
                      {
                        label: '是',
                        value: 1,
                      },
                      {
                        label: '否',
                        value: 2,
                      },
                    ]}
                  />
                )
                : null
            }
          </ModalForm>
        )
      }
    </>
  )
}

export default PermissionRole
