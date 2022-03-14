import { dcapi } from '@/utils/axios'
import filterParams from '@/utils/filterParams'

export async function getDatasourceList (params) {
  const data = await dcapi.post('/diana/ds/v1/list', {
    pageSize: params.pageSize,
    currentPage: params.current,
  })

  return {
    success: true,
    data: data.list,
    current: data.pageNum,
    pageSize: data.pageSize,
    total: +data.total,
  }
}

export async function addSource (params) {
  const result = await dcapi.post('/diana/ds/v1/add', filterParams(params))
  return result
}

export async function editSource (params) {
  const result = await dcapi.post('/diana/ds/v1/edit', params)
  return result
}

export async function delSource (id) {
  await dcapi.post(`/diana/ds/v1/del/${id}`)
  return {}
}

export async function testSource (params) {
  await dcapi.post('/diana/ds/v1/test', filterParams(params))
  return {}
}
