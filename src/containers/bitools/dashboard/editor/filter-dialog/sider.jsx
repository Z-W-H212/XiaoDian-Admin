import { useMemo, useContext } from 'react'
import { Button } from 'antd'
import RichTree from '@/components/base/RichTree'
import FilterContext from './filter-context'

import style from './style.module.less'

export default function Sider (props) {
  const { state, dispatch } = useContext(FilterContext)

  const onAdd = () => {
    dispatch({ type: 'addFilterHandle' })
  }

  const onSelect = (keys) => {
    props.onSelect && props.onSelect(keys[0])
  }

  const onChange = (data) => {
    const filterHandleList = Object.keys(data).map((key) => {
      return data[key]
    })
    dispatch({
      type: 'setFilterHandleList',
      payload: { filterHandleList },
    })
  }

  const treeMap = useMemo(() => {
    const treeMap = {}
    state.filterHandleList.forEach(({ id, title }) => {
      treeMap[id] = { id, title }
    })
    return treeMap
  }, [state.filterHandleList])

  return (
    <div>
      <div className={style.add}>
        <Button className={style.button} onClick={onAdd}>
          <i className="iconfont iconplus" />
          添加筛选器
        </Button>
      </div>
      <RichTree
        data={treeMap}
        tools={['edit', 'del']}
        onSelect={onSelect}
        onChange={onChange}
        onBeforeDel={() => onSelect([])}
      />
    </div>
  )
}
