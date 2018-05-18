import test from 'ava'
import getRouteByPath from '../../utils/getRouteByPath'

const routes = [
  {id: 'foo', path: '/foo'},
  {id: 'xyz', path: '/xyz'},
  {id: 'bar', path: '/bar/:id'}
]

test('Simple getRouteByPath', t => {
  t.is(getRouteByPath('/foo', routes).id, 'foo')
  t.is(getRouteByPath('/xyz', routes).id, 'xyz')
})

test('getRouteByPath with no trailing slash', t => {
  t.is(getRouteByPath('foo', routes).id, 'foo')
  t.is(getRouteByPath('xyz', routes).id, 'xyz')
})

test('Simple getRouteByPath2', t => {
  t.is(getRouteByPath('/bar/toto', routes).id, 'bar')
})

test('Non existing path should return default route', t => {
  t.is(getRouteByPath('/toto', routes).id, 'foo')
})

test('Non existing routes', t => {
  const error1 = t.throws(() => {
    getRouteByPath('/toto')
  })
  const error2 = t.throws(() => {
    getRouteByPath('/toto', 'hey')
  })

  t.is(error1.message, 'You need at lease one entry in routes param')
  t.is(error2.message, 'Routes param needs to be an array')
})