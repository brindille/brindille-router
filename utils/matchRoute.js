import { match } from 'path-to-regexp'

/**
 * Will test if a path is matching a route path
 * @param {String} path The path to test
 * @param {RegExp} rule The regexp to test path against
 */
export default function matchRoute(path, rule) {
  const matcher = match(rule)
  return matcher(path)
}
