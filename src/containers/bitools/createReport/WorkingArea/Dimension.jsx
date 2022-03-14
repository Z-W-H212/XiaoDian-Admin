import { useContext, useMemo } from 'react'
import { useDrop } from 'react-dnd'
import Target from '@/components/base/Target'
import DnDTargets from '../DnDTargets'
import Context from '../Context'
import style from './style.module.less'
import { message } from 'antd'

const menuData = ['drill']

export default function DimensionWrap (props) {
  const { state, dispatch } = useContext(Context)
  const [, drop] = useDrop({
    accept: ['field', 'organization'],
    drop (item) {
      const list = Object.keys(state.dimensionMap)
      if (state.defaultReportType !== 'TABLE' && list.length >= 1) {
        message.error('柱状图/折线图仅支持1个维度')
        return
      }
      dispatch({ type: 'copyDimension', payload: item })
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
    }),
  })

  const data = useMemo(() => {
    const list = Object.keys(state.dimensionMap).map((key) => {
      const { colName, colAlias, tagAlias, sequence } = state.dimensionMap[key]
      return { key: colName, title: tagAlias || colAlias, sequence }
    })
    list.sort((a, b) => a.sequence - b.sequence)

    return list
  }, [state.dimensionMap])

  const onMove = (data) => {
    dispatch({
      type: 'moveDimension',
      payload: {
        data,
      },
    })
  }

  const onChange = (key, value) => {
    dispatch({
      type: 'addDrill',
      payload: { colName: key },
    })
  }

  const onClose = (colName) => {
    dispatch({
      type: 'closeDimension',
      payload: { colName },
    })
  }

  const children = useMemo(() => {
    return (
      <DnDTargets
        title="维度"
        targetType="targetDimension"
        data={data}
        onMove={onMove}
        renderTarget={(item, isDragging) => {
          const { key, title } = item
          let targetTitle = title
          if (state.drillMap[key]) {
            targetTitle = (
              <>
                <i className={`${style.icon} iconfont iconzuanqu`} />
                {title}
              </>
            )
          }
          return (
            <Target
              isDragging={isDragging}
              targetKey={key}
              title={targetTitle}
              menuData={menuData}
              onChange={onChange}
              onClose={onClose}
            />
          )
        }}
      />
    )
  }, [data, state.drillMap])

  return (
    <div ref={drop} className={style.dropWrap}>
      {children}
    </div>
  )
}
