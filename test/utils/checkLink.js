import test from 'ava'

import {
  isSpecialKeypressed,
  isDownloadLink,
  isBlank,
  isDifferentOrigin,
  isSameLocation,
  isMailto,
  isLink,
  getLink,
  getUrl,
  checkLink
} from '../../utils/checkLink'

const createLinkWithAttributes = (attributes = {}) => {
  const a = document.createElement('a')
  Object.keys(attributes).forEach(name => {
    a.setAttribute(name, attributes[name])
  })
  return a
}

/* ------------------------------------------------
  isSpecialKeypressed
------------------------------------------------ */
test('isSpecialKeypressed', t => {
  t.falsy(isSpecialKeypressed({}))
  t.true(isSpecialKeypressed({ metaKey: true }))
  t.falsy(isSpecialKeypressed({ metaKey: false }))
  t.true(isSpecialKeypressed({ ctrlKey: true }))
  t.falsy(isSpecialKeypressed({ ctrlKey: false }))
  t.true(isSpecialKeypressed({ altKey: true }))
  t.falsy(isSpecialKeypressed({ altKey: false }))
  t.true(isSpecialKeypressed({ shiftKey: true }))
  t.falsy(isSpecialKeypressed({ shiftKey: false }))
  t.true(isSpecialKeypressed({ which: 2 }))
  t.falsy(isSpecialKeypressed({ which: 1 }))
})

/* ------------------------------------------------
  isDownloadLink
------------------------------------------------ */
test('isDownloadLink', t => {
  const e0 = createLinkWithAttributes({})
  const e1 = createLinkWithAttributes({ 'download': true })
  const e2 = createLinkWithAttributes({ 'rel': 'external' })

  t.false(isDownloadLink(e0))
  t.true(isDownloadLink(e1))
  t.true(isDownloadLink(e2))
})

/* ------------------------------------------------
  isBlank
------------------------------------------------ */
test('isBlank', t => {
  const e0 = createLinkWithAttributes({})
  const e1 = createLinkWithAttributes({ 'target': 'blank' })

  t.false(isDownloadLink(e0))
  t.true(isDownloadLink(e1))
})

/* ------------------------------------------------
  isDifferentOrigin
------------------------------------------------ */
test('isDifferentOrigin', t => {
  console.log('window.location.protocol', window.location.protocol)
  console.log('window.location.hostname', window.location.hostname)
  const e0 = createLinkWithAttributes({ 'href': 'http://foo.bar' })

  t.truthy(isDifferentOrigin(e0))
})