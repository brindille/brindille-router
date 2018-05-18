import safeAddTrailingSlash from './safeAddTrailingSlash'

/**
 * Returns a properly structure route array given a list of route
 * @param {Array.<String|Object>} routes 
 */
export default function parseRoutes (routes) {
  if (!Array.isArray(routes)) {
    throw new Error('[Router] routes must be an array')
  }
  return routes.map(route => {
    if (typeof route === 'string') {
      return {
        id: route,
        path: safeAddTrailingSlash(route)
      }
    }
    if (!route || !route.id) {
      throw new Error('[Router] routes must either be a string or an object with an id')
    }
    return {
      id: route.id,
      path: safeAddTrailingSlash(route.path || route.id)
    }
  })
}
