// 将映射值转成数组 支持排序
export const handleMap2Arr = (kvMap) => {
  const ret = []
  Object.keys(kvMap).forEach((key, i) => {
    const text = kvMap[key]?.text || kvMap[key]
    const orderBy = kvMap[key]?.orderBy || i
    ret.push({
      label: text,
      value: key,
      orderBy,
    })
  })
  ret.sort((a, b) => (a.orderBy > b.orderBy ? 1 : -1))
  return ret
}

// 在职状态
export const statusMap = {
  0: {
    text: '在职',
  },
  1: {
    text: '离职',
  },
  2: {
    text: '离职中',
  },
}

// 操作类型
export const optTypeMap = {
  grant: {
    text: '赋权',
  },
  cancel: {
    text: '取消赋权',
  },
  edit: {
    text: '更新',
  },
}

// 影响对象类型
export const targetTypeMap = {
  user: {
    text: '用户',
  },
  role: {
    text: '角色',
  },
}

// 资源类型
export const resourceTypeMap = {
  2: '数据集',
  5: '报表组',
  '4-1': '报表',
  '4-2': '仪表盘',
  '4-3': '数据导入模板',
  '4-4': '链接',
  '4-5': '功能按钮',
  '4-7': '接口',
}

// 权限类型
export const funcTypeMap = {
  1: {
    text: '失效鉴权',
  },
  2: {
    text: '查看',
  },
  3: {
    text: '下载',
  },
  4: {
    text: '使用',
  },
  5: {
    text: '管理',
  },
}

// 变更类型
export const roleSourceMap = {
  user: {
    text: '角色',
  },
  dept: {
    text: '部门角色',
  },
}

// 变更方式
export const changeTypeMap = {
  self_hold: '直接操作',
  inherit: '继承',
}

// 数据权限类型
export const dataAuthTypeMap = {
  organization: '组织架构',
  city_permission: '地理城市',
}
