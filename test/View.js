import test from 'ava'
import View from '../View'
import createRouter from '../router'
import jsdom from 'jsdom'
import Component from 'brindille-component'
import Section from './fixtures/Section'
import sinon from 'sinon'

function eventFire (el, type, document){
  if (el.fireEvent) {
    el.fireEvent('on' + type)
  } else {
    var e = document.createEvent('Events')
    e.initEvent(type, true, false)
    el.dispatchEvent(e)
  }
}


/* ------------------------------------
  CONSTANTS
------------------------------------ */
const ROUTES = ['home', 'about', { id: 'post', path: 'post/:id'}]
const URL = 'http://foo.bar'
const PAGES = {
  'home': `<div data-component="Section">home</div>`,
  'about': `<div data-component="Section">about</div>`,
  'post': `<div data-component="Section">post</div>`
}

/* ------------------------------------
  USEFUL METHODS
------------------------------------ */
const getContent = route => Promise.resolve(PAGES[route.id])

const createBody = (content, dom) => {
  const div = dom.window.document.createElement('div')
  div.innerHTML = `<div data-component="View">${ content }</div>` 
  return div
}

const init = (dom, routes = ROUTES, firstPageId = 'home', options = {}, useWindow = true, useDefinitionFunction = 0) => {
  dom.reconfigure({ url: URL + '/' + firstPageId })

  let definitionsObject = { Section, View }
  let definitionsFunction = name => definitionsObject[name]
  
  let definitions = null
  if (useDefinitionFunction === 0) {
    definitions = definitionsObject
  } else if (useDefinitionFunction === 1) {
    definitions = definitionsFunction
  }

  const body = createBody(PAGES[firstPageId], dom)
  const root = new Component(body, definitions)
  const view = root.findInstance('View')
  const router = createRouter(root, Object.assign({ routes, getContent, view }, options), useWindow ? dom.window : undefined)
  dom.window.document.body.appendChild(body)
  view.window = dom.window
  return { body, root, router, view }
}

const navigate = (pageId, dom) => {
  dom.reconfigure({ url: URL + '/' + pageId })
  const e = new dom.window.Event('popstate', { bubbles: true })
  dom.window.document.dispatchEvent(e)
}

const createLink = (pageId, dom, tag = 'a') => {
  const target = dom.window.document.createElement(tag)
  target.setAttribute('href', '/' + pageId)
  return target
}

/* ------------------------------------
  HOOKS FOR EACH TESTS
------------------------------------ */
test.beforeEach(t => {
  t.context.dom = new jsdom.JSDOM(`<!DOCTYPE html>`)
})

test.afterEach(t => {
	t.context.dom.window.close()
})

/* ------------------------------------
  TESTS
------------------------------------ */
test('Simple Router instantiation', t => {
  const { router, view } = init(t.context.dom, ROUTES, 'home')
  router.start()
  t.truthy(view)
  t.is(router.currentRoute.id, 'home')
  t.is(router.currentRoute.path, '/home')
  t.is(router.previousRoute.id, undefined)
  t.is(router.previousRoute.path, undefined)
  t.deepEqual(router.currentRoute.params, {})
})

test('Simple Router instantiation with first route different than default route', t => {
  const { router, view } = init(t.context.dom, ROUTES, 'about')
  router.start()
  t.truthy(view)
  t.is(router.currentRoute.id, 'about')
  t.is(router.currentRoute.path, '/about')
  t.is(router.previousRoute.id, undefined)
  t.is(router.previousRoute.path, undefined)
  t.deepEqual(router.currentRoute.params, {})
})

test.cb('Changing route', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  const listener = e => {
    if (e.isFirstRoute) {
      t.is(router.currentRoute.id, e.id)
      t.is(router.currentRoute.path, e.path)
      t.is(router.currentRoute.id, 'home')
      t.is(router.currentRoute.path, '/home')
      navigate('about', t.context.dom)
    } else {
      t.is(router.currentRoute.id, e.id)
      t.is(router.currentRoute.path, e.path)
      t.is(router.currentRoute.id, 'about')
      t.is(router.currentRoute.path, '/about')
      t.is(router.previousRoute.id, 'home')
      t.is(router.previousRoute.path, '/home')
      router.off('update', listener)
      t.end()
    }
  }
  router.on('update', listener)
})

test('Route with params', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  router.goTo('/post/12')
  t.is(router.currentRoute.id, 'post')
  t.deepEqual(router.currentRoute.params, { id: '12' })
})

test.cb('Navigating to same Route than before', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  const listener = e => {
    router.off('update', listener)
    navigate('home', t.context.dom)
    t.is(router.currentRoute.id, 'home')
    t.end()
  }
  router.on('update', listener)
})

test.cb('Subscribing and Unsubscribing', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  const empty = () => {}
  const listener = () => {
    router.off('update', listener)
    t.is(router.nbListeners, 1)
    router.off('update', listener)
    t.is(router.nbListeners, 1)
    router.off('update', empty)
    t.is(router.nbListeners, 0)
    t.end()
  }
  t.is(router.nbListeners, 0)
  router.on('update', listener)
  router.on('update', empty)
  t.is(router.nbListeners, 2)
})

test.cb('No not found handler defaults to first route', t => {
  const { router } = init(t.context.dom, ROUTES, 'foo')
  router.start()
  const listener = () => {
    router.off('update', listener)
    t.is(router.currentRoute.id, 'home')
    t.end()
  }
  router.on('update', listener)
})

test.cb('Not Found handler on first route', t => {
  const { router } = init(t.context.dom, ROUTES, 'foo', {
    notFoundHandler: () => {
      t.end()
    }
  })
  router.start()
})

test.cb('Not Found handler on second route', t => {
  const { router } = init(t.context.dom, ROUTES, 'home', {
    notFoundHandler: () => {
      t.is(router.currentRoute.id, 'home')
      router.off('update', listener)
      t.end()
    }
  })
  router.start()
  const listener = () => {
    navigate('foo', t.context.dom)
  }
  router.on('update', listener)
})

test('Disposing', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  router.dispose()
  t.is(router.nbListeners, 0)
})

test('Goto', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  router.goTo('/about')
  t.is(router.currentRoute.id, 'about')
})

test('GotoId', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  router.goToId('about')
  t.is(router.currentRoute.id, 'about')
})

test('GotoId not exist', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  router.goToId('toto')
  t.is(router.currentRoute.id, 'home')
})

test('GotoId params', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  router.goToId('post', { id: 'foo' })
  t.is(router.currentRoute.id, 'post')
})

test('Click event interception on a link tag should trigger routing', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  const link = createLink('about', t.context.dom)
  t.context.dom.window.document.body.appendChild(link)
  eventFire(link, 'click', t.context.dom.window.document)
  t.is(router.currentRoute.id, 'about')
})

test('Click event interception a div tag should do nothing', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  const link = createLink('about', t.context.dom, 'div')
  t.context.dom.window.document.body.appendChild(link)
  eventFire(link, 'click', t.context.dom.window.document)
  t.is(router.currentRoute.id, 'home')
})

test.cb('Verbose mode', t => {
  let count = 0
  const stub = sinon.stub(console, 'log').callsFake(() => {
    count++
    if (count >= 5) {
      stub.restore()
      t.end()
    }
  })
  const { router } = init(t.context.dom, ROUTES, 'home', { verbose: true })
  router.start()
})

test('No window in test mode throws an error', t => {
  const message = 'window is not defined'
  const error1 = t.throws(() => {
    init(t.context.dom, ROUTES, 'home', {}, false)
  })
  t.is(error1.message, message)
})

test.cb('proper isTransitionning values', t => {
  const { router } = init(t.context.dom, ROUTES, 'home')
  router.start()
  const listener = e => {
    if (e.isFirstRoute) {
      t.false(router.isTransitionning)
      navigate('about', t.context.dom)
      t.true(router.isTransitionning)
    } else {
      router.off('update', listener)
      t.false(router.isTransitionning)
      t.end()
    }
  }
  router.on('update', listener)
})

test('No routes in params defauts to one route (home)', t => {
  const { router } = init(t.context.dom, null)
  t.is(router.routes.length, 1)
  t.is(router.routes[0].id, 'home')
})

test('No options at all will be punished!', t => {
  const message = 'First param of createRouter needs to be an instance of brindille component'
  const error1 = t.throws(() => {
    createRouter(undefined, undefined, t.context.dom.window)
  })
  t.is(error1.message, message)
})

test.cb('No getContent in params defaults to simple promise that returns route.id', t => {
  const { router, view } = init(t.context.dom, ROUTES, 'home', { getContent: undefined })
  router.start()
  const listener = e => {
    if (e.isFirstRoute) {
      router.goTo('/about')
    } else {
      router.off('update', listener)
      t.is(view.$el.innerHTML, '<div>about</div>')
      t.end()
    }
  }
  router.on('update', listener)
})

test('View with no window', t => {
  const { view } = init(t.context.dom, ROUTES, 'home')
  const message = 'window is not defined'
  view.window = null
  const error1 = t.throws(() => {
    view.createSection(PAGES['about'])
  })
  t.is(error1.message, message)
})

test('No view', t => {
  const dom = t.context.dom
  
  dom.reconfigure({ url: URL + '/home' })
  const body = dom.window.document.createElement('div')
  const root = new Component(body, { Section, View })
  const error = t.throws(() => {
    createRouter(root, { routes: ROUTES, getContent }, dom.window)
  })
  t.is(error.message, 'There is no View instance in your brindille App')
})

test('Ctor with object definitions', t => {
  const { view } = init(t.context.dom, ROUTES, 'home', {}, true, 0)
  t.is(Section, view.getCtor('Section'))
  t.not(View, view.getCtor('Section'))
  t.falsy(view.getCtor('foo'))
})

test('Ctor with function definitions', t => {
  const { view } = init(t.context.dom, ROUTES, 'home', {}, true, 1)
  t.is(Section, view.getCtor('Section'))
  t.not(View, view.getCtor('Section'))
  t.falsy(view.getCtor('foo'))
})

test('Ctor without definitions', t => {
  const { view } = init(t.context.dom, ROUTES, 'home', {}, true, 0)
  view.definitions = undefined
  t.falsy(view.getCtor('Section'))
  t.falsy(view.getCtor('Section'))
  t.falsy(view.getCtor('foo'))
})

test('baseUrl', t => {
  const { router } = init(t.context.dom, ROUTES, 'home', { baseUrl: 'foo' }, true, 0)
  t.is(router.baseUrl, 'foo')
})