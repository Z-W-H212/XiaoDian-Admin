import { useState, useRef, useCallback, useEffect } from 'react'
import { Switch, Redirect, useHistory, useLocation } from 'react-router-dom'
import Group from '@/components/group'
import { addMenuList, updateMenu, removeMenu, updateMenuLevel, updateMenuSort, getAppListApi, getAppMenuListApi } from '@/services/admin/menu'
import ReportTable from './table'
import { Tabs, Layout, Modal, Form, Menu, TreeSelect, message, Row, Col } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { dcapi } from '@/utils/axios'
import ManageSystem from './component/manage-system'
import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormRadio,
} from '@ant-design/pro-form'
const { Sider, Content } = Layout

function PermissionMenu () {
  const location = useLocation()
  const history = useHistory()
  const actionRef = useRef()
  const [menuTree, setMenuTree] = useState([])
  const [selectedGroupKey, setSelectGroupKey] = useState(null)
  const [createMenuModal, setCreateMenuModal] = useState(null)
  const [userData, setUserData] = useState(null)
  const [appList, setAppList] = useState([])
  const [defaultSelectedKey, setDefaultSelectedKey] = useState('')
  const [defaultSelectTitle, setDefaultSelectTitle] = useState('')

  const getUserProps = useCallback(async (ticket) => {
    const data = await dcapi.get('/diana/user/v1/getUserProps')
    setUserData(data)
  }, [])

  const getAppList = useCallback(async () => {
    const { list } = await getAppListApi()
    setAppList(list || [])
  })

  const setDefaultData = async () => {
    const tab = location.pathname
    if (tab !== '/menu') {
      const data = await getAppMenuListApi({ appCode: location.pathname.replace('/menu/', '') })
      const list = data[0] ? data[0].children : []
      if (list.length) {
        const lastData = list[list.length - 1]
        const { title, key } = lastData
        setDefaultSelectTitle(title)
        setDefaultSelectedKey(key)
        setSelectGroupKey(key)
      }
    }
  }

  const clearDefaultData = () => {
    setDefaultSelectTitle('')
    setDefaultSelectedKey('')
  }

  /**
   * 1、菜单中心列表编辑模块
   */
  const renderDropdown = (item, flatTree, tree) => {
    let createTypeOptions = [
      {
        label: '常规菜单',
        value: '1',
      },
      {
        label: '模块菜单',
        value: '2',
      },
    ]
    if (item.props.type === '2') {
      createTypeOptions = [
        {
          label: '模块菜单',
          value: '2',
        },
      ]
    }
    return (
      <Menu>
        <Menu.Item>
          <ModalForm
            layout="horizontal"
            title="新建"
            trigger={<div>新建</div>}
            initialValues={{ type: item.props.type }}
            onFinish={async (values) => {
              try {
                await addMenuList({
                  ...values,
                  parentId: item.key,
                  appId: getCurrentApp().appId,
                })
                message.success('提交成功')
                await actionRef.current.reload()
                return true
              } catch (err) {
                message.error('提交失败')
              }
            }}
          >
            <ProFormText
              name="menuName"
              label="菜单名称"
              rules={[
                { max: 40, message: '字段最长40个字符' },
                () => ({
                  async validator (_, value) {
                    if (!value) {
                      return Promise.reject(Error('请填名称!'))
                    }
                  },
                }),
              ]}
            />
            <ProFormRadio.Group
              name="type"
              label="菜单类型"
              options={createTypeOptions}
            />
            <ProFormTextArea
              name="desc"
              label="菜单描述"
              rules={[
                { max: 512, message: '字段最长512个字符' },
              ]}
            />
          </ModalForm>
        </Menu.Item>
        <Menu.Item>
          <ModalForm
            layout="horizontal"
            title="编辑"
            initialValues={{
              menuName: item.title,
              type: item.props.type,
              desc: item.props.desc,
            }}
            trigger={<div>编辑</div>}
            onFinish={async (values) => {
              try {
                await updateMenu({
                  ...values,
                  id: item.key,
                  appId: getCurrentApp().appId,
                })
                message.success('提交成功')
                setDefaultSelectedKey(item.key)
                setDefaultSelectTitle(values.menuName)
                setSelectGroupKey(item.key)
                await actionRef.current.reload()
                return true
              } catch (err) {
                message.error('提交失败')
              }
            }}
          >
            <ProFormText name="menuName" label="菜单名称" />
            <ProFormRadio.Group
              name="type"
              label="菜单类型"
              disabled
              options={[
                {
                  label: '常规菜单',
                  value: '1',
                },
                {
                  label: '模块菜单',
                  value: '2',
                },
              ]}
            />
            <ProFormTextArea name="desc" label="菜单描述" />
          </ModalForm>
        </Menu.Item>
        <Menu.Item>
          <ModalForm
            layout="horizontal"
            title="修改菜单路径"
            initialValues={{
              name: item.title,
            }}
            trigger={<div>移动</div>}
            onFinish={async (values) => {
              try {
                await updateMenuLevel({
                  ...values,
                  oldParentId: item.parentKey,
                  id: item.key,
                })
                message.success('提交成功')
                await actionRef.current.reload()
                return true
              } catch (err) {
                message.error('提交失败')
              }
            }}
          >
            <ProFormText label="菜单名称" name="name" disabled />
            <Form.Item
              name="newParentId"
              label="目标文件夹"
              rules={[{ required: true, message: '请选择文件夹' }]}
              required
            >
              <TreeSelect
                showSearch
                treeData={tree}
                placeholder="请选择目标文件夹"
                treeDefaultExpandAll
                treeNodeFilterProp="title"
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              />
            </Form.Item>
          </ModalForm>
        </Menu.Item>
        <Menu.Item
          onClick={() => {
            const modelInstance = Modal.confirm({
              title: '操作不可逆，是否确认删除？',
              icon: <ExclamationCircleOutlined />,
              async onOk () {
                try {
                  await removeMenu({ id: item.key })
                  message.success('提交成功')
                  modelInstance.destroy()
                  clearDefaultData()
                  await actionRef.current.reload()
                  return true
                } catch (err) {
                  message.error('提交失败')
                }
              },
            })
          }}
        >删除</Menu.Item>
      </Menu>
    )
  }

  /**
   * 向公共搜索组件group进行传值
   */
  const groupProps = {
    defaultSelectTitle: defaultSelectTitle,
    defaultSelectedKey: defaultSelectedKey,
    actionRef,
    onCreateGroup: flatTree => setCreateMenuModal({ flatTree }),
    onSelect (key) {
      key.length && setSelectGroupKey(key)
      clearDefaultData()
    },
    itemMenuRender: renderDropdown,
    draggable: true,
    async onDrag (data) {
      await updateMenuSort({
        treeNodes: [
          {
            key: '0',
            parentKey: '',
            children: data,
          },
        ],
      })
      await actionRef.current.reload()
    },
    params: {
      activeTab: location.pathname,
    },
    async onRequest ({ activeTab }) {
      // 首次进入为 /menu 路由 直接 return
      if (activeTab === '/menu') {
        return []
      }
      const data = await getAppMenuListApi({ appCode: activeTab.replace('/menu/', '') })

      const list = data[0] ? data[0].children : []
      setMenuTree(list)
      return list
    },
  }

  useEffect(() => {
    getUserProps()
    getAppList()
  }, [])

  /**
   * 得到当前tab下添加的Applist
   */
  const getCurrentApp = () => {
    const appCode = window.location.pathname.replace('/menu/', '')
    return appList.find(item => item.appCode === appCode) || {}
  }
  const onTabChange = useCallback((e) => {
    history.push(e)
    setSelectGroupKey(null)
  }, [])

  return (
    <>
      <Row>
        <Col flex="auto">
          <Tabs onChange={onTabChange} activeKey={location.pathname}>
            {
              /**
               * 根据返回的list渲染对应的tab
               */
              appList.map((item) => {
                if (item.appCode === 'diana_admin') {
                  return userData?.adminModal ? <Tabs.TabPane key={`/menu/${item.appCode}`} tab={item.appName} /> : null
                }
                return <Tabs.TabPane key={`/menu/${item.appCode}`} tab={item.appName} />
              })
            }
          </Tabs>
        </Col>
        <Col>
          {userData?.adminModal ? <ManageSystem appList={appList} onGetAppList={getAppList} /> : null}
        </Col>
      </Row>

      <Layout>
        <Sider theme="light" width={272} style={{ marginRight: '1px' }}>
          <Group {...groupProps} />
        </Sider>
        <Layout flex="auto">
          <Content>
            {selectedGroupKey && <ReportTable menuId={selectedGroupKey} menuTree={menuTree} />}
          </Content>
        </Layout>
      </Layout>
      <Switch>
        <Redirect exact from="/menu" to="/menu/dem_client" />
      </Switch>
      {
        createMenuModal && (
          <ModalForm
            layout="horizontal"
            title="新建菜单"
            visible={createMenuModal}
            initialValues={{ type: '1' }}
            onVisibleChange={visible => !visible && setCreateMenuModal(null)}
            onFinish={async (values) => {
              try {
                await addMenuList({
                  ...values,
                  parentId: 0,
                  appId: getCurrentApp().appId,
                })
                message.success('提交成功')
                setDefaultData()
                await actionRef.current.reload()
                return true
              } catch (err) {
                message.error('提交失败')
              }
            }}
          >
            <ProFormText
              name="menuName"
              label="菜单名称"
              rules={[
                { max: 40, message: '字段最长40个字符' },
                () => ({
                  async validator (_, value) {
                    if (!value) {
                      return Promise.reject(Error('请填名称!'))
                    }
                    const result = createMenuModal.flatTree.find((e) => {
                      return e.title === value && e.props?.type !== '2'
                    })
                    if (result) {
                      return Promise.reject(Error('该名称已存在'))
                    }
                  },
                }),
              ]}
            />
            <ProFormRadio.Group
              name="type"
              label="菜单类型"
              defaultSelectedKey="1"
              options={[
                {
                  label: '常规菜单',
                  value: '1',
                },
                {
                  label: '模块菜单',
                  value: '2',
                },
              ]}
            />
            <ProFormTextArea
              name="desc"
              label="菜单描述"
              rules={[
                { max: 512, message: '字段最长512个字符' },
              ]}
            />
          </ModalForm>
        )
      }
    </>
  )
}

export default PermissionMenu
