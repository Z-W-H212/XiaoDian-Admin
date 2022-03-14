type TagData = {
  tagAlias?: string
  colAlias?: string
  colName?: string
  tagTimePeriod?: string
  tagRemark?: string
}

type OptionData = {
  isOnline?: boolean
}
export default function formatTagName (data: TagData, option?: OptionData): string {
  const { tagAlias, colAlias, colName, tagTimePeriod, tagRemark } = data
  const title = `${tagTimePeriod || ''}${tagAlias || colAlias || colName || ''}`
  let formatStr = ''
  if (option?.isOnline === false) {
    formatStr = `${title}${tagRemark ? `&lt;br&gt;(${tagRemark})` : ''}`
  }
  formatStr = `${title}${tagRemark ? `(${tagRemark})` : ''}`
  return formatStr === '' ? '-' : formatStr
}
