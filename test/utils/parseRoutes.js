import test from 'ava'
import parseRoutes from '../../utils/parseRoutes'

test('calling with wrong param should not work', t => {
  t.throws(() => {
    parseRoutes()
  })
  t.throws(() => {
    parseRoutes(null)
  })
  t.throws(() => {
    parseRoutes(undefined)
  })
  t.throws(() => {
    parseRoutes('string')
  })
  t.throws(() => {
    parseRoutes(1)
  })
  t.throws(() => {
    parseRoutes(false)
  })
})

test('calling with empty array should not work', t => {
  t.deepEqual([], parseRoutes([]))
})

test('calling with array of strings should work', t => {
  t.deepEqual(
    [
      {id: 'a', path: '/a'}, 
      {id: 'b', path: '/b'}
    ], 
    parseRoutes(['a', 'b'])
  )
  t.deepEqual(
    [
      {id: 'a', path: '/a'}
    ], 
    parseRoutes(['a'])
  )
})

test('calling with array of something else than strings or object should not work', t => {
  const message = '[Router] routes must either be a string or an object with an id'
  const e1 = t.throws(() => {
    parseRoutes([1, 2])
  })
  const e2 = t.throws(() => {
    parseRoutes([true])
  })
  const e3 = t.throws(() => {
    parseRoutes(['a', 2])
  })
  const e4 = t.throws(() => {
    parseRoutes(['a', false])
  })
  const e5 = t.throws(() => {
    parseRoutes(['a', null])
  })

  t.is(e1.message, message)
  t.is(e2.message, message)
  t.is(e3.message, message)
  t.is(e4.message, message)
  t.is(e5.message, message)
})

test('calling with array of objects without proper properties should not work', t => {
  const message = '[Router] routes must either be a string or an object with an id'
  const e1 = t.throws(() => {
    parseRoutes([{foo: 'bar'}])
  })
  t.is(e1.message, message)
})

test('calling with array of objects with ids should work', t => {
  t.deepEqual(
    [
      {id: 'a', path: '/a'}, 
      {id: 'b', path: '/b'}
    ], 
    parseRoutes([{id: 'a'}, {id: 'b'}])
  )
  t.deepEqual(
    [
      {id: 'a', path: '/a'}
    ], 
    parseRoutes([{id: 'a'}])
  )
})

test('mixing strings and objects should also work', t => {
  t.deepEqual(
    [
      {id: 'a', path: '/a'}, 
      {id: 'b', path: '/b'}
    ], 
    parseRoutes(['a', {id: 'b'}])
  )
})

test('if a path is provided in object, it will be used instead of id', t => {
  t.deepEqual(
    [
      {id: 'a', path: '/b'}
    ], 
    parseRoutes([{id: 'a', path: 'b'}])
  )
})
