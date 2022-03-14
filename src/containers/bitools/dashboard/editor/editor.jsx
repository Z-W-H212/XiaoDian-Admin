import { useState, useMemo, useEffect, useContext, useReducer } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useHistory } from 'react-router-dom'
import { Input, Button } from 'antd'

import Paragraph from '@/components/layout/Paragraph'
import DragTarget from '@/components/base/drag-target'

import Block from './block'
import FilterDialog from './filter-dialog'
import Context from './Context'
import model from './model'

import useParseSearch from '@/hooks/useParseSearch'
import useFetch from '@/hooks/useFetch'
import { createDashboard, updateDashboard, getDashboardConfig } from '@/services/dashboardService'
import { getSimpleReportList } from '@/services/reportService'

import style from './style.module.less'

export default function Editor (props) {
  const { id } = useParseSearch(props)
  const history = useHistory()
  const [state, dispatch] = useReducer(model.reducer, model.state)

  useEffect(() => {
    const fetch = async () => {
      const { title, desc, list, paramList } = await getDashboardConfig(id)
      dispatch({
        type: 'initDashboard',
        payload: { title, desc, paramList, list },
      })
    }
    if (id) {
      fetch()
    } else {
      dispatch({ type: 'initBlocks' })
    }
  }, [id])

  const onSave = async (params) => {
    if (id) {
      await updateDashboard({ ...params, id })
    } else {
      await createDashboard(params)
    }
    history.goBack()
  }

  return (
    <Context.Provider value={{ state, dispatch }}>
      <DndProvider backend={HTML5Backend}>
        <div className={style.editor}>
          <PropertiesPane />
          <Panel onSave={onSave} onCancel={() => history.goBack()} />
        </div>
      </DndProvider>
    </Context.Provider>
  )
}

function PropertiesPane (props) {
  const { state, dispatch } = useContext(Context)
  const [showFilter, setShowFilter] = useState(false)

  const onChangeTitle = (e) => {
    dispatch({
      type: 'setTitle',
      payload: { title: e.target.value },
    })
  }

  const onChangeDesc = (e) => {
    dispatch({
      type: 'setDesc',
      payload: { desc: e.target.value },
    })
  }

  return (
    <div className={style.properties}>
      <div className={style.propItem}>
        <h2>标题</h2>
        <Input size="large" value={state.title} onChange={onChangeTitle} />
      </div>
      <div className={style.propItem}>
        <h2>描述</h2>
        <Input.TextArea size="large" value={state.desc} onChange={onChangeDesc} />
      </div>
      <ResourceList />
      <div className={style.propItem}>
        <h2>全局筛选器</h2>
        <Button
          className={style.fullButton}
          size="large"
          type="primary"
          onClick={() => setShowFilter(true)}
        >
          配置筛选器
        </Button>
      </div>
      {showFilter
        ? <FilterDialog onOk={() => setShowFilter(false)} onCancel={() => setShowFilter(false)} />
        : null}
    </div>
  )
}

function ResourceList (props) {
  const { state, dispatch } = useContext(Context)
  const [{ data }, fetchReport] = useFetch(getSimpleReportList, { data: [] })

  useEffect(() => {
    const fetch = async () => {
      // bizType: 0 过滤仪表盘数据
      const data = await fetchReport({ bizType: 0 })
      dispatch({
        type: 'setReportList',
        payload: { data },
      })
    }
    fetch()
  }, [])

  const highlightReports = useMemo(() => {
    const { blockMap } = state
    const list = Object.keys(blockMap)
      .map(key => blockMap[key].id)
      .filter(id => id)

    return list
  }, [state.blockMap])

  const children = useMemo(() => {
    return data.map((item) => {
      const { id, title } = item
      const highlight = highlightReports.indexOf(id) > -1
      return (
        <DragTarget
          key={id}
          id={id}
          title={title}
          dragType="resource"
          className={style.target}
          highlight={highlight}
        />
      )
    })
  }, [data, highlightReports])

  return <div className={style.resource}>{children}</div>
}

function Panel (props) {
  const { state } = useContext(Context)

  const onSave = async () => {
    const { filterList } = state

    const list = Object.keys(state.blockMap)
      .map((key) => {
        const item = state.blockMap[key]
        if (item.id) {
          return { ...item, reportId: item.id }
        }
        return null
      })
      .filter(item => item)

    const params = {
      title: state.title,
      desc: state.desc,
      width: 0,
      height: 0,
      paramList: filterList,
      list,
    }

    props.onSave && props.onSave(params)
  }

  // const search = useMemo(() => {
  //   const list = []
  //   Object.keys(state.filterMap).forEach((id) => {
  //     const item = state.filterMap[id]
  //     const { label, componentType, targetMap } = item
  //     const targetKeys = Object.keys(targetMap)
  //     if (targetKeys.length === 0) {
  //       return false
  //     }
  //     list.push({ paramName: id, label, componentType })
  //   })
  //   if (list.length > 0) {
  //     return <SearchForm data={list} />
  //   }
  //   return null
  // }, [state.filterMap])

  return (
    <div className={style.panel}>
      <Paragraph>
        <Paragraph.Content>
          <h1>{state.title}</h1>
        </Paragraph.Content>
        <Paragraph.Block>
          <Button className={style.button} size="large" onClick={props.onCancel}>取消</Button>
          <Button className={style.button} size="large" type="primary" onClick={onSave}>保存</Button>
        </Paragraph.Block>
      </Paragraph>
      {/* {search} */}
      <Wrap />
    </div>
  )
}

function Wrap (props) {
  const { state } = useContext(Context)

  const children = useMemo(() => {
    return Object.keys(state.blockMap).map((i) => {
      const data = state.blockMap[i]
      return <Block key={i} data={data} />
    })
  }, [state.blockMap])

  return (
    <div className={style.wrap}>
      <div className={style.blockList}>
        {children}
      </div>
    </div>
  )
}
