import dush from 'dush'
import { getRouteByPath, getRouteById } from './utils/getRoute'
import parseRoutes from './utils/parseRoutes'
import { checkLink, getUrl } from './utils/checkLink'

/**
 *
 * @param {BrindilleComponent} app An instance of the main brindille component your router will be applied to (usually the body / root component)
 * @param {Object} options
 * @param {String[]|Object[]} options.routes An array of routes (ex: ["home", "contacts"])
 * @param {Function} options.getContent the function that gets your page content, must return a promise that resolves the content of the new page
 * @param {Function} options.beforeCompile this function is executed on the dom of a new section before any component instanciation, advanced users only
 * @param {Boolean} [options.verbose] If true will log a bunch of stuff for debugging purposes
 * @param {Boolean} [options.notFoundHandler] A method that will be called if requested route does not exists
 * @param {String} [options.baseUrl] Signals if root of the project is hosted in a subfolder, defaults to an empty string
 * @param {String} [options.baseContent] a string that will be passed to your getContent method, can be useful for prepending a string to urls
 */
export default function createRouter(app, options = {}, win = window) {
  if (!app || !app._componentInstances) {
    throw new Error(
      'First param of createRouter needs to be an instance of brindille component'
    )
  }

  const view = app.findInstance('View')

  if (!view) {
    throw new Error('There is no View instance in your brindille App')
  }

  let isFirstRoute = true
  let isTransitionning = false

  const emitter = dush()

  const baseUrl = options.baseUrl || ''
  const baseContent = options.baseContent || ''
  const getContent =
    options.getContent || (({ route }) => Promise.resolve(route.id))
  const beforeCompile = options.beforeCompile || (dom => Promise.resolve(dom))
  const isVerbose = options.verbose && options.verbose === true
  const notFoundHandler =
    options.notFoundHandler && typeof options.notFoundHandler === 'function'
      ? options.notFoundHandler
      : false
  const routes = parseRoutes(
    Array.isArray(options.routes) && options.routes.length
      ? options.routes
      : ['home']
  )
  const defaultRoute = routes[0]

  let currentRoute = null
  let previousRoute = null

  log('baseUrl = "' + baseUrl + '"')
  log('baseContent = "' + baseContent + '"')
  routes.forEach(route => {
    log('registering route:', route.path)
  })

  function onClick(e) {
    let link = checkLink(e, win)
    if (link) {
      goTo(link)
    }
  }

  function log(...messages) {
    if (isVerbose) {
      console.log('[Router]', ...messages)
    }
  }

  /**
   * Launches the routing
   */
  function start() {
    log('start')
    win.addEventListener('popstate', onStateUpdate)
    win.addEventListener('click', onClick)

    onStateUpdate()
  }

  /**
   * Stops the routing
   */
  function stop() {
    log('stop')
    win.removeEventListener('popstate', onStateUpdate)
    win.removeEventListener('click', onClick)
  }

  /**
   * Navigates to a given internal URL
   * @param {String} url URL to navigate to
   */
  function goTo(url) {
    win.history.pushState(null, null, url)
    onStateUpdate()
  }

  function goToId(id, params) {
    let route = getRouteById(id, routes)
    if (route) {
      let path = route.path
      if (params) {
        Object.keys(params).forEach(key => {
          path = path.replace(':' + key, params[key])
        })
      }
      goTo(path)
    }
  }

  /**
   * Destroys the router and cancels any listeners still active
   */
  function dispose() {
    emitter.off('update')
    stop()
  }

  function onStateUpdate() {
    loadRoute(getUrl(win.location))
  }

  function loadRoute(path) {
    let newRoute = getRouteByPath(path, routes, baseUrl)
    if (!newRoute) {
      if (notFoundHandler) {
        return notFoundHandler(path)
      } else {
        newRoute = defaultRoute
      }
    }

    // When we start handling the route we tell the app we are busy
    isTransitionning = true

    // Shift current and previous routes
    previousRoute = currentRoute
    currentRoute = Object.assign({ isFirstRoute }, newRoute)

    emitter.emit('start', currentRoute)

    log(
      'route:',
      currentRoute.id,
      (isFirstRoute ? '(first) ' : ' ') + JSON.stringify(currentRoute.params)
    )

    // If current route is first route, the dom is already present, we just need the view to launch transition in of current view
    if (isFirstRoute) {
      isFirstRoute = false
      view.showFirstPage().then(routeCompleted)
    } else {
      getContent({ route: currentRoute, base: baseContent, path })
        .then(content => {
          const p = view.showPage(content, beforeCompile)
          emitter.emit('loaded', currentRoute)
          return p
        })
        .then(routeCompleted)
    }
  }

  function routeCompleted() {
    isTransitionning = false
    emitter.emit('complete', currentRoute)
    emitter.emit('update', currentRoute)
  }

  return {
    start,
    stop,
    goTo,
    goToId,
    dispose,

    get routes() {
      return routes.slice(0)
    },
    get nbListeners() {
      return emitter._allEvents.update ? emitter._allEvents.update.length : 0
    },

    get baseUrl() {
      return baseUrl
    },
    get baseContent() {
      return baseContent
    },

    get currentRoute() {
      return Object.assign({}, currentRoute)
    },
    get previousRoute() {
      return Object.assign({}, previousRoute)
    },

    get isTransitionning() {
      return isTransitionning
    },

    on: (...opt) => emitter.on(...opt),
    off: (...opt) => emitter.off(...opt)
  }
}
