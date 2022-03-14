import { useReducer, useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Skeleton, Alert } from 'antd'

import Page from '@/components/layout/Page'
import Paragraph from '@/components/layout/Paragraph'

// import Database from './Database'
// import WorkingArea from './WorkingArea'
import WorkingAreaPro from './working-area-pro'
import PropertiesPane from './PropertiesPane'
import Toolbar from './Toolbar'

import Context from './Context'

import useParseSearch from '@/hooks/useParseSearch'
import fieldModels from './models/field'
import { getReportConfig, getDSLFieldList } from '@/services/reportService'
import { obj2Url } from '@/utils/tools'
import style from './style.module.less'

import Visualization from './visualization'

const { Header, Body } = Page
const { Block, Content } = Paragraph

const beforeunloadCallback = (e) => {
  e.preventDefault()
  e.returnValue = ''
}

const popstateCallback = (e) => {
  const result = window.confirm('是否离开编辑器？')
  if (result) {
    window.history.back()
  } else {
    window.history.pushState(null, null, document.URL)
  }
}

/**
 * 创建报表
 */
export default function CreateReport (props) {
  const history = useHistory()
  const { mode, id, versionCode, ro, groupId, bizType, _groupId } = useParseSearch(props)
  const [state, dispatch] = useReducer(fieldModels.reducer, fieldModels.state)
  const [loaded, setLoaded] = useState(false)
  const [sqlError, setSQLError] = useState(null)

  useEffect(() => {
    window.addEventListener('beforeunload', beforeunloadCallback)
    window.addEventListener('popstate', popstateCallback)
    return () => {
      window.removeEventListener('beforeunload', beforeunloadCallback)
      window.removeEventListener('popstate', popstateCallback)
    }
  }, [id])

  useEffect(() => {
    async function getReportData () {
      const reportConfig = await getReportConfig({ id, versionCode })
      if (mode !== 'DSL') {
        return reportConfig
      }

      let dslFieldList = []

      try {
        dslFieldList = await getDSLFieldList({
          dbName: reportConfig.dbName,
          dsl: reportConfig.dsl,
          paramList: reportConfig.paramList,
        })
      } catch (err) {
        setSQLError(err)
      }

      /**
       * TODO
       * 传入系统中的fieldList来源分为自动解析和手工添加两个接口
       * 在此根据需求，使用手工添加的覆盖自动解析的，并且打上标记
       * 在传出时再拆分解析，有疑问联系 @团结
       */
      const hash = {}
      const newField = [
        ...reportConfig.fieldList.map(e => ({ ...e, _source: 'manual' })),
        ...dslFieldList.map((e, i) => ({
          ...e,
          type: 'dimension',
          sequence: i + reportConfig.fieldList.length - 1,
          isShow: 1,
          _source: 'parse',
          colAlias: e.colAlias || e.colName,
        })),
      ].reduce((item, next) => {
        if (!hash[next.colName]) {
          hash[next.colName] = true
          item.push(next)
        } else {
          // 有重复的话，忽略但是要给之前冲突的打上标记
          const findConflict = item.findIndex(i => (i.colName === next.colName))
          item[findConflict]._source = 'conflict'
          item[findConflict].colAlias = item[findConflict].colAlias ? item[findConflict].colAlias : next.colAlias
        }
        return item
      }, [])
      const data = {
        ...reportConfig,
        fieldList: newField,
      }

      return data
    }

    async function initial () {
      try {
        const data = await getReportData()
        dispatch({ type: 'reset', payload: data })
      } catch (err) {
        setSQLError(err)
      }

      setLoaded(true)
    }

    if (id) {
      initial()
    } else {
      dispatch({ type: 'setMode', payload: { mode: Number(mode === 'DSL') } })
      setLoaded(true)
    }
  }, [id, mode])

  function onGoback () {
    history.push(obj2Url({
      groupId: _groupId,
      bizType,
    }, '/bi/list'))
  }

  return (
    <Context.Provider value={{ state, dispatch }}>
      <DndProvider backend={HTML5Backend}>
        <Page>
          <Header height={74}>
            <Toolbar
              groupId={groupId}
              bizType={bizType}
              readOnly={!!ro}
              id={id}
              mode={mode}
              _groupId={_groupId}
              onGoback={onGoback}
            />
          </Header>
          <Body>
            <Paragraph className={style.container} filled>
              {
                loaded
                  ? (
                    mode === 'DSL'
                      ? (
                        <Content>
                          {sqlError && <Alert closable style={{ marginTop: '12px' }} message={sqlError} type="error" showIcon />}
                          <WorkingAreaPro />
                        </Content>
                      )
                      : (
                        <Visualization />
                        // <>
                        //   <Block width={220}><Database mode="table" /></Block>
                        //   <Content><WorkingArea /></Content>
                        // </>
                      )
                  )
                  : <Skeleton />
              }
              <Block overflow="auto" width={220}>
                <PropertiesPane />
              </Block>
            </Paragraph>
          </Body>
        </Page>
      </DndProvider>
    </Context.Provider>
  )
}
