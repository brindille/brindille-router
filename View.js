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

  showPage (content) {
    this.content = content
    this.currentPage = this.createSection(content)
    return this.transitionOutAndAfterIn()
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

  createSection (text) {
    const win = this.window || window
    let $node = win.document.createElement('div')
    $node.innerHTML = text

    if ($node.firstChild.nodeType === 3) {
      return $node
    }

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