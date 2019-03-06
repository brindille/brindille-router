import Component from 'brindille-component'
import safeCallbackedCall from './utils/safeCallbackedCall'

export default class View extends Component {
  constructor ($el) {
    super($el)

    this.showPage = this.showPage.bind(this)
    this.showFirstPage = this.showFirstPage.bind(this)
  }

  showFirstPage () {
    return new Promise((resolve, reject) => {
      this.currentPage = this._componentInstances[0]
      safeCallbackedCall(this.currentPage, 'transitionIn', () => {
        resolve(true)
      })
    })
  }

  showPage (content, beforeCompile) {
    this.content = content
    return this.createSection(content, beforeCompile).then(page => {
      this.currentPage = page
      return this.transitionOutAndAfterIn()
    })
  }

  transitionOutAndAfterIn () {
    return new Promise((resolve, reject) => {
      const oldPage = this._componentInstances[this._componentInstances.length - 1]
      safeCallbackedCall(oldPage, 'transitionOut', resolve)
    }).then(() => {
      return this.transitionIn()
    })
  }

  transitionIn () {
    return new Promise((resolve, reject) => {
      this.disposeChildren()
      this.addNewPage()
      safeCallbackedCall(this.currentPage, 'transitionIn', resolve)
    })
  }

  addNewPage () {
    if (!this.currentPage.$el) {
      this.$el.appendChild(this.currentPage)
    } else {
      this._componentInstances.push(this.currentPage)
      this.$el.appendChild(this.currentPage.$el)
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

  createSection (text, beforeCompile) {
    const win = this.window || window
    let $node = win.document.createElement('div')
    $node.innerHTML = text

    if ($node.firstChild.nodeType === 3) {
      return Promise.resolve($node)
    }

    $node = $node.firstChild

    let componentName = $node.getAttribute('data-component')
    let Ctor = this.getCtor(componentName)

    $node.removeAttribute('data-component')

    if (!beforeCompile || typeof beforeCompile !== 'function') {
      beforeCompile = (dom => Promise.resolve(dom))
    }
    return beforeCompile($node).then($node => {
      let section = new Ctor($node)
      section.init(this.definitions)
      section.componentName = componentName
      section.parent = this
  
      return section
    })

  }
}