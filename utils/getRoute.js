import matchRoute from './matchRoute'
import safeAddTrailingSlash from './safeAddTrailingSlash'

/**
 * Get a route from a path for a given list or existing routes, returns first entry of routes if no match is found
 * @param {String} path path to be tested against routes
 * @param {Array} routes list of routes that path will be tested against
 */
export function getRouteByPath (path, routes = [], baseUrl = '') {
  if (baseUrl !== '') {
    path = path.replace(baseUrl, '').replace(/\/\//g, '/')
  }
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
  if (route) {
    return Object.assign({}, route)
  }
  return false
}


/**
 * Get a route from a path for a given list or existing routes, returns first entry of routes if no match is found
 * @param {String} path path to be tested against routes
 * @param {Array} routes list of routes that path will be tested against
 */
export function getRouteById (id, routes = []) {
  if (!Array.isArray(routes)) {
    throw new Error('Routes param needs to be an array')
  }
  if (!routes.length) {
    throw new Error('You need at lease one entry in routes param')
  }
  const route = routes.find(r => {
    return id === r.id
  })
  if (route) {
    return Object.assign({}, route)
  }
  return false
}
