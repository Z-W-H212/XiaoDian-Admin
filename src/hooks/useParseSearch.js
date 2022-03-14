import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import queryString from 'query-string'

/**
 * 自定义hooks 获取url参数
 * @returns {searchObj} url参数
 */
export default function useParseSearch () {
  const { search } = useLocation()

  return useMemo(() => {
    /** 处理查询参数中包含“+”问题
     *  queryString.parse 会 replace 掉 +
     *  https://github.com/sindresorhus/query-string/blob/main/index.js#L287
     */
    const searchObj = search ? queryString.parse(search.replace(/\+/g, '@@')) : {}
    Object.keys(searchObj).forEach((key) => {
      typeof searchObj[key] === 'string' && (searchObj[key] = searchObj[key].replace(/@@/g, '+'))
    })

    return searchObj
  }, [search])
}
