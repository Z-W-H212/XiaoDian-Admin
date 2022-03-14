import { dcapi } from '@/utils/axios'

export interface ITableInfo {
  businessDomainId: string
  businessDomainName: string
  tableAlias: string
  tableDesc: string
  tableName: string
  tableId: string
  tableColVOList: {
    colAlias: string
    colDesc: string
    colName: string
    tagAlias?: string
    tagRemark?: string
  }[]
  haveAuth: boolean
  tagName: string
  tagRemark: string
}

export function getTableInfo (params: {
  businessDomain?: string
  dbName: string
  tableName: string
  usage: number
}): Promise<ITableInfo> {
  return dcapi.post('/diana/database/v1/getTableInfo', params)
}

export async function postTableInfo (params: {
  businessDomainId?: string
  tableAlias: string
  tableDesc: string
  tableName: string
  dbName: string
}): Promise<'ok'> {
  return await dcapi.post('/diana/database/v1/setTableInfo', params)
}

export function postRuledRaw (params: {
  rowRule: string,
  schemaTableId: string,
}): Promise<unknown> {
  return dcapi.post('/diana/database/v1/row/rule/check', params)
}

export interface IAllDatabas {
  [key: string]: {
    businessDomainId: string
    businessDomainName: string
    tableAlias: string
    tableColVOList: string
    tableDesc: string
    tableName: string
    tableId: string
  }[]
}

export async function getAllDatabase (params): Promise<IAllDatabas> {
  return await dcapi.get('/diana/database/v1/getAllDatabase', { params })
}

export interface IBusinessDomain {
  domainId: string
  domainName: string
}

export async function getBusinessDomain (): Promise<IBusinessDomain[]> {
  return await dcapi.get('/diana/database/v1/getBusinessDomain')
}

export async function postBusinessDomain (name: string): Promise<'ok'> {
  return await dcapi.post(`/diana/database/v1/addBusinessDomain/${name}`)
}

export async function postTableColInfo (params: {
  colAlias: string
  colDesc: string
  colName: string
  tagId: string
  tagRemark: string
  dbName: string
  tableName: string
}): Promise<void> {
  return await dcapi.post('/diana/database/v1/setTableColInfo', params)
}

export async function getTablePreview (params: {
  schemaTableId: string
}): Promise<{
  rows: { [key: string]: any }[]
}> {
  return await dcapi.get('/diana/database/v1/designPreview', { params })
}

type TagItem = { id: string, name: string, isMatch: boolean, tagAlias: string }
type TagListParam = { queryKey: string, fieldName: string, fieldAlias: string }
export async function getTagList (params: TagListParam): Promise<TagItem[]> {
  return await dcapi.post('/diana/database/v1/tag/list ', params)
}

export async function checkMatchDw (dsName: string): Promise<{ status: boolean }> {
  return await dcapi.post(`/diana/database/v1/checkMatchDw/${dsName}`)
}

export async function matchTag (fieldName: string, fieldAlias: string): Promise<{ status: boolean }> {
  return await dcapi.post('/diana/database/v1/matchTag', { fieldName, fieldAlias }) || {}
}
