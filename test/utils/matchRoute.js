import test from 'ava'
import matchRoute from '../../utils/matchRoute'
import { match } from 'path-to-regexp'

test('Match simple route', t => {
  const rule = '/foo'

  const match1 = matchRoute('/foo', rule)
  const match2 = matchRoute('/bar', rule)

  t.truthy(match1)
  t.deepEqual(match1.params, {})

  t.false(match2)
})

test('Match route with one param', t => {
  const rule = '/foo/:id'

  const match1 = matchRoute('/foo/bar', rule)
  const match2 = matchRoute('/bar/foo', rule)

  t.truthy(match1)
  t.deepEqual(match1.params, { id: 'bar' })

  t.false(match2)
})

test('Match route with multiple params', t => {
  const rule = '/foo/:id/:name'

  const match1 = matchRoute('/foo/bar/lol', rule)
  const match2 = matchRoute('/foo/bar', rule)

  t.truthy(match1)
  t.deepEqual(match1.params, { id: 'bar', name: 'lol' })

  t.false(match2)
})
