import test from 'ava'
import matchRoute from '../../utils/matchRoute'

test ('Match simple route', t => {
  const rule = '/foo'

  const match1 = matchRoute('/foo', rule)
  const match2 = matchRoute('/bar', rule)

  t.truthy(match1)
  t.deepEqual(match1, {})

  t.false(match2)
})

test ('Match route with one param', t => {
  const rule = '/foo/:id'

  const match1 = matchRoute('/foo/bar', rule)
  const match2 = matchRoute('/bar/foo', rule)

  t.truthy(match1)
  t.deepEqual(match1, {id: 'bar'})

  t.false(match2)
})

test ('Match route with multiple params', t => {
  const rule = '/foo/:id/:name'

  const match1 = matchRoute('/foo/bar/lol', rule)
  const match2 = matchRoute('/foo/bar', rule)

  t.truthy(match1)
  t.deepEqual(match1, {id: 'bar', name: 'lol'})

  t.false(match2)
})

test ('Math route with optionnal param (zero or more)', t => {
  const rule = '/foo/:id*'

  const match1 = matchRoute('/foo', rule)
  const match2 = matchRoute('/foo/bar', rule)
  const match3 = matchRoute('/foo/bar/lol', rule)

  t.truthy(match1)
  t.deepEqual(match1, {})

  t.truthy(match2)
  t.deepEqual(match2, {id: ['bar']})

  t.truthy(match3)
  t.deepEqual(match3, {id: ['bar', 'lol']})
})

test ('Match route with repeatable param (one or more)', t => {
  const rule = '/foo/:id+'

  const match1 = matchRoute('/foo/bar', rule)
  const match2 = matchRoute('/foo/bar/lol', rule)
  const match3 = matchRoute('/bar', rule)

  t.truthy(match1)
  t.deepEqual(match1, {id: ['bar']})

  t.truthy(match2)
  t.deepEqual(match2, {id: ['bar', 'lol']})

  t.false(match3)
})
