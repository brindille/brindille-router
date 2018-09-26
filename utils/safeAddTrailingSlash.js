/**
 * Adds a slash at the beggining of a string if it does not exists yet
 * @param {String} str the string to which we want to add a slash to in the beginning
 */
export default function safeAddTrailingSlash (str = '') {
  if (typeof str !== 'string') {
    throw new Error('str should be a string and is a ' + typeof str)
  }
  return '/' + str.replace(/^\//, '')
}
