/* 纬度 */
import { useContext, useMemo, useRef, useEffect } from 'react'
import { ReactSortable } from 'react-sortablejs'
import Context from '../../Context'
import ReactSortableContext from '../Context'
import style from '../style.module.less'
import Item from './item'
import formatTagName from '@/utils/format-tag-name'

const menuData = ['drill']

export default function Dimension (): JSX.Element {
  const { state, dispatch } = useContext(Context)
  const { state: reactSortableState, dispatch: reactSortableDispatch } = useContext(ReactSortableContext)
  const instance = useRef()

  useEffect(() => {
    reactSortableDispatch({
      type: 'initInstance',
      payload: {
        field: 'dimensionInstance',
        instance,
      },
    })
  }, [instance])

  const data: any[] = useMemo(() => {
    const list = Object.keys(state.dimensionMap).map((key) => {
      const { colName, colAlias, tagAlias, tagTimePeriod, tagRemark, sequence } = state.dimensionMap[key]
      const title = formatTagName({ colName, colAlias, tagAlias, tagTimePeriod, tagRemark })
      return { key: colName, title, sequence }
    })
    list.sort((a, b) => a.sequence - b.sequence)
    return list
  }, [state.dimensionMap])

  const onChange = (key) => {
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

  return (
    <div
      className={style.container}
      id="dimension-container"
      style={{ opacity: reactSortableState.dimensionInstance?.current?.sortable.option('disabled') ? 0.3 : 1 }}
    >
      <label className={style.label}>纬度</label>
      <ReactSortable
        ref={instance}
        tag="ul"
        list={data}
        setList={(dataTransfer) => {
          dispatch({ type: 'updateDimensionMap', payload: dataTransfer })
        }}
        ghostClass={style.ghost} // 拖动时候影子元素添加的样式类
        animation={150} // 动画时长
        group={{
          name: 'dimension',
          put: ['field-list', 'indicator'],
        }}
      >
        {data.map((item) => {
          const { key, title } = item
          let targetTitle = title
          if (state.drillMap[key]) {
            targetTitle = (
              <>
                <i
                  className={`${style.icon} iconfont iconzuanqu`}
                  style={{ fontSize: 12 }}
                />
                {title}
              </>
            )
          }
          return (
            <Item
              key={key}
              targetKey={key}
              title={targetTitle}
              menuData={menuData}
              onChange={onChange}
              onClose={onClose}
            />
          )
        })}
      </ReactSortable>
    </div>
  )
}
