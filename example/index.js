import Component from 'brindille-component'
import { createRouter, View } from '../'
import 'gsap'

// Create the base class for our pages, It needs to implement transitionIn and transitionOut
class Section extends Component {
  transitionIn (callback) {
    TweenMax.fromTo(this.$el, 0.4, {alpha: 0}, {alpha: 1, onComplete: callback})
  }

  transitionOut (callback) {
    TweenMax.to(this.$el, 0.4, {alpha: 0, onComplete: callback})
  }
}

// Creates main Brindille App, the view will take care of switching pages
const app = new Component(document.body, {
  Section,
  View
})

const router = createRouter(app, {
  routes: ['home', {id: 'about'}, {id: 'post', path: 'post/:id'}],
  verbose: true,
  view: app.findInstance('View'),
  baseUrl: '', // Default
  getContent: ({ path, base }) => {
    return window.fetch(base + path + '/partial.html').then(response => response.text())
  }
})

router.start()
