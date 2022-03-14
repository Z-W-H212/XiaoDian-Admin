import { useEffect, useContext, useReducer } from 'react'
import { message } from 'antd'
import Paragraph from '@/components/layout/Paragraph'
import DataSource from './components/data-source'
import FieldList from './components/field-list'
import Drill from './components/drill'
import Dimension from './components/dimension'
import Indicator from './components/indicator'
import Context from '../Context'
import ReactSortableContext from './Context'
import reactSortableModel from './state'
import TableView from '../WorkingArea/TableViewPanel.jsx'
import Chart from '../WorkingArea/chart'
import style from './style.module.less'

const { Block, Content } = Paragraph

export default function Visualization (props): JSX.Element {
  const { state, dispatch } = useContext(Context)
  const [reactSortableState, reactSortableDispatch] = useReducer(reactSortableModel.reducer, reactSortableModel.state)

  useEffect(() => {
    if (state.error) {
      message.error(state.error.toString())
      dispatch({ type: 'clearError' })
    }
  }, [state.error])

  return (
    <ReactSortableContext.Provider value={{ state: reactSortableState, dispatch: reactSortableDispatch }}>
      <Block width={220}>
        <DataSource mode="table" />
        <FieldList />
      </Block>
      <Content className={style.layout}>
        <Content className={style['layout-content']}>
          <Drill />
          <Dimension />
          <Indicator />
          {
          state.defaultReportType === 'TABLE'
            ? (
              <TableView />
            )
            : <Chart />
        }
        </Content>
      </Content>
    </ReactSortableContext.Provider>
  )
}
