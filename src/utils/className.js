export default function className (props, names) {
  if (props.className) {
    return `${names} ${props.className}`
  }
  return names
}
