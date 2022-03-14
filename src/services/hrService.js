import { z } from '@/utils/axios'
import filterParams from '@/utils/filterParams'

export async function getAsyncTree (params) {
  const arg = { ...params }
  const data = await z.post('/shield/organization/v1/getByDep', filterParams(arg))
  return data
}
