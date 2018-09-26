'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var equal = _interopDefault(require('deep-equal'));
var dush = _interopDefault(require('dush'));
var Component = _interopDefault(require('brindille-component'));

var isarray = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

/**
 * Expose `pathToRegexp`.
 */
var pathToRegexp_1 = pathToRegexp;
var parse_1 = parse;
var compile_1 = compile;
var tokensToFunction_1 = tokensToFunction;
var tokensToRegExp_1 = tokensToRegExp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g');

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse (str, options) {
  var tokens = [];
  var key = 0;
  var index = 0;
  var path = '';
  var defaultDelimiter = options && options.delimiter || '/';
  var res;

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0];
    var escaped = res[1];
    var offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      continue
    }

    var next = str[index];
    var prefix = res[2];
    var name = res[3];
    var capture = res[4];
    var group = res[5];
    var modifier = res[6];
    var asterisk = res[7];

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = '';
    }

    var partial = prefix != null && next != null && next !== prefix;
    var repeat = modifier === '+' || modifier === '*';
    var optional = modifier === '?' || modifier === '*';
    var delimiter = res[2] || defaultDelimiter;
    var pattern = capture || group;

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      asterisk: !!asterisk,
      pattern: pattern ? escapeGroup(pattern) : (asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?')
    });
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index);
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path);
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile (str, options) {
  return tokensToFunction(parse(str, options))
}

/**
 * Prettier encoding of URI path segments.
 *
 * @param  {string}
 * @return {string}
 */
function encodeURIComponentPretty (str) {
  return encodeURI(str).replace(/[\/?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
 *
 * @param  {string}
 * @return {string}
 */
function encodeAsterisk (str) {
  return encodeURI(str).replace(/[?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length);

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
    }
  }

  return function (obj, opts) {
    var path = '';
    var data = obj || {};
    var options = opts || {};
    var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        path += token;

        continue
      }

      var value = data[token.name];
      var segment;

      if (value == null) {
        if (token.optional) {
          // Prepend partial segment prefixes.
          if (token.partial) {
            path += token.prefix;
          }

          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (isarray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received `' + JSON.stringify(value) + '`')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j]);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received `' + JSON.stringify(segment) + '`')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }

        continue
      }

      segment = token.asterisk ? encodeAsterisk(value) : encode(value);

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment;
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {!RegExp} re
 * @param  {Array}   keys
 * @return {!RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {!Array}  keys
 * @return {!RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        asterisk: false,
        pattern: null
      });
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array}   keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = [];

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {!Array}  keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function stringToRegexp (path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}          tokens
 * @param  {(Array|Object)=} keys
 * @param  {Object=}         options
 * @return {!RegExp}
 */
function tokensToRegExp (tokens, keys, options) {
  if (!isarray(keys)) {
    options = /** @type {!Object} */ (keys || options);
    keys = [];
  }

  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var route = '';

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];

    if (typeof token === 'string') {
      route += escapeString(token);
    } else {
      var prefix = escapeString(token.prefix);
      var capture = '(?:' + token.pattern + ')';

      keys.push(token);

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*';
      }

      if (token.optional) {
        if (!token.partial) {
          capture = '(?:' + prefix + '(' + capture + '))?';
        } else {
          capture = prefix + '(' + capture + ')?';
        }
      } else {
        capture = prefix + '(' + capture + ')';
      }

      route += capture;
    }
  }

  var delimiter = escapeString(options.delimiter || '/');
  var endsWithDelimiter = route.slice(-delimiter.length) === delimiter;

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithDelimiter ? route.slice(0, -delimiter.length) : route) + '(?:' + delimiter + '(?=$))?';
  }

  if (end) {
    route += '$';
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithDelimiter ? '' : '(?=' + delimiter + '|$)';
  }

  return attachKeys(new RegExp('^' + route, flags(options)), keys)
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {(Array|Object)=}       keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp (path, keys, options) {
  if (!isarray(keys)) {
    options = /** @type {!Object} */ (keys || options);
    keys = [];
  }

  options = options || {};

  if (path instanceof RegExp) {
    return regexpToRegexp(path, /** @type {!Array} */ (keys))
  }

  if (isarray(path)) {
    return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options)
  }

  return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options)
}
pathToRegexp_1.parse = parse_1;
pathToRegexp_1.compile = compile_1;
pathToRegexp_1.tokensToFunction = tokensToFunction_1;
pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

/**
 * Will test if a path is matching a route path
 * @param {String} path The path to test
 * @param {RegExp} rule The regexp to test path against
 */
function matchRoute (path, rule) {
  let keys = [];
  const re = pathToRegexp_1(rule, keys, {});
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
 * Get a route from a path for a giver list or existing routes, returns first entry of routes if no match is found
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
  const getContent = options.getContent || (route => Promise.resolve(route.id));
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
   * Launch the routing
   */
  function start () {
    log('start');
    win.addEventListener('popstate', onStateUpdate);
    win.addEventListener('click', onClick);
    
    onStateUpdate();
  }

  /**
   * Navigates to a given internal URL
   * @param {String} url URL to navigate to
   */
  function goTo (url) {
    win.history.pushState(null, null, url);
    onStateUpdate();
  }

  /**
   * Destroys the router and cancels any listeners still active
   */
  function dispose () {
    emitter.off('update');
    win.removeEventListener('popstate', onStateUpdate);
    win.removeEventListener('click', onClick);
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
    if (equal(newRoute, currentRoute)) return

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
      getContent(currentRoute, path, baseUrl)
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
    goTo,
    dispose,

    get routes () { return routes.slice(0) },
    get nbListeners () { return emitter._allEvents.update ? emitter._allEvents.update.length : 0 },
    
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
