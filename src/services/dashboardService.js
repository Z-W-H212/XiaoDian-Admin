import { dcapi } from '@/utils/axios'
import filterParams from '@/utils/filterParams'

export async function getDashboardList () {
  const data = await dcapi.get('/diana/dashboard/v1/dashboardList')
  data.sort((a, b) => {
    return a.title.localeCompare(b.title)
  })
  return data
}

export async function getDashboardConfig (id) {
  const data = await dcapi.get(`/diana/dashboard/v1/dashboardConfig/${id}`)
  return data
}

export async function getUsereDashboardConfig (id) {
  const data = await dcapi.get(`/diana/dashboard/v1/dashboardConfigOfShow/${id}`)
  return data
}

export async function createDashboard (params) {
  const data = await dcapi.post('/diana/dashboard/v1/create', filterParams(params))
  return data
}

export async function updateDashboard (params) {
  const data = await dcapi.post('/diana/dashboard/v1/update', filterParams(params))
  return data
}

export async function delDashboard (id) {
  const data = await dcapi.get(`/diana/dashboard/v1/delete/${id}`)
  return data || {}
}
