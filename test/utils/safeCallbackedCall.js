import test from 'ava'
import safeCallbackedCall from '../../utils/safeCallbackedCall'

test('Wrong callback type throws an error', t => {
  const message = 'The callback param should be a function'
  const error1 = t.throws(() => {
    safeCallbackedCall({}, 'foo')
  })
  const error2 = t.throws(() => {
    safeCallbackedCall({}, 'foo', 2)
  })
  const error3 = t.throws(() => {
    safeCallbackedCall({}, 'foo', 'bar')
  })
  t.is(error1.message, message)
  t.is(error2.message, message)
  t.is(error3.message, message)
})

test.cb('calling sync function', t => {
  const subject = {
    foo: callback => {
      callback()
    }
  }
  safeCallbackedCall(subject, 'foo', t.end)
})

test.cb('calling async function', t => {
  const subject = {
    foo: callback => {
      setTimeout(callback, 10)
    }
  }
  safeCallbackedCall(subject, 'foo', t.end)
})

test.cb(
  'calling non existing function results to direct call of callbacks',
  t => {
    safeCallbackedCall({}, 'foo', t.end)
  }
)
