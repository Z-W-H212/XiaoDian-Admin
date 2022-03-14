import moment, { Moment } from 'moment'
type ValueType = Moment | Moment[] | string | string[] | unknown

export function transformValue (value: ValueType, componentType: string): ValueType {
  if (value instanceof moment) {
    if (componentType === 'DATE_MONTH') {
      const date = moment(`${(value as Moment).format('YYYYMM')}01`).add(1, 'months')
        .subtract(1, 'days')
      return date.format('YYYYMMDD')
    }
    return (value as Moment).format('YYYYMMDD')
  }
  if (value instanceof Array) {
    const list = []
    value.forEach((value) => {
      if (value instanceof moment) {
        list.push((value as Moment).format('YYYYMMDD'))
      } else {
        list.push(value)
      }
    })
    if (componentType === 'NUMBER_RANGE' && value[0] === null && value[1] === null) {
      return null
    }
    return list
  }
  if (componentType === 'NUMBER_MIN') {
    return value[0]
  } else if (componentType === 'NUMBER_MAX') {
    return value[1]
  }
  return value
}

enum MechanismType {
  INDEX = 0
}
type SpecialValueType = {
  [key: string]: any
}
export function specialValueToMap (value: SpecialValueType, mechanism: MechanismType, contraColumns: [])
  : SpecialValueType {
  const map: SpecialValueType = {}
  if (mechanism === MechanismType.INDEX) {
    contraColumns.forEach(({ codeName, relationCode }) => {
      map[relationCode] = value[codeName]
    })
  }
  return map
}
