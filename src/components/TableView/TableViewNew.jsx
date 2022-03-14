import { useEffect, useState, useMemo } from 'react'
import { Table, Tooltip, Popover, Menu, Dropdown } from 'antd'
import SearchView from './SearchView'
import style from './style.module.less'
import { CaretDownOutlined } from '@ant-design/icons'
import { handleDecimal, handleSeparator } from '@/utils/tools'
import formatTagName from '@/utils/format-tag-name'

export default function TabViewFaster (props) {
  const { data, colList, onDrill, onAnchor, onChange, pagination, onCustomSorter } = props

  const [field, setField] = useState(undefined)
  const [order, setOrder] = useState(undefined)
  const [columns, setColumns] = useState([])

  const handleChange = (pagination, filters, sorter) => {
    const { field, order } = sorter
    setField(field)
    setOrder(order)
    onChange && onChange(pagination, filters, sorter)
    if (order) {
      setMenuSelectedKey('')
    }
  }

  // 自定义排序 -> 计算同环比
  const [menuSelectedKey, setMenuSelectedKey] = useState('')
  const handleCustomSorter = ({ key }) => {
    // 再次选择时清空当前排序
    if (menuSelectedKey === key) {
      setMenuSelectedKey('')
      onCustomSorter({})
    } else {
      // key: sortField&sortProp&sortMethod
      const [sortField, sortProp, sortMethod] = key.split('&')
      setMenuSelectedKey(key)
      onCustomSorter({
        sortField,
        sortMethod,
        sortProp,
      })
      // 当前为自定义排序时 清空常规的排序状态
      setField(undefined)
      setOrder(undefined)
    }
  }
  const customMenu = colName => (
    <Menu onClick={handleCustomSorter} selectedKeys={[menuSelectedKey]}>
      {
        [
          { key: 'value&asc', value: '按数值从小到大排序' },
          { key: 'value&desc', value: '按数值从大到小排序' },
          { key: 'rate&asc', value: '按环比从小到大排序' },
          { key: 'rate&desc', value: '按环比从大到小排序' },
          { key: 'yoy&asc', value: '按同比从小到大排序' },
          { key: 'yoy&desc', value: '按同比从大到小排序' },
        ].map(item => (<Menu.Item key={`${colName}&${item.key}`}>{item.value}</Menu.Item>))
      }
    </Menu>
  )
  const renderCustomSorterTitle = (title, colName) => {
    if (typeof onCustomSorter !== 'function') return title
    return (
      <Dropdown overlay={customMenu(colName)} trigger={['click']}>
        <div style={{ cursor: 'pointer' }}>
          <Tooltip placement="top" title="点击选择排序类型">
            {title}
            <CaretDownOutlined style={{ color: menuSelectedKey.indexOf(colName) >= 0 ? '#1890ff' : '#bfbfbf' }} />
          </Tooltip>
        </div>
      </Dropdown>
    )
  }

  const columnsFactory = useMemo(() => {
    const handleDrill = (key, value, row) => onDrill && onDrill(key, value, row)
    const handleAnchor = (colName, row, option) => onAnchor && onAnchor(colName, row, option)
    return colList.map((col, index) => {
      const {
        sort, colName, colAlias, isDrill, anchor, isShow, ifCalSamePeriodCompare,
        decimal, round, separator, tagAlias, tagTimePeriod, tagRemark,
      } = col
      if (!isShow) return false

      const title = formatTagName({ colName, colAlias, tagAlias, tagTimePeriod, tagRemark })

      const result = {
        key: colName,
        dataIndex: colName,
        title: sort && ifCalSamePeriodCompare ? renderCustomSorterTitle(title, colName) : title,
        // 当为计算同环比时则用自定义排序
        sorter: sort && !ifCalSamePeriodCompare
          ? (a, b) => {
            for (const index in a) {
              switch (index) {
                case 'bd_id':
                  return a.bd_id - b.bd_id
                case 'success_amount':
                  return a.success_amount - b.success_amount
                case 'bd_count':
                  return a.bd_count - b.bd_count
                default:
                  break
              }
            }
          }
          : '',
        width: 150,
        ellipsis: {
          showTitle: false,
        },
        onHeaderCell: column => ({
          width: column.width,
        }),
        render (value, row) {
          let _value = typeof value === 'object' && value !== null ? value.value : value
          _value = handleDecimal(_value, decimal, round)
          _value = separator ? handleSeparator(_value, true) : _value
          let result = _value
          if (isDrill) {
            result = <a onClick={handleDrill.bind(this, colName, _value, row)}><u>{_value}</u></a>
          } else if (anchor) {
            if (Array.isArray(anchor)) {
              // 1vn
              if (anchor.length > 1) {
                const content = (
                  <>
                    {
                      anchor.map(val => (
                        <div key={val.targetName}>
                          <a onClick={handleAnchor.bind(this, colName, row, val)}>{val.targetName}</a>
                        </div>))
                    }
                  </>
                )
                result = <Popover content={content} placement="bottom"><a>{_value}</a></Popover>
                // 只有一个点击直接跳转
              } else if (anchor.length === 1) {
                result = <a onClick={handleAnchor.bind(this, colName, row, anchor[0])}>{_value}</a>
              }
              // 保留原来数据为 map 的逻辑以免处理不全错误
            } else {
              result = <a onClick={handleAnchor.bind(this, colName, row, anchor)}>{_value}</a>
            }
          }

          result = <Tooltip placement="topLeft" title={_value}>{result}</Tooltip>

          // 计算同环比显示
          if (ifCalSamePeriodCompare && typeof value === 'object' && value.props) {
            result = (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{result}</div>
                <div style={{ width: 80, flexShrink: 0, fontSize: 12, color: '#999' }}>
                  <div>环: {handleIfCalSamePeriodCompare(value.props.rate)}</div>
                  <div>同: {handleIfCalSamePeriodCompare(value.props.yoy)}</div>
                </div>
              </div>
            )
          }

          return result
        },
      }

      if (field === colName) {
        result.sortOrder = order
      } else if (field === undefined) {
        result.sortOrder = false
      }

      if (colList.length > 0 && index === 0) {
        result.fixed = 'left'
      }
      return result
    }).filter(i => i)

    // 处理同环比显示逻辑
    function handleIfCalSamePeriodCompare (val) {
      if (typeof val === 'number') {
        let status = 'black'
        if (val < 0) {
          status = 'green'
        } else if (val > 0) {
          status = 'red'
        }
        return <span style={{ color: status }}>{(val * 100).toFixed(2)}%</span>
      }
      return '-'
    }
  }, [colList, field, onAnchor, onDrill, order])

  useEffect(() => {
    setColumns(columnsFactory)
  }, [columnsFactory])

  const widthSum = useMemo(() => {
    return columns.reduce((value, item) => {
      return value + item.width
    }, 0)
  }, [columns])

  /**
   * 因为antd@4有bug，暂时需要屏蔽伸缩列功能
   * @see https://codesandbox.io/s/gracious-butterfly-qrik1
   */
  return (
    <div className={style.tableWrapper}>
      <SearchView {...props} />
      <Table
        bordered
        columns={columns}
        dataSource={data}
        pagination={pagination || false}
        onChange={handleChange}
        scroll={{ x: widthSum, y: 500 }}
        size="middle"
      />
    </div>
  )
}
