import { useState, useEffect, useContext, useRef } from 'react'
import { ReactSortable } from 'react-sortablejs'
import { CalendarOutlined, FontSizeOutlined, NumberOutlined } from '@ant-design/icons'
import Context from '../../Context'
import ReactSortableContext from '../Context'
import style from '../style.module.less'
import Item from './item'
import formatTagName from '@/utils/format-tag-name'

export default function FieldList (): JSX.Element {
  const { state } = useContext(Context)
  const { dispatch: reactSortableDispatch } = useContext(ReactSortableContext)
  const { dimensionMap, indexMap, drillMap, organization } = state
  const [list, setList] = useState([])
  const instance = useRef()

  useEffect(() => {
    reactSortableDispatch({
      type: 'initInstance',
      payload: {
        field: 'fieldListInstance',
        instance,
      },
    })
  }, [instance])

  useEffect(() => {
    const list = [...state.fieldList]

    if (organization.length > 0) {
      list.unshift({ colName: '#organization#', colAlias: '组织架构' })
    }
    setList(list)
  }, [state.fieldList, dimensionMap, indexMap, organization])

  return (
    <div style={{ marginTop: 12 }}>
      <h2>字段</h2>
      <ReactSortable
        ref={instance}
        className={style['field-list']}
        tag="ul"
        list={list}
        setList={setList}
        animation={150} // 动画时长
        sort={false} // 不允许拖拽排序
        group={{
          name: 'field-list',
          pull: 'clone', // clone
          put: false, // 不允许拖拽进这个列表
        }}
        // 处理重复字段  下钻唯一  纬度和指标并集唯一
        onClone={({ oldIndex }) => {
          const { colName } = list[oldIndex]
          if (dimensionMap[colName] || indexMap[colName]) {
            reactSortableDispatch({
              type: 'disabled',
              payload: {
                field: 'dimensionInstance',
                disabled: true,
              },
            })
            reactSortableDispatch({
              type: 'disabled',
              payload: {
                field: 'indicatorInstance',
                disabled: true,
              },
            })
          }
          if (drillMap[colName]) {
            reactSortableDispatch({
              type: 'disabled',
              payload: {
                field: 'drillInstance',
                disabled: true,
              },
            })
          }
        }}
        onEnd={() => {
          reactSortableDispatch({
            type: 'disabled',
            payload: {
              field: 'dimensionInstance',
              disabled: false,
            },
          })
          reactSortableDispatch({
            type: 'disabled',
            payload: {
              field: 'indicatorInstance',
              disabled: false,
            },
          })
          reactSortableDispatch({
            type: 'disabled',
            payload: {
              field: 'drillInstance',
              disabled: false,
            },
          })
        }}
      >
        {
        list.map((item) => {
          const { colName, colAlias, colType, tagTimePeriod, tagAlias, tagRemark, isNumber } = item
          let theIcon
          if (isNumber) {
            theIcon = <NumberOutlined />
          } else if ((/date/).test(colType)) {
            theIcon = <CalendarOutlined />
          } else if (colName !== '#organization#') {
            theIcon = <FontSizeOutlined />
          }
          const title = (
            <div>
              {theIcon}
              &nbsp;
              {formatTagName({ colName, colAlias, tagTimePeriod, tagAlias, tagRemark }, { isOnline: false })}
            </div>
          )
          const highlight = !!(dimensionMap[colName] || indexMap[colName])
          return (
            <Item
              key={item.colName}
              className={style['field-list-item']}
              style={{ borderColor: highlight ? '#1990ff' : '' }}
              title={title}
              htmlTitle={colName}
              highlight={highlight}
            />
          )
        })
      }
      </ReactSortable>
    </div>
  )
}
