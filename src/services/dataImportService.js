import { dcapi } from '@/utils/axios'
import moment from 'moment'

function formatDateRange (rangeArray) {
  const [start, end] = rangeArray
  console.log(rangeArray)
  return [+(moment(start, 'YYYYMMDD').format('x')), +(moment(end, 'YYYYMMDD').format('x'))]
}
/**
 * admin - 查询模型列表
 * @param {Object} params 搜索条件
 */
export async function queryTemplates (params) {
  const data = await dcapi.post('/diana/dataImport/template/list', {
    createTimeRange: params.createTime && formatDateRange(params.createTime),
    creator: params.creator,
    modifier: params.modifier,
    modifyTimeRange: params.modifyTime && formatDateRange(params.modifyTime),
    name: params.name,
    status: params.status && +params.status,
    pageSize: params.pageSize,
    currentPage: params.current,
  })

  return {
    success: true,
    data: data.list,
    current: data.pageNum,
    pageSize: data.pageSize,
    total: data.total,
  }
}

/**
 * admin - 启停用模型
 * @param {String<ID>} modelID 模型ID
 */
export async function updateTemplateStatus (modelID, status) {
  const data = await dcapi.post('/diana/dataImport/template/changeStatus', {
    id: modelID,
    status: !status,
  })
  return data
}

/**
 * admin - 修改模型
 * @param {Object} params 模型参数
 */
export async function saveTemplate (params) {
  const data = await dcapi.post('/diana/dataImport/template/update', params)
  return data
}

/**
 * admin - 删除模型
 * @param {String<ID>} modelID 模型ID
 */
export async function removeTemplate (modelID) {
  return await dcapi.post(`/diana/dataImport/template/delete/${modelID}`)
}

/**
 * admin - 创建模型
 * @param {Object} params 模型参数
 */
export async function addTemplate (params) {
  const data = await dcapi.post('/diana/dataImport/template/insert', params)
  return data
}

/**
 * admin - 查询数据库
 */
export async function queryTemplateDBs () {
  const data = await dcapi.get('/diana/dataImport/template/dbList')
  return data
}

/**
 * admin - 查询数据表
 * @param {String} 数据库名
 */
export async function queryTemplateTables (dbName) {
  const data = await dcapi.get(`/diana/dataImport/template/tables/${dbName}`)
  return data
}

/**
 * admin - 查询字段
 * @param {Object} params 传入数据库和表名
 */
export async function queryTemplateFields ({ targetDatabase, targetTable }) {
  try {
    const data = await dcapi.get(`/diana/dataImport/template/fields/${targetDatabase}/${targetTable}`)
    return data
  } catch (err) {
    return Promise.reject(err)
  }
}
