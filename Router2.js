// import page from 'page'
import getRouteByPath from './utils/getRouteByPath'
import parseRoutes from './utils/parseRoutes'
import { checkLink, getLink } from './utils/checkLink'

/**
 * Router class
 */
export default class Router {
  constructor (options = {}) {
    this.loadRoute = this.loadRoute.bind(this)
    this.notFound = this.notFound.bind(this)
    this.routeCompleted = this.routeCompleted.bind(this)
    this.onLinkClick = this.onLinkClick.bind(this)
    this.onStateUpdate = this.onStateUpdate.bind(this)

    this.isFirstRoute = true
    this.isReady = true

    this.baseUrl = options.baseUrl || ''
    this.getContent = options.getContent || (path => Promise.resolve(path))
    this.isVerbose = options.verbose && options.verbose === true

    this.log('baseUrl = "' + this.baseUrl + '"')

    this.view = options.view
    this.routes = parseRoutes(options.routes || [])
    this.defaultRoute = this.routes[0]
    this.subscribers = []

    this.routes.forEach(route => {
      this.log('registering route:', route.path)
    })

    window.addEventListener('popstate', this.onStateUpdate)
    window.addEventListener('click', this.onLinkClick)

    this.loadRoute(getLink(window.location))
  }

  onLinkClick (e) {
    let link = checkLink(e)
    if (link) {
      this.goTo(link)
    }
  }

  goTo (url) {
    window.history.pushState(null, null, url)
    this.onStateUpdate()
  }

  log (...messages) {
    if (this.isVerbose) {
      console.log('[Router]', ...messages)
    }
  }

  dispose () {
    this.subscribers = []
    window.removeEventListener('popstate', this.onStateUpdate)
  }

  onStateUpdate () {
    const url = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.search
    const state = window.history.state
    this.loadRoute(getLink(window.location))
  }

  /* ========================================================
    PUB/SUB API
  ======================================================== */
  subscribe (subscriber) {
    this.subscribers.push(subscriber)
  }

  unsubscribe (subscriber) {
    for (let i = 0, l = this.subscribers.length; i < l; i++) {
      if (this.subscribers[i] === subscriber) {
        this.subscribers.splice(i, 1)
        break
      }
    }
  }

  /* ========================================================
    Not found / Default route
  ======================================================== */
  notFound (context) {
    this.log('notFound', context.path)
    // page.redirect('/' + this.defaultRoute.path)
  }

  /* ========================================================
    API
  ======================================================== */
  redirect (url) {
    // page(url)
  }

  fullRedirection (url) {
    let path = '/' + url
    window.location.href = 'http://' + window.location.hostname + this.baseUrl + path
  }

  /* ========== ==============================================
    Main Controller
  ======================================================== */
  loadRoute (path) {
    let currentRoute = getRouteByPath(path, this.routes)

    // Stop handling route when trying to reach the current route path
    if (currentRoute === this.currentRoute) return

    // When we start handling the route we tell the app we are busy
    this.isReady = false

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
      this.getContent(path, this.baseUrl)
        .then(this.view.showPage)
        .then(this.routeCompleted)
    }
  }

  routeCompleted (wasFirstRoute = false) {
    // Everyting is over, app is ready to do stuff again
    this.isReady = true
    this.subscribers.forEach(subscriber => {
      subscriber({
        id: this.currentPageId,
        path: this.currentPath,
        isFirstRoute: wasFirstRoute
      })
    })
  }

  get currentPath () { return this.currentRoute.path }
  get currentPageId () { return this.currentRoute.id }
  get previousPath () { return this.previousRoute.path }
  get previousPageId () { return this.previousRoute.id }
  get params () { return this.currentRoute.params || {} }
}
