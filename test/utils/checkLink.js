import test from 'ava'
import jsdom from 'jsdom'

import {
  isSpecialKeypressed,
  isDownloadLink,
  isIgnoredLink,
  isBlank,
  isDifferentOrigin,
  isSameLocation,
  isMailto,
  isLink,
  getLink,
  getUrl,
  checkLink
} from '../../utils/checkLink'

const createElementWithAttributes = (dom, tag = 'a', attributes = {}) => {
  const document = dom.window.document
  const el = document.createElement(tag)
  Object.keys(attributes).forEach(name => {
    el.setAttribute(name, attributes[name])
  })
  return el
}

const mockLink = (options = {}) => {
  const dom = options.dom
  const window = dom.window
  dom.reconfigure({ url: options.location })
  const el = createElementWithAttributes(dom, 'a', { href: options.href })
  return {
    target: el,
    preventDefault: () => {}
  }
}

// For each tests we create a jsdom instance
test.before(t => {
  t.context.dom = new jsdom.JSDOM(`<!DOCTYPE html>`)
})

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
  const dom = t.context.dom

  const e0 = createElementWithAttributes(dom, 'a', {})
  const e1 = createElementWithAttributes(dom, 'a', { download: true })
  const e2 = createElementWithAttributes(dom, 'a', { rel: 'external' })

  t.false(isDownloadLink(e0))
  t.true(isDownloadLink(e1))
  t.true(isDownloadLink(e2))
})

/* ------------------------------------------------
  isIgnoredLink
------------------------------------------------ */
test('isIgnoredLink', t => {
  const dom = t.context.dom

  const e0 = createElementWithAttributes(dom, 'a', {})
  const e1 = createElementWithAttributes(dom, 'a', {
    'data-router-ignore': true
  })
  const e2 = createElementWithAttributes(dom, 'a', { 'data-router-ignore': '' })

  t.false(isIgnoredLink(e0))
  t.true(isIgnoredLink(e1))
  t.true(isIgnoredLink(e2))
})

/* ------------------------------------------------
  isBlank
------------------------------------------------ */
test('isBlank', t => {
  const dom = t.context.dom

  const e0 = createElementWithAttributes(dom, 'a', {})
  const e1 = createElementWithAttributes(dom, 'a', { target: '_blank' })

  t.false(isBlank(e0))
  t.true(isBlank(e1))
})

/* ------------------------------------------------
  isDifferentOrigin
------------------------------------------------ */
test('isDifferentOrigin', t => {
  const dom = t.context.dom
  const window = dom.window

  dom.reconfigure({ url: 'http://foo.bar' })

  const e0 = createElementWithAttributes(dom, 'a', { href: 'http://foo.bar' })
  const e1 = createElementWithAttributes(dom, 'a', { href: 'http://bar.foo' })

  t.false(isDifferentOrigin(e0, window))
  t.true(isDifferentOrigin(e1, window))

  // Throws an error when no window is available of given
  t.throws(() => {
    isDifferentOrigin(e1)
  })
})

/* ------------------------------------------------
  isSameLocation
------------------------------------------------ */
test('isSameLocation', t => {
  const dom = t.context.dom
  const window = dom.window

  dom.reconfigure({ url: 'http://foo.bar/home' })

  const e0 = createElementWithAttributes(dom, 'a', { href: '/home' })
  const e1 = createElementWithAttributes(dom, 'a', { href: '/about' })

  t.true(isSameLocation(e0, window))
  t.false(isSameLocation(e1, window))

  dom.reconfigure({ url: 'http://foo.bar/about?t=a' })

  const e2 = createElementWithAttributes(dom, 'a', { href: '/about' })
  const e3 = createElementWithAttributes(dom, 'a', { href: '/about?t=a' })
  const e4 = createElementWithAttributes(dom, 'a', { href: '/home?t=a' })

  t.false(isSameLocation(e2, window))
  t.true(isSameLocation(e3, window))
  t.false(isSameLocation(e4, window))

  // Throws an error when no window is available of given
  t.throws(() => {
    isSameLocation(e0)
  })
})

/* ------------------------------------------------
  isMailto
------------------------------------------------ */
test('isMailto', t => {
  const dom = t.context.dom

  const e0 = createElementWithAttributes(dom, 'a', {
    href: 'mailto:foo@bar.com'
  })
  const e1 = createElementWithAttributes(dom, 'a', { href: 'http://bar.foo' })

  t.true(isMailto(e0))
  t.false(isMailto(e1))
})

/* ------------------------------------------------
  isLink
------------------------------------------------ */
test('isLink', t => {
  const dom = t.context.dom

  const e0 = createElementWithAttributes(dom, 'a')
  const e1 = createElementWithAttributes(dom, 'A')
  const e2 = createElementWithAttributes(dom, 'div')
  const e3 = createElementWithAttributes(dom, 'p')

  t.true(isLink(e0))
  t.true(isLink(e1))
  t.false(isLink(e2))
  t.false(isLink(e3))
})

/* ------------------------------------------------
  getLink
------------------------------------------------ */
test('getLink', t => {
  const dom = t.context.dom

  const e0 = createElementWithAttributes(dom, 'a')
  e0.innerHTML = '<span><span></span></span>'
  const child0 = e0.childNodes[0].childNodes[0]

  const e1 = createElementWithAttributes(dom, 'div')
  e1.innerHTML = '<span><span></span></span>'
  const child1 = e1.childNodes[0].childNodes[0]

  t.is(e0, getLink(child0))
  t.is(null, getLink(child1))
})

/* ------------------------------------------------
  getUrl
------------------------------------------------ */
test('getUrl', t => {
  const dom = t.context.dom

  const e0 = createElementWithAttributes(dom, 'a', {
    href: 'http://bar.foo/home'
  })
  const e1 = createElementWithAttributes(dom, 'a', {
    href: 'http://bar.foo/about?t=1'
  })
  const e2 = createElementWithAttributes(dom, 'a', {
    href: 'http://bar.foo/post?t=1#toto'
  })

  t.is('/home', getUrl(e0))
  t.is('/about?t=1', getUrl(e1))
  t.is('/post?t=1#toto', getUrl(e2))
})

/* ------------------------------------------------
  checkLink
------------------------------------------------ */
test('checkLink with working link', t => {
  const event = mockLink({
    dom: t.context.dom,
    location: 'http://foo.bar/home',
    href: '/about'
  })

  t.is('/about', checkLink(event, t.context.dom.window))

  // Throws an error when no window is available of given
  t.throws(() => {
    checkLink(event)
  })
})

test('checkLink with same location', t => {
  const event = mockLink({
    dom: t.context.dom,
    location: 'http://foo.bar/home',
    href: '/home'
  })

  t.false(checkLink(event, t.context.dom.window))
})

test('checkLink test fail', t => {
  const event = mockLink({
    dom: t.context.dom,
    location: 'http://foo.bar/home',
    href: 'http://bar.foo/home'
  })

  t.false(checkLink(event, t.context.dom.window))
})
