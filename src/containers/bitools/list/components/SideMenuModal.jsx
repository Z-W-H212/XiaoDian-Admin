import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import Group from '@/components/group'
import { updateMenuSort, getAppMenuListApi, getAppListApi } from '@/services/admin/menu'
import { Layout, Drawer, Space, Button, message, Select } from 'antd'
import { dcapi } from '@/utils/axios'
import style from './style.module.less'
const { Sider } = Layout
const { Option } = Select

const SideMenu = (props) => {
  const actionRef = useRef()
  const [menuId, setMenuId] = useState(null)
  const setSearchUser = useState(null)
  const { onClose, visible, isSideMenu, values } = props
  const [isDisplay, setIsDisplay] = useState(isSideMenu)
  const [appList, setAppList] = useState()
  const [appCode, setAppCode] = useState()

  useEffect(() => {
    getAppListApi().then((data) => {
      if (data?.list?.length > 0) {
        const { list } = data
        setAppList(list)
        const item = list.find(item => item.appCode === 'dem_client') || list[0]
        setAppCode(item.appCode)
      }
    })
  }, [])

  const groupProps = {
    actionRef,
    draggable: true,
    isDisplay,
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
    async onRequest () {
      const data = await getAppMenuListApi({ appCode })
      const list = data[0] ? data[0].children : []
      return list
    },
  }

  const drawerProps = {
    width: 276,
    onClose,
    visible,
    closable: false,
    destroyOnClose: true,
  }

  const getResource = useCallback(async () => {
    await dcapi.post('/diana/menu/addReportResource', {
      resourceValue: [values.values.id],
      menuId,
    })
    message.success('报表挂靠成功')
    onClose()
  })

  const getMenuId = (menuId) => {
    setMenuId(menuId)
  }

  const appSelect = useMemo(() => {
    if (!appList) {
      return null
    }
    const list = appList.map((item) => {
      const { appCode, appName } = item
      return <Option key={appCode} value={appCode}>{appName}</Option>
    })
    return (
      <div className={style.appSelectedWrap}>
        选择应用：
        <Select
          style={{ width: '160px' }}
          className={style.appSelectInput}
          value={appCode}
          onChange={v => setAppCode(v)}
        >
          {list}
        </Select>
      </div>
    )
  }, [appList, appCode])

  return (
    <>
      <Drawer {...drawerProps}>
        <Space align="start" className={style.SideHeader}>
          <span style={{ fontSize: '18px', fontWeight: 'bolder', paddingBottom: '0' }}>菜单列表</span>
        </Space>
        {appSelect}
        <Layout>
          {appCode
            ? (
              <Sider theme="light" width={275} style={{ marginRight: '1px' }}>
                <Group
                  key={appCode}
                  {...groupProps}
                  resetValue={setSearchUser}
                  onSelect={getMenuId}
                />
              </Sider>
            )
            : null}
        </Layout>
        <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space style={{ position: 'absolute', bottom: '5px', right: '10px' }}>
            <Button
              async onClick={() => {
                onClose()
                setIsDisplay(isSideMenu)
              }}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={getResource}
            >
              确认
            </Button>
          </Space>
        </Space>
      </Drawer>
    </>
  )
}

export default SideMenu
