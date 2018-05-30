import test from 'ava'
// import { View } from '../View2'
// import Router from '../Router2'
// import Component from 'brindille-component'
// import Section from './fixtures/Section'

test('void', t => {
  t.pass()
})

// const pages = {
//   'home': `<div data-component="Section">home</div>`,
//   'about': `<div data-component="Section">about</div>`
// }

// const getContent = path => Promise.resolve(pages[path.replace('/', '')])

// const createBody = content => {
//   const div = document.createElement('div')
//   div.innerHTML = `<div data-component="View">${ content }</div>` 
//   return div
// }

// test.serial('Router creation with no getContent param', t => {
//   const body = createBody(pages['home'])
//   const root = new Component(body, { Section, View })
//   const view = root.findInstance('View')
//   view.id = 'a'
//   const router = new Router({
//     view,
//     getContent,
//     routes: ['home', 'about']
//   })
//   router.id = 'a'

//   return new Promise((resolve, reject) => {
//     router.subscribe(route => {
//       if (route.isFirstRoute) {
//         console.log('0', route.id)
//         t.is(route.id, 'home')
//         t.is(view.$el.children[0].innerHTML, 'home')
//         router.redirect('/about')
//       } else {
        
//         console.log('1', route.id)
//         t.is(route.id, 'about')
//         t.is(view.$el.children[0].innerHTML, 'about')
//         router.dispose()
//         resolve()  
//       }
//     })
//     router.redirect('/home')
//   })
// })

// test.serial('Router creation with empty initial view', t => {
//   console.log('trying another one ?')
//   const body = createBody('')
//   const root = new Component(body, { Section, View })
//   const view = root.findInstance('View')
//   view.id = 'b'
//   const router = new Router({
//     view,
//     getContent,
//     routes: ['home', 'about']
//   })
//   router.id = 'b'

//   return new Promise((resolve, reject) => {
//     router.subscribe(route => {
//       console.log('2', route.id)
//       t.is(route.id, 'home')
//       router.dispose()
//       resolve()
//     })
//     router.redirect('/home')
//   })
// })
