import { useState, useMemo, useEffect, useContext } from 'react'
import { Select, Modal, Spin, Form } from 'antd'
import { DatabaseOutlined } from '@ant-design/icons'
import { useHistory } from 'react-router-dom'
import useFetch from '@/hooks/useFetch'
import useParseSearch from '@/hooks/useParseSearch'
import Context from '../../Context'
import { getAllDatabase, getTableInfo, getOrganization } from '@/services/databaseService'
import { reportAuthOptions } from '@/services/reportService'

export default function SelectDatabase (props): JSX.Element {
  const { state, dispatch } = useContext(Context)
  const { dbName, tableName } = state

  const [showDialog, setShowDialog] = useState(false)
  const [organizationRes, fetchOrganization]: any = useFetch(getOrganization, { data: [] })
  const [tableInfoRes, fetchTableInfo]: any = useFetch(getTableInfo, { data: {} })

  useEffect(() => {
    const fetch = async () => {
      const organization = await fetchOrganization({ dbName, tableName })
      const data = await fetchTableInfo({ dbName, tableName, usage: 4 })

      let fieldList = []
      const map = {}
      data.tableColVOList.forEach((item) => {
        const { colType } = item
        if (!map[colType]) {
          map[colType] = []
        }
        map[colType].push(item)
      })

      const keys = Object.keys(map)
      keys.sort((a, b) => b.localeCompare(a))
      keys.forEach((key) => {
        map[key].sort((a, b) => a.colAlias.localeCompare(b.colAlias))
        fieldList = fieldList.concat(map[key])
      })

      dispatch({
        type: 'setFieldList',
        payload: { fieldList },
      })
      dispatch({
        type: 'setParamKeyList',
        payload: {
          fieldList,
          hasHierarchy: organization.length > 0,
        },
      })
      if (organization.length > 0) {
        dispatch({
          type: 'setOrganization',
          payload: { organization },
        })
      }
    }

    if (dbName && tableName) {
      fetch()
    }
  }, [dbName, tableName])

  const dataSource = useMemo(() => {
    if (props.mode === 'db') {
      return (
        <a onClick={() => setShowDialog(true)}>
          <DatabaseOutlined />&nbsp;
          {state.dbName ? '' : '选择数据源'}
          <span title={state.dbName}>{state.dbName}</span>
        </a>
      )
    }

    const tableName = tableInfoRes.data.tableAlias || state.tableName
    return (
      <a onClick={() => setShowDialog(true)}>
        <DatabaseOutlined />&nbsp;
        {tableName ? '' : '选择数据集：'}
        <span title={tableName}>{tableName}</span>
      </a>
    )
  }, [tableInfoRes, props.mode, state.dbName, state.tableName, setShowDialog])

  return (
    <div style={{ marginTop: 12 }}>
      <h2>数据源</h2>
      <Spin spinning={organizationRes.loading || tableInfoRes.loading}>
        <div style={{ marginLeft: 12 }}>
          {dataSource}
          {showDialog
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            ? <Dialog mode={props.mode} onOk={() => setShowDialog(false)} onCancel={() => setShowDialog(false)} />
            : null}
        </div>
      </Spin>
    </div>
  )
}

function Dialog (props) {
  const history = useHistory()
  const { mode, id } = useParseSearch(history.location.search)
  const { state, dispatch } = useContext(Context)
  const [{ data, loading: fetchingDatabase }, fetchDatabase]: any = useFetch(getAllDatabase, { data: {} })

  const [dbName, setDBName] = useState(state.dbName)
  const [tableName, setTableName] = useState(state.tableName)
  const dbList = useMemo(() => Object.keys(data), [data])
  const [tableList, setTableList] = useState([])

  useEffect(() => {
    setTableList(data[dbName] || [])
  }, [data, dbName])

  useEffect(() => {
    fetchDatabase({ type: 4, onlyOnline: true })
      .then((data) => {
        const dbList = Object.keys(data)
        if (dbList.length > 0 && !dbName) {
          setDBName(dbList[0])
        }
      })
  }, [])

  function onOk () {
    if (dbName && tableName && state.dbName && state.tableName) {
      if (dbName !== state.dbName || tableName !== state.tableName) {
        dispatch({ type: 'init' })
      }
    }

    dispatch({
      type: 'setSelectDBInfo',
      payload: { dbName, tableName },
    })

    if (
      mode === 'GRAPH' && dbName && tableName &&
      (
        (state.tableName && state.dbName &&
          (dbName !== state.dbName || tableName !== state.tableName)
        ) ||
        !id
      )
    ) {
      reportAuthOptions({
        dataSetName: tableName,
        dbName: dbName,
      }).then((r) => {
        if (r.availableOption.length) {
          dispatch({
            type: 'setPermission',
            payload: { permission: r.availableOption.pop() },
          })
        }
        dispatch({
          type: 'setUnavailableReason',
          payload: r.unavailableReason,
        })
      })
    }

    props.onOk && props.onOk()
  }

  const filterOption: any = (inputValue, { key, children }) => {
    const includesVal = (a, b) => {
      const val = String(a).toLowerCase()
      return val.includes(b.toLowerCase())
    }
    return includesVal(key, inputValue) || includesVal(children, inputValue)
  }

  const selectTable = useMemo(() => {
    if (props.mode !== 'table') {
      return null
    }
    return (
      <Select
        showSearch
        notFoundContent={tableList ? <Spin size="small" /> : null}
        placeholder="选择表"
        value={tableName}
        onChange={v => setTableName(v)}
        filterOption={filterOption}
      >
        {tableList.map((table) => {
          const { tableName, tableAlias } = table
          return (
            <Select.Option key={tableName} value={tableName}>
              {tableAlias || tableName}
            </Select.Option>
          )
        })}
      </Select>

    )
  }, [props.mode, tableName, tableList, setTableName])

  return (
    <Modal
      title="选择数据集"
      visible
      onOk={onOk}
      onCancel={props.onCancel}
    >
      <Form>
        <Form.Item>
          <Select
            showSearch
            placeholder="选择数据库"
            value={dbName}
            notFoundContent={fetchingDatabase ? <Spin size="small" /> : null}
            onChange={v => setDBName(v)}
            filterOption={filterOption}
          >
            {dbList.map((name) => {
              return <Select.Option key={name} value={name}>{name}</Select.Option>
            })}
          </Select>
        </Form.Item>
        <Form.Item>
          {selectTable}
        </Form.Item>
      </Form>
    </Modal>
  )
}
