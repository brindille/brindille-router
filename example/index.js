import Component from 'brindille-component'
import { View, router } from '../index.js'
import 'gsap'

/**
 * Create the base class for our pages
 * It needs to implement transitionIn and transitionOut
 */
class Section extends Component {
  transitionIn (callback) {
    TweenMax.fromTo(this.$el, 0.4, {alpha: 0}, {alpha: 1, onComplete: callback})
  }

  transitionOut (callback) {
    TweenMax.to(this.$el, 0.4, {alpha: 0, onComplete: callback})
  }
}

// Initialize rooter with a list of routes and 
router.start({
  routes: ['home', {id: 'about'}],
  verbose: true,
  baseUrl: '', // Default
  getContent: (path, baseUrl) => {
    return window.fetch(baseUrl + path + '/partial.html').then(response => {
      return response.text()
    })
  }
})

// Creates main Brindille App, the view will take care of switching pages
new Component(document.body, {
  Section,
  View
})