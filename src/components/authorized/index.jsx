import { Redirect } from 'react-router-dom'

function Authorized ({ getUnauthorized, getForbidden, children }) {
  if (getUnauthorized()) return <Redirect to="/login" />
  if (getForbidden()) return <Redirect to="/403" />
  return children
}

export default Authorized
