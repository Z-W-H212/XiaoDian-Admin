import { useMemo } from 'react'

export default function usePagination (pageInfo) {
  const pagination = useMemo(() => {
    if (!pageInfo) return false

    const { total, pageNum, pageSize } = pageInfo
    return {
      current: pageNum,
      pageSize,
      total,
      showSizeChanger: true,
    }
  }, [pageInfo])

  return pagination
}
