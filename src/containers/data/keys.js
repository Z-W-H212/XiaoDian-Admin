export const indexList = [
  {
    key: 'sequence',
    title: '序号',
    width: 100,
  },
  {
    key: 'userId',
    title: '员工ID',
    width: 100,
  },
  {
    key: 'nickName',
    title: '花名',
    width: 100,
  },
  {
    key: 'status',
    title: '在职状态',
    width: 100,
    render (value) {
      const map = {
        0: '在职',
        1: '离职',
        2: '离职中',
      }
      return map[value]
    },
  },
  {
    key: 'creator',
    title: '创建人',
    width: 100,
  },
  {
    key: 'role',
    title: '角色',
    width: 100,
  },
  {
    key: 'departmentName',
    title: '部门',
    width: 100,
  },
  {
    key: 'permissionList',
    title: '权限',
    render (value, row) {
      return value.map(item => item.nickName).join(',')
    },
  },
  {
    key: 'updator',
    title: '更新人',
    width: 100,
  },
  {
    key: 'updateTime',
    title: '更新时间',
    width: 140,
  },
]
