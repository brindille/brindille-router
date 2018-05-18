import Component from 'brindille-component'

export default class Section extends Component {
  transitionIn (callback) {
    setTimeout(callback)
  }

  transitionOut (callback) {
    setTimeout(callback)
  }
}