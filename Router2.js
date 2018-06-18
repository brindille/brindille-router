import equal from 'deep-equal'
import dush from 'dush'
import getRouteByPath from './utils/getRouteByPath'
import parseRoutes from './utils/parseRoutes'
import { checkLink, getUrl } from './utils/checkLink'

export default function createRouter (app, options = {}, win = window) {
  if (!app || !app._componentInstances) {
    throw new Error('First param of createRouter needs to be an instance of brindille component')
  }
  
  const view = app.findInstance('View')

  if (!view) {
    throw new Error('There is no View instance in your brindille App')
  }

  let isFirstRoute = true
  let isTransitionning = false
  
  const emitter = dush()

  const baseUrl = options.baseUrl || ''
  const getContent = options.getContent || (route => Promise.resolve(route.id))
  const isVerbose = options.verbose && options.verbose === true
  const notFoundHandler = options.notFoundHandler && typeof options.notFoundHandler === 'function' ? options.notFoundHandler : false
  const routes = parseRoutes(Array.isArray(options.routes) && options.routes.length ? options.routes : ['home'])
  const defaultRoute = routes[0]

  let currentRoute = null
  let previousRoute = null

  win.addEventListener('popstate', onStateUpdate)
  win.addEventListener('click', onClick)

  log('baseUrl = "' + baseUrl + '"')
  routes.forEach(route => {
    log('registering route:', route.path)
  })

  onStateUpdate()

  function onClick (e) {
    let link = checkLink(e, win)
    if (link) {
      goTo(link)
    }
  }

  function log (...messages) {
    if (isVerbose) {
      console.log('[Router]', ...messages)
    }
  }

  function goTo (url) {
    win.history.pushState(null, null, url)
    onStateUpdate()
  }

  function dispose () {
    emitter.off('update')
    win.removeEventListener('popstate', onStateUpdate)
    win.removeEventListener('click', onClick)
  }

  function onStateUpdate () {
    loadRoute(getUrl(win.location))
  }

  function loadRoute (path) {
    let newRoute = getRouteByPath(path, routes)
    if (!newRoute) {
      if (notFoundHandler) {
        return notFoundHandler(path)
      } else {
        newRoute = defaultRoute
      }
    }
    
    // Stop handling route when trying to reach the current route path
    if (equal(newRoute, currentRoute)) return

    // When we start handling the route we tell the app we are busy
    isTransitionning = true

    // Shift current and previous routes
    previousRoute = currentRoute
    currentRoute = newRoute

    log('route:', currentRoute.id, isFirstRoute ? '(first)' : '')

    // If current route is first route, the dom is already present, we just need the view to launch transition in of current view
    if (isFirstRoute) {
      isFirstRoute = false
      view.showFirstPage()
        .then(routeCompleted)
    } else {  
      getContent(currentRoute, path, baseUrl)
        .then(view.showPage)
        .then(routeCompleted)
    }
  }

  function routeCompleted (wasFirstRoute = false) {
    isTransitionning = false
    emitter.emit('update', Object.assign({ isFirstRoute: wasFirstRoute }, currentRoute))
  }

  return {
    dispose,
    goTo,

    get routes () { return routes.slice(0) },
    get nbListeners () { return emitter._allEvents.update ? emitter._allEvents.update.length : 0 },
    
    get currentRoute () { return Object.assign({}, currentRoute) },
    get previousRoute () { return Object.assign({}, previousRoute) },

    get isTransitionning () { return isTransitionning },

    on: (...opt) => emitter.on(...opt),
    off: (...opt) => emitter.off(...opt)
  }
}