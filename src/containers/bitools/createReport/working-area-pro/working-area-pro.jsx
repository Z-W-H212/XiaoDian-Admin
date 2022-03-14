import { useContext, useMemo, useState, useEffect } from 'react'
import { Input, Statistic, Row, Col, Card, Empty } from 'antd'
import { QuestionCircleTwoTone } from '@ant-design/icons'
import TableView from '../table-view-panel'
import Database from '../Database'
import Context from '../Context'
import style from './style.module.less'
import PanelFiedls from './panel-fields.jsx'
import WorkingArea from '../WorkingArea'

import SQLEditor from '@/components/SQLEditor'

export default function Panel (props) {
  const { state, dispatch } = useContext(Context)
  const [activeKey, setActiveKey] = useState(state.panelActivedKey)
  const { dbName, dsl, fieldList, previewData } = state

  useEffect(() => {
    setActiveKey(state.panelActivedKey.split('|')[0])
  }, [state.panelActivedKey])

  const runInfo = useMemo(() => {
    return previewData ? previewData.runInfo : null
  }, [previewData])

  const onPanelClick = (key) => {
    setActiveKey(key)
  }

  const PanelSQLResult = () => (
    <>
      <Row>
        <Col span={12}>
          <Statistic title="执行耗时：" valueStyle={{ fontSize: 16, fontWeight: 'normal' }} value={runInfo.run_time} suffix="ms" />
        </Col>
        <Col span={12}>
          <Statistic title="执行主机：" valueStyle={{ fontSize: 14, fontWeight: 'normal' }} value={runInfo.host_info} />
        </Col>
      </Row>
      <Row>
        <div className={style.panelSqlTitle}>执行SQL：</div>
        <Input.TextArea rows={7} value={runInfo.detail_sql} readOnly />
      </Row>
    </>
  )

  const tabList = [
    { key: '1', tab: '数据集字段' },
    { key: '2', tab: '结果预览' },
    { key: '3', tab: '执行语句' },
  ]

  const tabContent = {
    tab1: <PanelFiedls />,
    tab2: <TableView />,
    tab3: runInfo ? <PanelSQLResult /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />,
  }

  return (
    <div className={style.working}>

      <Card
        className={style.cardDSL}
        bodyStyle={{ padding: '0' }}
        title={<div>输入DSL创建 <a href="http://confluence.dian.so/pages/viewpage.action?pageId=15597665" title="帮助文档" rel="noopener noreferrer" target="_blank"><QuestionCircleTwoTone /></a></div>}
        extra={<Database mode="db" />}
      >
        <SQLEditor
          value={dsl}
          width="100%"
          height="50vh"
          language="sql"
          fieldList={fieldList}
          dbName={dbName}
          onChange={(e) => {
            dispatch({ type: 'setDsl', payload: { dsl: e } })
          }}
        />
      </Card>

      {
        state.defaultReportType === 'TABLE'
          ? (
            <Card
              tabList={tabList}
              activeTabKey={activeKey}
              onTabChange={onPanelClick}
            >
              {tabContent[`tab${activeKey}`]}
            </Card>
          )
          : <WorkingArea />
      }

    </div>
  )
}
