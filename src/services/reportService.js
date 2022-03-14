import moment from 'moment'
import { dcapi } from '@/utils/axios'
import filterParams from '@/utils/filterParams'

function formatDateRange (rangeArray) {
  const [start, end] = rangeArray
  console.log(rangeArray)
  return [+(moment(start, 'YYYYMMDD').format('x')), +(moment(end, 'YYYYMMDD').format('x')) + 86399999]
}

export async function getReportList (params) {
  const data = await dcapi.post('/diana/report/v1/reportList', {
    bizType: params.bizType && +params.bizType,
    code: params.code,
    createTimeRange: params.createTime && formatDateRange(params.createTime),
    creator: params.creator,
    groupId: params.groupId,
    id: params.id,
    isLov: params.isLov === 'all' ? null : params.isLov, // ENUM
    mode: params.mode && +params.mode, // ENUM
    modifier: params.updator,
    modifyTimeRange: params.updateTime && formatDateRange(params.updateTime),
    title: params.title,
    status: params.status && +params.status,
    forTest: params.forTest === 'all' ? null : +params.forTest,

    size: params.pageSize,
    start: params.current,
  })

  return {
    success: true,
    data: data.list,
    current: data.pageNum,
    pageSize: data.pageSize,
    total: data.total,
  }
}

export async function getSimpleReportList (params) {
  const data = await dcapi.post('/diana/report/v1/simpleReportList', filterParams(params))
  return data
}

export async function delReport ({ id, versionCode = 0 }) {
  return await dcapi.get(`/diana/report/v1/delete/${id}/${versionCode}`)
}

export async function createPreview (params) {
  return await dcapi.post('/diana/report/v1/designPreview', filterParams({ ...params, start: 1, size: 10 }, ['tag']))
}

export async function createReport (params) {
  return await dcapi.post('/diana/report/v1/create', filterParams({ ...params, start: 1, size: 10 }, ['tag']))
}

export async function updateReport (params) {
  return await dcapi.post('/diana/report/v1/update', filterParams(params, ['tag']))
}

export async function updateAndPublishReport (params) {
  return await dcapi.post('/diana/report/v1/updateAndPublish', filterParams(params, ['tag']))
}

export async function getReportConfig ({ id, versionCode = 0 }) {
  const data = await dcapi.get(`/diana/report/v1/getConfig/${id}/${versionCode}`)
  data.fieldList.sort((a, b) => a.sequence - b.sequence)
  data.fieldList.forEach((item, i) => { item.sequence = i })
  return data
}

export async function getPreviewConfig (id, nickname, versionCode) { // 走管理员权限
  return await dcapi.post(`/diana/report/v1/getPreviewConfig/${id}/${versionCode || 0}`, filterParams({ nickname }), false)
}

export async function getUserReportConfig (id) { // 走用户权限，会被资源权限限制
  return await dcapi.get(`/diana/query/v1/reportConfig/${id}`, {}, false)
}

export async function getPreview (params) {
  return await dcapi.post('/diana/query/v1/reportPreview', filterParams(params))
}

export async function getReportData (params) {
  try {
    return await dcapi.post('/diana/query/v1/reportData', filterParams(params), false)
  } catch (error) {
    throw new Error(`ID:${params.id}查询失败，请联系管理员`)
  }
}

export async function sendEmail (params) {
  return await dcapi.post('/diana/query/v1/downloadReport', filterParams(params), false)
}

export async function getDSLFieldList (params) {
  return await dcapi.post('/diana/report/v1/getDslFieldInfoList', filterParams(params))
}

export async function getTreeGroups (params) {
  const { componentType, ...arg } = params
  if (componentType === 'interface') {
    return dcapi.get('/diana/menu/interfaceTree')
  }
  return await dcapi.post('/diana/group/v1/trees', arg)
}

export async function addTreeGroup (params) {
  return await dcapi.post('/diana/group/v1/add', params)
}

export async function renameTreeGroup (params) {
  return await dcapi.post('/diana/group/v1/edit', params)
}

export async function moveTreeGroup ({ id, moveTo }) {
  return await dcapi.post(`/diana/group/v1/move/${id}/${moveTo}`)
}

export async function delTreeGroup ({ id }) {
  return await dcapi.post(`/diana/group/v1/del/${id}`)
}

export async function publishReport (params) {
  return await dcapi.post('/diana/report/v1/publish', params)
}

export async function resotreReport (params) {
  return await dcapi.post('/diana/report/v1/restore', params)
}

export async function offlineReport ({ id }) {
  return await dcapi.post(`/diana/report/v1/offline/${id}`)
}

export async function rollbackReport (params) {
  return await dcapi.post('/diana/report/v1/rollback', params)
}

// 报表名称是否重复 （修改名称后校验使用）
export async function duplicateNewCheck (params) {
  return await dcapi.get('/diana/report/v1/nameCode/duplicate/newNameCheck/', { params })
}

// 报表名称是否重复 （恢复报表时使用）
export async function duplicateCheck ({ reportId, versionCode }) {
  return await dcapi.get(`/diana/report/v1/nameCode/duplicate/check/${reportId}${versionCode !== undefined ? `/${versionCode}` : ''}`)
}

export async function batchDelete (params) {
  return await dcapi.post('/diana/report/v1/batchDel', params)
}

export async function batchPublish (params) {
  return await dcapi.post('/diana/report/v1/batchPublish', params)
}

export async function batchImport (params) {
  return await dcapi.post('/diana/report/v1/batchImport', params)
}

export async function batchImportSave (params) {
  return await dcapi.post('/diana/report/v1/batchImport/save', params)
}

export async function batchExport (params) {
  await dcapi.downloadPOST('/diana/report/v1/batchExport', params)
}

export async function batchMove (params) {
  return await dcapi.post('/diana/report/v1/batchMove', params)
}

export async function reportVersions ({ id }) {
  const data = await dcapi.post(`/diana/report/v1/versions/${id}`)
  return {
    data,
    success: true,
  }
}

export async function reportArchive ({ id }) {
  return await dcapi.post(`/diana/report/v1/archive/${id}`)
}

export async function reportCopy ({ id, bizType, groupId, title }) {
  return await dcapi.post(`/diana/report/v1/copy/${id}`, {
    bizType,
    groupId,
    name: title,
  })
}

export async function reportLock ({ id }) {
  return await dcapi.post(`/diana/report/v1/lock/${id}`)
}

export async function reportUnlock ({ id }) {
  return await dcapi.post(`/diana/report/v1/unlock/${id}`)
}

export async function getReportLockStatus ({ id }) {
  const data = await dcapi.get(`/diana/report/v1/lockInfo/${id}`)
  return data.status
}

export async function getReportPermission () {
  const data = await dcapi.get('/diana/user/v1/getUserProps')
  return data
}

// 报表访问权限校验
export async function getReportCheck ({ reportId, versionCode = 0, type }) {
  return await dcapi.get(`/diana/report/v1/report/access/check/${reportId}/${versionCode}/${type}`)
}

// 检查当前登录用户是否具有文件夹的管理权限
export async function checkUserAccessBiGroup (params) {
  return await dcapi.get('/diana/user/userAccessBiGroup', { params })
}

// 报表鉴权选项
export async function reportAuthOptions (params) {
  return await dcapi.post('/diana/report/v1/data/auth/options', params)
}

// 查询特殊组件列表
export async function getSpecialTable () {
  return await dcapi.post('/diana/specialComponent/list', {})
}

// 查询所有特殊组件
export async function getAllSpecialTable () {
  return await dcapi.get('/diana/specialComponent/getAllComponent')
}

// 根据ID查询组件
export async function findSpecialID ({ id }) {
  return await dcapi.get(`/diana/specialComponent/findById/${id}`)
}

// 根据CODE查询组件
export async function findSpecialCode ({ code }) {
  return await dcapi.get(`/diana/specialComponent/findByCode/${code}`)
}

// 特殊组件注册
export async function SpecialComponentInsert (params) {
  return await dcapi.post('/diana/specialComponent/insert', params)
}

// 组件删除
export async function SpecialComponentDelete (id) {
  return await dcapi.get(`/diana/specialComponent/deletedById/${id}`)
}

// 组件关联资源
export async function relatedResource (code) {
  return await dcapi.get(`/diana/specialComponent/listRelatedReportByCode?code=${code}`)
}

// 组件列表编辑
export async function editResource (params) {
  return await dcapi.post('/diana/specialComponent/updateById', params)
}

// 报表新增下载条数选项
export async function getReportDownLoadLimit () {
  return await dcapi.get('/diana/report/v1/download/limit')
}
