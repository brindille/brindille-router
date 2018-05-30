import Component from 'brindille-component'
import safeCallbackedCall from './utils/safeCallbackedCall'

export class View extends Component {
  constructor ($el) {
    super($el)

    this.showPage = this.showPage.bind(this)
    this.showFirstPage = this.showFirstPage.bind(this)
  }

  showFirstPage () {
    return new Promise((resolve, reject) => {
      // console.log('showFirstPage', this.id)
      this.currentPage = this._componentInstances[0]
      safeCallbackedCall(this.currentPage, 'transitionIn', resolve)
    })
  }

  showPage (content) {
    // if (window && window.scrollTo) window.scrollTo(0, 0)
    this.currentPage = this.createSection(content)
    this.content = content
    
    if (this._componentInstances.length) { // The view contained another page
      return this.transitionOutAndAfterIn()
    } else { // The view was empty
      return this.transitionIn()
    }
  }

  transitionOutAndAfterIn () {
    return new Promise((resolve, reject) => {
      // console.log('transitionOutAndAfterIn', this.id)
      const oldPage = this._componentInstances[this._componentInstances.length - 1]
      safeCallbackedCall(oldPage, 'transitionOut', resolve)
    }).then(() => {
      return this.transitionIn()
    })
  }

  transitionIn () {
    return new Promise((resolve, reject) => {
      // console.log('transitionIn', this.id)
      this.disposeChildren()
      this.addNewPage()
      safeCallbackedCall(this.currentPage, 'transitionIn', resolve)
    })
  }

  addNewPage () {
    if (!this.currentPage.$el) return
    this._componentInstances.push(this.currentPage)
    this.$el.appendChild(this.currentPage.$el)
  }

  createSection (text) {
    let $node = document.createElement('div')
    $node.innerHTML = text
    $node = $node.firstChild

    let componentName = $node.getAttribute('data-component')
    let Ctor = this.definitions[componentName]

    $node.removeAttribute('data-component')

    let section = new Ctor($node)
    section.init(this.definitions)
    section.componentName = componentName
    section.parent = this

    return section
  }
}