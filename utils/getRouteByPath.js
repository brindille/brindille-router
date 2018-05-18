import matchRoute from './matchRoute'
import safeAddTrailingSlash from './safeAddTrailingSlash'

/**
 * Get a route from a path for a giver list or existing routes, returns first entry of routes if no match is found
 * @param {String} path path to be tested against routes
 * @param {Array} routes list of routes that path will be tested against
 */
export default function getRouteByPath (path, routes = []) {
  path = safeAddTrailingSlash(path)
  if (!Array.isArray(routes)) {
    throw new Error('Routes param needs to be an array')
  }
  if (!routes.length) {
    throw new Error('You need at lease one entry in routes param')
  }
  const route = routes.find(r => {
    const params = matchRoute(path, r.path)
    if (params) {
      r.params = params
      return true
    }
    return false
  })
  return route || routes[0]
}
