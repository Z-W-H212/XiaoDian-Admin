import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import AsyncComponent from '@/components/async-component'
import Authorized from '@/components/authorized'
import { generateRouteConfig } from './utils'
import { publicRoutes, privateRoutes, redirectRoutes } from './routes'
import App from '@/containers/app'

const privateRoutesConfig = generateRouteConfig(privateRoutes)
const publicRoutesConfig = generateRouteConfig(publicRoutes)
const redirectRoutesConfig = generateRouteConfig(redirectRoutes)

function getIsUnauthorized () {
  const token = window.localStorage.getItem('token')
  return !token
}

function getIsForbidden (authList = []) {
  return () => {
    const auth = window.localStorage.getItem('role') || ''
    return !(auth === 'admin' || authList.includes(auth))
  }
}

function mapRoutes (
  routes,
  isAuthorized = false,
) {
  return routes.map(({ path, authority, exact, Component }) => {
    const UnauthorizedRouteContent = (
      <AsyncComponent loadingDelay={200}>
        <Component />
      </AsyncComponent>
    )

    const AuthorizedRouteContent = (
      <Authorized
        getUnauthorized={getIsUnauthorized}
        getForbidden={getIsForbidden(authority)}
      >
        {UnauthorizedRouteContent}
      </Authorized>
    )

    return (
      <Route exact={exact} key={path} path={path}>
        {isAuthorized ? AuthorizedRouteContent : UnauthorizedRouteContent}
      </Route>
    )
  })
}

function BaseRouter ({ history }) {
  return (
    <Router>
      <Switch>
        {mapRoutes(publicRoutesConfig)}
        <Route path="/">
          <App>
            <Switch>
              {mapRoutes(privateRoutesConfig, true)}
              {mapRoutes(redirectRoutesConfig)}
            </Switch>
          </App>
        </Route>
      </Switch>
    </Router>
  )
}

export default BaseRouter
