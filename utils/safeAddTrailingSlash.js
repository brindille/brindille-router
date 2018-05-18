export default function safeAddTrailingSlash (str = '') {
  if (typeof str !== 'string') {
    throw new Error('str should be a string and is a ' + typeof str)
  }
  return '/' + str.replace(/^\//, '')
}
