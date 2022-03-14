import { lazy } from 'react'

export function supplyRoutes (routes, parentPath = '') {
  return routes.map((route) => {
    const config = {
      ...route,
      path: parentPath + route.path,
    }

    if (route.children) {
      config.children = supplyRoutes(
        route.children,
        config.path,
      )
    }

    return config
  })
}

export function flattenRoutes (routes) {
  const flattenedRoutes = []

  ;(function recursion (_routes) {
    _routes.forEach((route) => {
      flattenedRoutes.push(route)
      if (route.children) {
        recursion(route.children)
        delete route.children
      }
    })
  })(routes)

  return flattenedRoutes
}

export function generateRouteConfig (routes) {
  return flattenRoutes(supplyRoutes(routes)).map((route) => {
    if (!route.component) {
      return null
    }

    const Component = lazy(route.component)
    return {
      ...route,
      Component,
    }
  })
    .filter(i => i)
}
