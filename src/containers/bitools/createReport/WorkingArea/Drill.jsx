import { useContext, useMemo } from 'react'
import { useDrop } from 'react-dnd'
import Target from '@/components/base/Target'
import DnDTargets from '../DnDTargets'
import Context from '../Context'
import style from './style.module.less'

export default function Panel (props) {
  const { state, dispatch } = useContext(Context)
  const { drillMap, fieldList } = state

  const [, drop] = useDrop({
    accept: ['field'],
    drop (item) {
      const { colName } = item
      dispatch({ type: 'addDrill', payload: { colName } })
    },
  })

  const data = useMemo(() => {
    if (fieldList.length === 0) {
      return []
    }
    const list = Object.keys(drillMap).map(key => drillMap[key])
    list.sort((a, b) => a.sequence - b.sequence)
    return list.map(({ colName }) => {
      if (colName === '#organization#') {
        return { key: '#organization#', title: '组织架构' }
      }
      const item = fieldList.find((item) => {
        return item.colName === colName
      })
      return { key: item.colName, title: item.colAlias }
    })
  }, [drillMap, fieldList])

  const onMove = (list) => {
    dispatch({
      type: 'moveDrill',
      payload: { list },
    })
  }

  const onClose = (key) => {
    dispatch({
      type: 'delDrill',
      payload: { colName: key },
    })
  }

  const children = useMemo(() => {
    if (data.length === 0) {
      return null
    }
    return (
      <div ref={drop} className={style.drill}>
        <DnDTargets
          title="图层钻取"
          targetType="targetDrill"
          joinIcon={<i className="iconfont iconzuanqu-" />}
          data={data}
          onMove={onMove}
          renderTarget={(item, isDragging) => {
            const { key, title } = item
            return (
              <Target
                isDragging={isDragging}
                targetKey={key}
                title={title}
                onClose={key !== '#organization#' ? onClose : null}
              />
            )
          }}
        />
      </div>
    )
  }, [data])

  return children
}
