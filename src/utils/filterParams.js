export default function filterParams (params = {}, ignoreKeys = []) {
  const mKey = {}
  Object.keys(params).forEach((key) => {
    const v = params[key]
    if ((v === null || v === undefined || (v.trim && v.trim() === '')) && ignoreKeys.indexOf(key) === -1) { return false }
    mKey[key] = v
  })
  return mKey
}
