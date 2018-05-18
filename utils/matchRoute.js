import pathToRegexp from 'path-to-regexp'

/**
 * Will test if a path is matching a route path
 * @param {String} path The path to test
 * @param {RegExp} rule The regexp to test path against
 */
export default function matchRoute (path, rule) {
  let keys = []
  const re = pathToRegexp(rule, keys, {})
  const m = re.exec(path)
  if (!m) return false

  const params = {}
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    const param = m[i + 1]
    if (!param) continue
    params[key.name] = param
    if (key.repeat) params[key.name] = params[key.name].split(key.delimiter)
  }
  return params
}