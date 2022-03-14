import { dcapi } from '@/utils/axios'

export async function getAllDatabase (params) {
  const data = await dcapi.get('/diana/database/v1/getAllDatabase', { params })
  return data
}

export async function getTableInfo (params) {
  const data = await dcapi.post('/diana/database/v1/getTableInfo', params)
  if (data && data.tableColVOList) {
    data.tableColVOList.forEach((item) => {
      const { colName, colAlias } = item
      if (!colAlias) {
        item.colAlias = colName
      }
    })
  }
  return data
}

export async function setTableInfo (params) {
  await dcapi.post('/diana/database/v1/setTableInfo', params)
  return {}
}

export async function getOrganization (params) {
  const data = await dcapi.post('/diana/database/v1/getOrganization', params)
  return data
}

export async function reload (name) {
  await dcapi.post(`/diana/database/v1/reloadDatabase/${name}`)
  return {}
}

export async function getDataTypeList () {
  const data = await dcapi.get('/diana/database/v1/getDataTypeList')
  return data
}
