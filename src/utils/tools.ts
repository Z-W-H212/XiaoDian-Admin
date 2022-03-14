/**
 * [isEmpty 是否为空]
 * @param {any}
 * return {boolean}
*/
export function isEmpty (param: any): boolean {
  return param === undefined || param === null
}

/**
 * [handleDecimal 处理小数]
 * @number {number|string}  需要处理的数
 * @decimal {[number]}  保留几位小数
 * @round {[boolean]}  是否四舍五入
 * return {string} 处理之后的字符串数字
*/
export function handleDecimal (number: number | string, decimal?: number, round?: boolean): string {
  const n = String(number)
  const pointI = n.indexOf('.')
  if (isEmpty(decimal) || !/^-?\d*\.?\d*$/.test(n)) return n
  if (pointI === -1 || n.length - pointI <= decimal || round) {
    return Number(number).toFixed(decimal)
  }
  return n.substring(0, pointI + decimal + 1)
}

/**
 * [handleSeparator 处理千分位]
 * @number {number|string}  需要梳理的数字
 * @isHandleDecimal {[boolean]}  是否处理小数的千分位
 * return {string} 处理之后的字符串数字
*/
export function handleSeparator (number: number | string, isHandleDecimal?: boolean): string {
  const n = String(number)
  if (!isHandleDecimal) return n.replace(/(\d{1,3})(?=(\d{3})+(?:\.))/g, '$&,')

  const [n1, n2] = n.split('.')
  return n1.replace(/(\d{1,3})(?=(\d{3})+(?:$|\.))/g, '$&,') + (n2 ? `.${n2.replace(/(?=(\d{3})+)(\d{1,3})/g, '$&,').replace(/,$/, '')}` : '')
}

/**
 * [obj2Url 对象转URL]
 * @searchParams {object}  查询参数
 * @url {[string]}  需要补全的URL
 * return {string} 补全后的URL 或 查询字符串
*/
export function obj2Url (searchParams: {[key: string]: string | number | undefined | null}, url?: string): string {
  const searchArr = []
  let ret = ''
  Object.keys(searchParams).forEach((key) => {
    searchParams[key] !== undefined &&
    searchParams[key] !== null &&
    searchParams[key] !== 'undefined' &&
    searchParams[key] !== 'null' &&
    searchArr.push(`${key}=${searchParams[key]}`)
  })
  if (url) {
    if (url.indexOf('?') >= 0) {
      url += '&'
    } else {
      url += '?'
    }
    ret = url
  }
  return ret + searchArr.join('&')
}
