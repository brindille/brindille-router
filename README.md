# brindille-router
Router and view system for Brindille-component

## Installation
```bash
npm install brindille-router brindille-component --save
```

## Usage
Here's how you could make a basic brindille app with two pages. It assumes you are using an ES6 stack and a bundler like webpack.
```js
import Component from 'brindille-component'
import { View, createRouter } from 'brindille-router'

/**
 * Create the base class for our pages
 * It needs to extend brindille-component and
 * implement transitionIn and transitionOut functions
 * In real life you might want to create one class per page
 */
class Section extends Component {
  transitionIn (callback) { 
    // ...
    // Do some transition stuff
    // ...
    callback() // you need to call callback when you are done with your transition
  }
  transitionOut (callback) { 
    // ...
    // Do some transition stuff
    // ...
    callback() // you need to call callback when you are done with your transition
  }
}

/**
 * Creates main Brindille App, the view will take care of switching pages
 * See brindille-component for more infos
 */
const app = new Component(document.body, { Section, View })

/**
 * Initialize rooter with a list of routes and a getContent method
 * that returns a Promise which resolves the content of the new page 
 */
const router = createRouter(app, {
  routes: ['home', 'about'],
  getContent: ({ route }) => fetch(route.path + '.html').then(res => res.text())
})

/**
 * Actually start the router
 */ 
router.start()
```
```html
<!-- index.html -->
<html><body>
  <nav>
    <a href="/home">home</a>
    <a href="/about">about</a>
  </nav>
  <div data-component="View">
    <div data-component="Section">Home</div>
  </div>
  <script src="bundle.js"></script>
</body></html>
```
```html
<!-- home.html -->
<div data-component="Section">Home</div>
```
```html
<!-- about.html -->
<div data-component="Section">About</div>
```

## API
### createRouter
Creates a router instance

**Parameters**
- `app` **[brindille-component](http://github.com/brindille/brindille-component)** the route component that will be used by the Router. The router will look for a View instance in which to inject page content.

- `options` **Object** 
  - `routes` **Array** an array of routes. A route can be either a string or an object with an id and a path. If not provided the path will be created from the id.
    ```js
    routes: ['home', 'about']
    // or
    routes: [{ id: 'home'}, { id: 'about' }]
    // or
    routes: [{ id: 'home', path: '/home' }, { id: 'about', path: '/about' }]
    ```
  - `getContent` **Function** The function that will be used by the router to grab your page content. The idea is for you to fetch your page partials from your server but you could also just pass html string from the js. The getContent method needs to return a Promise that resolves the content as text.
    ```js
    getContent: ({ route }) => {
      return Promise.resolve(`<div>HTML for route: ${ route.route.id }</div>`)
    }
    ```
  - `beforeCompile` **Function** A function that is called right before the newly created section starts parsing its child for brindille-components. It receives the dom node of the new section and it needs to return a Promise that resolves whenever you are ready for compilation. Useful if you need to make some stuff on dom before compiling.
    ```js
    beforeCompile: $node => {
      // Do some stuff on $node if needed
      return Promise.resolve($node)
    }
    ```
  - `verbose` **Boolean** if true the Router will log everything it's doing. Defaults to false
    ```js
    verbose: false
    ```
  - `baseUrl` **String** useful if your app is not hosted on the root folder of your domain. Defaults to `/`
    ```js
    baseUrl: '/subfolder' // if your app is hosted on yourdomain.com/subfolder/
    ```
  - `notFoundHandler` **Function** if provided the router will call this method when hitting a non existing route. The default behaviour from the router is to redirect to default route if the requested route doesn't exist.
    ```js
    notFoundHandler: path => console.log(path, 'is 404')
    ```

**Methods**
  - `router.start()` launches the routing.
  - `router.stop()` stops the routing.
  - `router.goTo(path)` To manually navigate to another page.
    ```js
    const routes = [
      { id: 'home', path: '/some-complicated-home-path' }
    ]
    // ...
    router.goTo('/some-complicated-home-path') // Navigates to route home
    ```
  - `router.goToId(id)` To manually navigate to another page from its id.
    ```js
    const routes = [
      { id: 'home', path: '/some-complicated-home-path' }
    ]
    // ...
    router.goTo('home') // Navigates to route home
    ```
  - `router.dispose()` Properly destroys the router instance.
  - `router.on(event, callback)` To register to the routing events on the router. Available events : `start`, `loaded`, `complete` and `update`.
  - `router.off(event, callback)` To unregister to the routing events on the router.
    ```js
    const router = createRouter(app, { /* ... */ })
    const onRoute = () => {
      console.log(route.id, route.path, route.isFirstRoute)
    }
    router.on('update', onRoute)
    router.start()
    // ...
    router.off('update', onRoute)
    ```

**Getters**
  - `router.routes` Gets the array of routes used by the router
  - `router.currentRoute` Gets the infos for the current route
  - `router.previousRoute` Gets the infos for the previous route
  - `router.isTransitionning` Returns true if router is currently changing route, will be set to false automatically when routing for given route is complete.
  - `router.nbListeners` Gets the number of listeners to the routing event (registerer with `router.on(...)`)

**Events**

The events you can listen to with `router.on(...)`
  - `start` when trying to navigate to the route, this event will be dispatched if the requested route exists. It happens before the router calls the `getContent` method to grab the new page content.
  - `loaded` will be dispatched just after the `getContent` method is done and before the view begins the transitions between pages.
  - `complete` will be dispatched when all transitions from the view are done.
  - `update` is an alias for `complete`

### View
Utility brindille-component that can display pages when combined with the router. You need to add this class in your definitions of your app. It will take care of parsing your new Pages for brindille-component they may contain and manage transition orders.
```js
import Component from 'brindille-component'
import { View, createRouter } from 'brindille-router'

const app = new Component(document.body, { 
  View // You need to add the definition of View in your app
})
const router = createRouter(app, { /* ... */ })
```
And then use it in your html wherever your want your pages to appear.
```html
<body>
  <div data-component="View">
    <!--
    Pages content will be added here
    It's your job to auto add first view here on page load (SSR)
    -->
  </div>
</body>
```

### Avoiding router actions on some links
When active the router will intercept all internal link clicks to process page change.
In some cases you might want to avoid this behavior and have a link that just refresh the page. 
For this you just need to add a `data-router-ignore` attribute to your link tag.
```html
<a href="/someroute" data-router-ignore>my link</a>
```