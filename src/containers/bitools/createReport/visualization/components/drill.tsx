/* 下钻 */
import { useContext, useMemo, useRef, useEffect } from 'react'
import { ReactSortable } from 'react-sortablejs'
import Item from './item'
import Context from '../../Context'
import ReactSortableContext from '../Context'
import style from '../style.module.less'
import formatTagName from '@/utils/format-tag-name'

export default function Drill (): JSX.Element {
  const { state, dispatch } = useContext(Context)
  const { state: reactSortableState, dispatch: reactSortableDispatch } = useContext(ReactSortableContext)
  const { drillMap, fieldList } = state
  const instance = useRef()

  useEffect(() => {
    reactSortableDispatch({
      type: 'initInstance',
      payload: {
        field: 'drillInstance',
        instance,
      },
    })
  }, [instance])

  // 构建数据
  const data: any[] = useMemo(() => {
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
      return { key: item.colName, title: formatTagName(item) }
    })
  }, [drillMap, fieldList])

  const onClose = (key) => {
    dispatch({
      type: 'delDrill',
      payload: { colName: key },
    })
  }

  if (data.length === 0) {
    return null
  }

  /** 下钻逻辑：
  *     1、第一个必须在纬度里面  并且固定在第一个不可以拖拽  剩下的可以自由拖拽和删除
  *     2、删除第一个下钻项后面的全部删除
  *     3、如果将第一个下钻的维度删除或者拖拽到指标 则删除整个下钻
  *     4、添加/删除组织架构维度自动添加/删除下钻  不可以单独删除组织架构下钻
  */

  return (
    <div
      className={style.container}
      id="drill-container"
      style={{ opacity: reactSortableState.drillInstance?.current?.sortable.option('disabled') ? 0.3 : 1 }}
    >
      <label className={style.label}>图层下钻</label>
      <div className={style['drill-container']}>
        {[data[0]].map((item) => {
          const { key, title } = item
          return (
            <Item
              key={key}
              targetKey={key}
              title={title}
              onClose={key !== '#organization#'
                ? () => dispatch({
                  type: 'updateDrillMap',
                  payload: [],
                })
                : null}
            />
          )
        })}
        <ReactSortable
          ref={instance}
          tag="ul"
          list={data}
          setList={(dataTransfer) => {
            dispatch({ type: 'updateDrillMap', payload: dataTransfer })
          }}
          ghostClass={style.ghost} // 拖动时候影子元素添加的样式类
          animation={150} // 动画时长
          group={{
            name: 'drill',
            put: ['field-list'],
          }}
          chosenClass={style['drill-chosen']}
        >
          {data.map((item, i) => {
            const { key, title } = item
            let targetTitle = title
            if (state.drillMap[key]) {
              targetTitle = (
                <>
                  <i className={`${style.icon} ${style['drill-icon']} iconfont iconzuanqu-`} />
                  {title}
                </>
              )
            }

            return (
              <Item
                style={i === 0 ? { display: 'none' } : {}}
                key={key}
                targetKey={key}
                title={targetTitle}
                onClose={key !== '#organization#' ? onClose : null}
              />
            )
          })}
        </ReactSortable>
      </div>
    </div>
  )
}
