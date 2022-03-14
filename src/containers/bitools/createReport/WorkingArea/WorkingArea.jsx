import { useEffect, useContext } from 'react'
import { Layout, message } from 'antd'
import Drill from './Drill.jsx'
import Dimension from './Dimension'
import Index from './index-panel.jsx'
import TableView from './TableViewPanel.jsx'
import Chart from './chart'
import Context from '../Context'
import style from './style.module.less'
import DslChart from './dslChart'
import useParseSearch from '@/hooks/useParseSearch'

const { Header, Content, Sider } = Layout

export default function Panel (props) {
  const { state, dispatch } = useContext(Context)
  const qs = useParseSearch()

  useEffect(() => {
    if (state.error) {
      message.error(state.error.toString())
      dispatch({ type: 'clearError' })
    }
  }, [state.error])

  return (
    <Layout className={style.workingArea}>
      {
        qs.mode === 'DSL' && (
          <Sider style={{ background: '#fff' }}>
            <DslChart />
          </Sider>
        )
      }
      <Content className={style.content}>
        <Header className={style.header}>
          <Drill />
          <Dimension />
          <Index />
        </Header>
        {
          state.defaultReportType === 'TABLE'
            ? (
              <TableView />
            )
            : <Chart />
        }
      </Content>
    </Layout>
  )
}
