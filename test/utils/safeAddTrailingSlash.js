import test from 'ava'
import safeAddTrailingSlash from '../../utils/safeAddTrailingSlash'

test('safeAddTrailingSlash with no slash', t => {
  t.is(safeAddTrailingSlash('foo'), '/foo')
})

test('safeAddTrailingSlash with a slash', t => {
  t.is(safeAddTrailingSlash('/foo'), '/foo')
})

test('safeAddTrailingSlash with a number', t => {
  const error = t.throws(() => {
    safeAddTrailingSlash(2)
  })

  t.is(error.message, 'str should be a string and is a number')
})

test('safeAddTrailingSlash with nothing', t => {
  t.is(safeAddTrailingSlash(), '/')
})
