import page from 'page'
import Emitter from 'emitter-component'
import getRouteByPath from './utils/getRouteByPath'
import parseRoutes from './utils/parseRoutes'

/**
 * Router class
 */
class Router extends Emitter {
  constructor () {
    super()

    this.isFirstRoute = true
    this.isReady = true

    this.loadRoute = this.loadRoute.bind(this)
    this.notFound = this.notFound.bind(this)
  }

  start (options = {}) {
    this.baseUrl = options.baseUrl || ''
    this.getContent = options.getContent || getContentDefault
    this.isVerbose = options.verbose && options.verbose === true

    this.log('baseUrl = "' + this.baseUrl + '"')

    this.routes = parseRoutes(options.routes || [])
    this.defaultRoute = this.routes[0]

    this.routes.forEach(route => {
      this.log('registering route:', '/' + route.path)
      page('/' + route.path, this.loadRoute)
    })
    page('*', this.notFound)

    page.base(this.baseUrl)

    page.start()
  }

  log (...messages) {
    if (this.isVerbose) {
      console.log('[Router]', ...messages)
    }
  }

  /* ========================================================
    Not found / Default route
  ======================================================== */
  notFound (context) {
    this.log('notFound', context.path)
    page.redirect('/' + this.defaultRoute.path)
  }

  /* ========================================================
    API
  ======================================================== */
  redirect (url) {
    page(url)
  }

  fullRedirection (url) {
    let path = '/' + url
    window.location.href = 'http://' + window.location.hostname + this.baseUrl + path
  }

  /* ========================================================
    Main Controller
  ======================================================== */
  loadRoute (context) {
    let currentRoute = getRouteByPath(context.path, this.routes)

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
      this.emit('first', () => {
        this.routeCompleted()
      })
      return
    }

    this.getContent(context.path, this.baseUrl).then(content => {
      this.emit('update', this.currentPageId, content, () => {
        this.routeCompleted()
      })
    })
  }

  routeCompleted () {
    // Everyting is over, app is ready to do stuff again
    this.isReady = true
  }

  get currentPath () { return this.currentRoute.path }
  get currentPageId () { return this.currentRoute.id }
  get previousPath () { return this.previousRoute.path }
  get previousPageId () { return this.previousRoute.id }
  get params () { return this.currentRoute.params || {} }
}

export const router = new Router()

function getContentDefault (path, baseUrl) {
  // In every other cases we need to load the partial of the new route before launching transitions
  let url = context.path + '/partial.html'
  let options = {}

  // In dev mode the partial is loaded from express routes rather than from html file
  if (process.env.NODE_ENV !== 'production') {
    url = context.path
    options = {headers: {'X-Requested-With': 'XMLHttpRequest'}}
  }

  // When request is done we pass the content to the view and wait for transitions to complete before continuing
  return window.fetch(baseUrl + url, options).then(response => {
    return response.text()
  })
}
