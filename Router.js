import equal from 'deep-equal'
import dush from 'dush'
import getRouteByPath from './utils/getRouteByPath'
import parseRoutes from './utils/parseRoutes'
import { checkLink, getUrl } from './utils/checkLink'

/**
 * Router class
 */
export default class Router {
  constructor (options = {}, win = window) {
    if (!options.view) {
      throw new Error('You need to pass a view component in the Router options')
    }

    this.loadRoute = this.loadRoute.bind(this)
    this.routeCompleted = this.routeCompleted.bind(this)
    this.onLinkClick = this.onLinkClick.bind(this)
    this.onStateUpdate = this.onStateUpdate.bind(this)

    this.isFirstRoute = true
    this.isTransitionning = false
    this.emitter = dush()

    this.view = options.view
    this.window = win
    this.baseUrl = options.baseUrl || ''
    this.getContent = options.getContent || (route => Promise.resolve(route.id))
    this.isVerbose = options.verbose && options.verbose === true
    this.notFoundHandler = options.notFoundHandler && typeof options.notFoundHandler === 'function' ? options.notFoundHandler : false
    this.routes = parseRoutes(Array.isArray(options.routes) && options.routes.length ? options.routes : ['home'])

    this.log('baseUrl = "' + this.baseUrl + '"')

    this.defaultRoute = this.routes[0]
    this.routes.forEach(route => {
      this.log('registering route:', route.path)
    })

    this.window.addEventListener('popstate', this.onStateUpdate)
    this.window.addEventListener('click', this.onLinkClick)

    this.loadRoute(getUrl(this.window.location))
  }

  onLinkClick (e) {
    let link = checkLink(e, this.window)
    if (link) {
      this.goTo(link)
    }
  }

  goTo (url) {
    this.window.history.pushState(null, null, url)
    this.onStateUpdate()
  }

  log (...messages) {
    if (this.isVerbose) {
      console.log('[Router]', ...messages)
    }
  }

  dispose () {
    this.emitter.off('update')
    this.window.removeEventListener('popstate', this.onStateUpdate)
  }

  onStateUpdate () {
    this.loadRoute(getUrl(this.window.location))
  }

  /* ========================================================
    Main Controller
  ======================================================== */
  loadRoute (path) {
    let currentRoute = getRouteByPath(path, this.routes)
    if (!currentRoute) {
      if (this.notFoundHandler) {
        return this.notFoundHandler(path)
      } else {
        currentRoute = this.routes[0]
      }
    }

    // Stop handling route when trying to reach the current route path
    if (equal(currentRoute, this.currentRoute)) return

    // When we start handling the route we tell the app we are busy
    this.isTransitionning = true

    // Shift current and previous routes
    this.previousRoute = this.currentRoute
    this.currentRoute = currentRoute

    this.log('route:', this.currentPageId, this.isFirstRoute)

    // If current route is first route, the dom is already present, we just need the view to launch transition in of current view
    if (this.isFirstRoute) {
      this.isFirstRoute = false
      this.view.showFirstPage().then(() => {
        this.routeCompleted(true)
      })
    } else {  
      this.getContent(currentRoute, path, this.baseUrl)
        .then(this.view.showPage)
        .then(this.routeCompleted)
    }
  }

  routeCompleted (wasFirstRoute = false) {
    // Everyting is over, app is ready to do stuff again
    this.isTransitionning = false
    this.emitter.emit('update', {
      id: this.currentPageId,
      path: this.currentPath,
      isFirstRoute: wasFirstRoute
    })
  }

  get currentPath () { return this.currentRoute.path }
  get currentPageId () { return this.currentRoute.id }
  get previousPath () { return this.previousRoute ? this.previousRoute.path : undefined }
  get previousPageId () { return this.previousRoute ? this.previousRoute.id : undefined }
  get params () { return this.currentRoute.params }

  on (...params) { this.emitter.on(...params) }
  off (...params) { this.emitter.off(...params) }
}
