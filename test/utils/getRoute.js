import test from 'ava'
import { getRouteByPath, getRouteById } from '../../utils/getRoute'

const routes = [
  {id: 'foo', path: '/foo'},
  {id: 'xyz', path: '/xyz'},
  {id: 'bar', path: '/bar/:id'}
]

test('Simple getRouteByPath', t => {
  t.is(getRouteByPath('/foo', routes).id, 'foo')
  t.is(getRouteByPath('/xyz', routes).id, 'xyz')
})

test('Simple getRouteById', t => {
  t.is(getRouteById('foo', routes).id, 'foo')
  t.is(getRouteById('xyz', routes).id, 'xyz')
})

test('getRouteByPath with no trailing slash', t => {
  t.is(getRouteByPath('foo', routes).id, 'foo')
  t.is(getRouteByPath('xyz', routes).id, 'xyz')
})

test('Simple getRouteByPath2', t => {
  t.is(getRouteByPath('/bar/toto', routes).id, 'bar')
})

test('Non existing path should return false getRouteByPath', t => {
  t.false(getRouteByPath('/toto', routes))
})

test('Non existing path should return false getRouteById', t => {
  t.false(getRouteById('toto', routes))
})

test('Non existing routes getRouteByPath', t => {
  const error1 = t.throws(() => {
    getRouteByPath('/toto')
  })
  const error2 = t.throws(() => {
    getRouteByPath('/toto', 'hey')
  })

  t.is(error1.message, 'You need at lease one entry in routes param')
  t.is(error2.message, 'Routes param needs to be an array')
})

test('Non existing routes getRouteById', t => {
  const error1 = t.throws(() => {
    getRouteById('/toto')
  })
  const error2 = t.throws(() => {
    getRouteById('/toto', 'hey')
  })

  t.is(error1.message, 'You need at lease one entry in routes param')
  t.is(error2.message, 'Routes param needs to be an array')
})

test('getRouteByPath from subfolder with baseUrl', t => {
  t.is(getRouteByPath('/subfolder/foo', routes, '/subfolder').id, 'foo')
  t.is(getRouteByPath('/subfolder/xyz', routes, '/subfolder').id, 'xyz')
})