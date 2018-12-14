'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var pathToRegexp = _interopDefault(require('path-to-regexp'));
var dush = _interopDefault(require('dush'));
var Component = _interopDefault(require('brindille-component'));

/**
 * Will test if a path is matching a route path
 * @param {String} path The path to test
 * @param {RegExp} rule The regexp to test path against
 */
function matchRoute (path, rule) {
  let keys = [];
  const re = pathToRegexp(rule, keys, {});
  const m = re.exec(path);
  if (!m) return false

  const params = {};
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i];
    const param = m[i + 1];
    if (!param) continue
    params[key.name] = param;
    if (key.repeat) params[key.name] = params[key.name].split(key.delimiter);
  }
  return params
}

/**
 * Adds a slash at the beggining of a string if it does not exists yet
 * @param {String} str the string to which we want to add a slash to in the beginning
 */
function safeAddTrailingSlash (str = '') {
  if (typeof str !== 'string') {
    throw new Error('str should be a string and is a ' + typeof str)
  }
  return '/' + str.replace(/^\//, '')
}

/**
 * Get a route from a path for a given list or existing routes, returns first entry of routes if no match is found
 * @param {String} path path to be tested against routes
 * @param {Array} routes list of routes that path will be tested against
 */
function getRouteByPath (path, routes = []) {
  path = safeAddTrailingSlash(path);
  if (!Array.isArray(routes)) {
    throw new Error('Routes param needs to be an array')
  }
  if (!routes.length) {
    throw new Error('You need at lease one entry in routes param')
  }
  const route = routes.find(r => {
    const params = matchRoute(path, r.path);
    if (params) {
      r.params = params;
      return true
    }
    return false
  });
  if (route) {
    return Object.assign({}, route)
  }
  return false
}


/**
 * Get a route from a path for a given list or existing routes, returns first entry of routes if no match is found
 * @param {String} path path to be tested against routes
 * @param {Array} routes list of routes that path will be tested against
 */
function getRouteById (id, routes = []) {
  if (!Array.isArray(routes)) {
    throw new Error('Routes param needs to be an array')
  }
  if (!routes.length) {
    throw new Error('You need at lease one entry in routes param')
  }
  const route = routes.find(r => {
    return id === r.id
  });
  if (route) {
    return Object.assign({}, route)
  }
  return false
}

/**
 * Returns a properly structure route array given a list of route
 * @param {Array.<String|Object>} routes 
 */
function parseRoutes (routes) {
  if (!Array.isArray(routes)) {
    throw new Error('[Router] routes must be an array')
  }
  return routes.map(route => {
    if (typeof route === 'string') {
      return {
        id: route,
        path: safeAddTrailingSlash(route)
      }
    }
    if (!route || !route.id) {
      throw new Error('[Router] routes must either be a string or an object with an id')
    }
    return {
      id: route.id,
      path: safeAddTrailingSlash(route.path || route.id)
    }
  })
}

const isSpecialKeypressed = e => e.which > 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
const isIgnoredLink = el => el.hasAttribute('data-router-ignore');
const isDownloadLink = el => el.hasAttribute('download') || el.getAttribute('rel') === 'external';
const isBlank = el => el.target !== undefined && el.target === 'blank';
const isDifferentOrigin = (el, win = window) => el.protocol !== win.location.protocol || el.hostname !== win.location.hostname;
const isSameLocation = (el, win = window) => el.pathname === win.location.pathname && el.search === win.location.search;
const isMailto = el => el.href !== undefined && el.href.indexOf('mailto:') > -1;
const isLink = el => el && el.nodeName.toUpperCase() === 'A';
const getLink = el => isLink(el) ? el : (el.parentNode ? getLink(el.parentNode) : null);
const getUrl = source => safeAddTrailingSlash(source.pathname + source.search + (source.hash || ''));

/**
 * Check if a clicked link is eligible for routing. If it is it will return the link url. If it isn't it will return false
 * @param {Event} e the click event we want to test
 * @param {Window} win the window context to use for the test, you probably don't want to use this param
 */
function checkLink (e, win = window) {
  // For each click we check if target is link
  let el = getLink(e.target);
  
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
  e.preventDefault();

  // We still do nothing if link location is same as current location
  if (isSameLocation(el, win)) {
    return false
  }

  // Return formatted path for clicked link (in the form of "/home")
  return getUrl(el)
}

/**
 * 
 * @param {BrindilleComponent} app An instance of the main brindille component your router will be applied to (usually the body / root component)
 * @param {Object} options
 * @param {String[]|Object[]} options.routes An array of routes (ex: ["home", "contacts"])
 * @param {Function} options.getContent the function that gets your page content, must return a promise that resolves the content of the new page
 * @param {Boolean} [options.verbose] If true will log a bunch of stuff for debugging purposes
 * @param {Boolean} [options.notFoundHandler] A method that will be called if requested route does not exists
 * @param {String} [options.baseUrl] a string that will be passed to your getContent method, can be useful for prepending a string to urls
 */
function createRouter (app, options = {}, win = window) {
  if (!app || !app._componentInstances) {
    throw new Error('First param of createRouter needs to be an instance of brindille component')
  }
  
  const view = app.findInstance('View');

  if (!view) {
    throw new Error('There is no View instance in your brindille App')
  }

  let isFirstRoute = true;
  let isTransitionning = false;
  
  const emitter = dush();

  const baseUrl = options.baseUrl || '';
  const getContent = options.getContent || (({ route }) => Promise.resolve(route.id));
  const isVerbose = options.verbose && options.verbose === true;
  const notFoundHandler = options.notFoundHandler && typeof options.notFoundHandler === 'function' ? options.notFoundHandler : false;
  const routes = parseRoutes(Array.isArray(options.routes) && options.routes.length ? options.routes : ['home']);
  const defaultRoute = routes[0];

  let currentRoute = null;
  let previousRoute = null;
  
  log('baseUrl = "' + baseUrl + '"');
  routes.forEach(route => {
    log('registering route:', route.path);
  });
  
  function onClick (e) {
    let link = checkLink(e, win);
    if (link) {
      goTo(link);
    }
  }

  function log (...messages) {
    if (isVerbose) {
      console.log('[Router]', ...messages);
    }
  }

  /**
   * Launches the routing
   */
  function start () {
    log('start');
    win.addEventListener('popstate', onStateUpdate);
    win.addEventListener('click', onClick);
    
    onStateUpdate();
  }

  /**
   * Stops the routing
   */
  function stop () {
    log('stop');
    win.removeEventListener('popstate', onStateUpdate);
    win.removeEventListener('click', onClick);
  }

  /**
   * Navigates to a given internal URL
   * @param {String} url URL to navigate to
   */
  function goTo (url) {
    win.history.pushState(null, null, url);
    onStateUpdate();
  }

  function goToId (id, params) {
    let route = getRouteById(id, routes);
    if (route) {
      let path = route.path;
      if (params) {
        Object.keys(params).forEach(key => {
          path = path.replace(':' + key, params[key]);
        });
      }
      goTo(path);
    }
  }

  /**
   * Destroys the router and cancels any listeners still active
   */
  function dispose () {
    emitter.off('update');
    stop();
  }

  function onStateUpdate () {
    loadRoute(getUrl(win.location));
  }

  function loadRoute (path) {
    let newRoute = getRouteByPath(path, routes);
    if (!newRoute) {
      if (notFoundHandler) {
        return notFoundHandler(path)
      } else {
        newRoute = defaultRoute;
      }
    }
    
    // Stop handling route when trying to reach the current route path
    // if (equal(newRoute, currentRoute)) return

    // When we start handling the route we tell the app we are busy
    isTransitionning = true;

    // Shift current and previous routes
    previousRoute = currentRoute;
    currentRoute = Object.assign({ isFirstRoute }, newRoute);
    
    emitter.emit('start', currentRoute);

    log('route:', currentRoute.id, isFirstRoute ? '(first)' : '');

    // If current route is first route, the dom is already present, we just need the view to launch transition in of current view
    if (isFirstRoute) {
      isFirstRoute = false;
      view.showFirstPage()
        .then(routeCompleted);
    } else {
      getContent({ route: currentRoute, base: baseUrl, path })
        .then(content => {
          emitter.emit('loaded', currentRoute);
          return content
        })
        .then(view.showPage)
        .then(routeCompleted);
    }
  }

  function routeCompleted () {
    isTransitionning = false;
    emitter.emit('complete', currentRoute);
    emitter.emit('update', currentRoute);
  }

  return {
    start,
    stop,
    goTo,
    goToId,
    dispose,
    
    get routes () { return routes.slice(0) },
    get nbListeners () { return emitter._allEvents.update ? emitter._allEvents.update.length : 0 },
    
    get baseUrl () { return baseUrl },

    get currentRoute () { return Object.assign({}, currentRoute) },
    get previousRoute () { return Object.assign({}, previousRoute) },

    get isTransitionning () { return isTransitionning },

    on: (...opt) => emitter.on(...opt),
    off: (...opt) => emitter.off(...opt)
  }
}

/**
 * Calls a function with callback param if it exists 
 * or calls callback directly if the function does not exists
 * 
 * @param {Obkect} object context for method to call
 * @param {String} methodName name of the method to call on object
 * @param {Function} callback the function to be called at the end of method
 */
function safeCallbackedCall (object, methodName, callback) {
  if (!callback || typeof callback !== 'function') {
    throw new Error('The callback param should be a function')
  }
  if (object && object[methodName] && typeof object[methodName] === 'function') {
    object[methodName](callback);
  } else {
    callback();
  }
}

class View extends Component {
  constructor ($el) {
    super($el);

    this.showPage = this.showPage.bind(this);
    this.showFirstPage = this.showFirstPage.bind(this);
  }

  showFirstPage () {
    return new Promise((resolve, reject) => {
      this.currentPage = this._componentInstances[0];
      safeCallbackedCall(this.currentPage, 'transitionIn', () => {
        resolve(true);
      });
    })
  }

  showPage (content) {
    this.content = content;
    this.currentPage = this.createSection(content);
    return this.transitionOutAndAfterIn()
  }

  transitionOutAndAfterIn () {
    return new Promise((resolve, reject) => {
      const oldPage = this._componentInstances[this._componentInstances.length - 1];
      safeCallbackedCall(oldPage, 'transitionOut', resolve);
    }).then(() => {
      return this.transitionIn()
    })
  }

  transitionIn () {
    return new Promise((resolve, reject) => {
      this.disposeChildren();
      this.addNewPage();
      safeCallbackedCall(this.currentPage, 'transitionIn', resolve);
    })
  }

  addNewPage () {
    if (!this.currentPage.$el) {
      this.$el.appendChild(this.currentPage);
    } else {
      this._componentInstances.push(this.currentPage);
      this.$el.appendChild(this.currentPage.$el);
    }
  }

  getCtor (componentName) {
    if (typeof this.definitions === 'function') {
      return this.definitions(componentName)
    } else if (typeof this.definitions === 'object') {
      return this.definitions[componentName]
    }
    return null
  }

  createSection (text) {
    const win = this.window || window;
    let $node = win.document.createElement('div');
    $node.innerHTML = text;

    if ($node.firstChild.nodeType === 3) {
      return $node
    }

    $node = $node.firstChild;

    let componentName = $node.getAttribute('data-component');
    let Ctor = this.getCtor(componentName);

    $node.removeAttribute('data-component');

    let section = new Ctor($node);
    section.init(this.definitions);
    section.componentName = componentName;
    section.parent = this;

    return section
  }
}

exports.createRouter = createRouter;
exports.View = View;
exports.matchRoute = matchRoute;
exports.getRouteByPath = getRouteByPath;
exports.getRouteById = getRouteById;
