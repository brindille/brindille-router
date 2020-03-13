/**
 * Calls a function with callback param if it exists
 * or calls callback directly if the function does not exists
 *
 * @param {Obkect} object context for method to call
 * @param {String} methodName name of the method to call on object
 * @param {Function} callback the function to be called at the end of method
 */
export default function safeCallbackedCall(object, methodName, callback) {
  if (!callback || typeof callback !== 'function') {
    throw new Error('The callback param should be a function')
  }
  if (
    object &&
    object[methodName] &&
    typeof object[methodName] === 'function'
  ) {
    object[methodName](callback)
  } else {
    callback()
  }
}
