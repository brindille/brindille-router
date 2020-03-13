import Component from 'brindille-component'
import { createRouter, View } from '../'

// Create the base class for our pages, It needs to implement transitionIn and transitionOut
class Section extends Component {
  transitionIn(callback) {
    gsap.fromTo(this.$el, 0.4, { alpha: 0 }, { alpha: 1, onComplete: callback })
  }

  transitionOut(callback) {
    gsap.to(this.$el, 0.4, { alpha: 0, onComplete: callback })
  }
}

// Creates main Brindille App, the view will take care of switching pages
const app = new Component(document.body, {
  Section,
  View
})

const router = createRouter(app, {
  routes: ['home', { id: 'about' }, { id: 'post', path: 'post/:id' }],
  verbose: true,
  view: app.findInstance('View'),
  baseUrl: '', // Default
  beforeCompile: $node => {
    // Do some stuff on $node if you need
    return Promise.resolve($node)
  },
  getContent: ({ path, base }) => {
    // Where the router should grab what is supposed to go into the view element on each route
    return window
      .fetch(base + path + '/partial.html')
      .then(response => response.text())
  }
})

router.start()

router.on('update', route => {
  // Do something with route
})
