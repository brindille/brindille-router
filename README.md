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
  transitionIn (callback) { /* ... */ }
  transitionOut (callback) { /* ... */ }
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
  getContent: data => fetch(data.path + '.html').then(res => res.text())
})
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
  <script src="bundle.js"/>
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
### Router
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
    getContent: data => {
      return Promise.resolve(`<div>HTML for route: ${ data.route.id }</div>`)
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