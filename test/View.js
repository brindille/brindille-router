import test from 'ava'
import { View } from '../View'
import { router } from '../Router'
import Component from 'brindille-component'
import Section from './fixtures/Section'

const pages = {
  'home': `<div data-component="Section">home</div>`,
  'about': `<div data-component="Section">about</div>`
}

document.body.innerHTML = `
  <div class="View" data-component="View">
    ${ pages['home'] }
  </div>
`

const root = new Component(document.body, {
  Section,
  View
})

const view = root.findInstance('View')

router.start({
  routes: ['home', 'about'],
  verbose: false,
  baseUrl: '', // Default
  getContent: path => {
    console.log('get', path)
    return pages[path]
  }
})

test('Simple view', t => {
  router.redirect('about')
  t.pass()
})