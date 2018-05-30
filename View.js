import Component from 'brindille-component'
import { router } from './'
import safeCallbackedCall from './utils/safeCallbackedCall'

export class View extends Component {
  constructor ($el) {
    super($el)

    this.onRoute = this.onRoute.bind(this)
    this.showFirstPage = this.showFirstPage.bind(this)

    router.on('update', this.onRoute)
    router.once('first', this.showFirstPage)
  }

  dispose () {
    router.off('update', this.onRoute)
    router.off('first', this.showFirstPage)
    super.dispose()
  }

  showFirstPage (done) {
    this.currentPage = this._componentInstances[0]
    safeCallbackedCall(this.currentPage, 'transitionIn', done)
  }

  transitionOutAndAfterIn (done) {
    const oldPage = this._componentInstances[this._componentInstances.length - 1]
    const onTransitionOutComplete = () => {
      this.removeAllChilds()
      this.addNewPage()
      safeCallbackedCall(this.currentPage, 'transitionIn', done)
    }
    safeCallbackedCall(oldPage, 'transitionOut', onTransitionOutComplete)
  }

  removeAllChilds () {
    while (this._componentInstances.length) {
      this._componentInstances[0].dispose()
    } 
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

  manageSpecialPages () {}

  onRoute (id, content, done) {
    window.scrollTo(0, 0)
    this.currentPage = this.createSection(content)
    this.content = content

    if (this._componentInstances.length) {
      this.transitionOutAndAfterIn(done)
      this.manageSpecialPages(id)
    } else {
      this.removeAllChilds()
      this.addNewPage()
      done()
    }
  }
}