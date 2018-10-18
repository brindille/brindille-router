import safeAddTrailingSlash from './safeAddTrailingSlash'

export const isSpecialKeypressed = e => e.which > 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
export const isIgnoredLink = el => el.hasAttribute('data-router-ignore')
export const isDownloadLink = el => el.hasAttribute('download') || el.getAttribute('rel') === 'external'
export const isBlank = el => el.target !== undefined && el.target === 'blank'
export const isDifferentOrigin = (el, win = window) => el.protocol !== win.location.protocol || el.hostname !== win.location.hostname
export const isSameLocation = (el, win = window) => el.pathname === win.location.pathname && el.search === win.location.search
export const isMailto = el => el.href !== undefined && el.href.indexOf('mailto:') > -1
export const isLink = el => el && el.nodeName.toUpperCase() === 'A'
export const getLink = el => isLink(el) ? el : (el.parentNode ? getLink(el.parentNode) : null)
export const getUrl = source => safeAddTrailingSlash(source.pathname + source.search + (source.hash || ''))

/**
 * Check if a clicked link is eligible for routing. If it is it will return the link url. If it isn't it will return false
 * @param {Event} e the click event we want to test
 * @param {Window} win the window context to use for the test, you probably don't want to use this param
 */
export function checkLink (e, win = window) {
  // For each click we check if target is link
  let el = getLink(e.target)
  
  // If not link or special cases we ignore the link (self explanatory checks)
  if (
    !el ||
    e.defaultPrevented ||
    isSpecialKeypressed(e) ||
    isDownloadLink(el) ||
    isIgnoredLink(el) ||
    isBlank(el) ||
    isDifferentOrigin(el, win) ||
    isMailto(el)
  ) {
    return false
  }

  // At this point we override browser default behaviour for clicked link
  e.preventDefault()

  // We still do nothing if link location is same as current location
  if (isSameLocation(el, win)) {
    return false
  }

  // Return formatted path for clicked link (in the form of "/home")
  return getUrl(el)
}
