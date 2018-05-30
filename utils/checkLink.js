import safeAddTrailingSlash from './safeAddTrailingSlash'

export const isSpecialKeypressed = e => e.which > 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
export const isDownloadLink = el => el.hasAttribute('download') || el.getAttribute('rel') === 'external'
export const isBlank = el => el.target && el.target === 'blank'
export const isDifferentOrigin = el => el.protocol !== window.location.protocol || el.hostname !== window.location.hostname
export const isSameLocation = el => el.pathname === window.location.pathname && el.search === window.location.search
export const isMailto = link => link.indexOf('mailto:') > -1
export const isLink = el => el && el.nodeName.toUpperCase() === 'A'
export const getLink = el => isLink(el) ? el : (el.parentNode ? getLink(el.parentNode) : null)
export const getUrl = source => safeAddTrailingSlash(source.pathname + source.search + (source.hash || ''))

export function checkLink (e) {
  // For each click we check if target is link
  let el = getLink(e.target)
  
  // If not link or special cases we ignore the link (self explanatory checks)
  if (
    !el ||
    e.defaultPrevented ||
    isSpecialKeypressed(e) ||
    isDownloadLink(el) ||
    isBlank(el) ||
    isDifferentOrigin(el) ||
    isMailto(el.href)
  ) {
    return false
  }

  // At this point we override browser default behaviour for clicked link
  e.preventDefault()

  // We still do nothing if link location is same as current location
  if (isSameLocation(el)) {
    return false
  }

  // Return formatted path for clicked link (in the form of "/home")
  return getUrl(el)
}
