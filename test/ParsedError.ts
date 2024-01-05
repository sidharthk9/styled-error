import { test } from 'tap'

import ParsedError from '../src/parsedError'

const error = item => {
  if (typeof item === 'string') {
    return error(() => {
      throw Error(item)
    })
  } else if (item instanceof Function) {
    try {
      item()
    } catch (error) {
      return error
    }
  } else {
    throw Error('bad argument for error')
  }
}

test('ParsedError cases', () => {
  test('constructor accepts Error() instances ', test => {
    const errorObject = error(() => {
      throw Error('a message')
    })
    test.doesNotThrow(() => new ParsedError(errorObject))

    test.end()
  })
  test('constructor accepts ReferenceError() instances', test => {
    const errorObject = error(() => {
      throw ReferenceError('a message')
    })
    test.doesNotThrow(() => new ParsedError(errorObject))

    test.end()
  })
  test('constructor accepts non errors', test => {
    test.doesNotThrow(() => new ParsedError('a string'))

    test.end()
  })
  test('parsed message matches the initial message', test => {
    const errorObject = error('a string')
    const parsed = new ParsedError(errorObject)
    test.equal(parsed.message, 'a string')

    test.end()
  })
  test('parsed multiline message matches the initial message', test => {
    const message = 'first line \n second line \n third line'
    const errorObject = error(message)
    const parsed = new ParsedError(errorObject)
    test.equal(parsed.message, message)

    test.end()
  })
  test('type returns the initial error type', test => {
    //@ts-ignore
    const errorObject = error(() => (a.b = c))
    const parsed = new ParsedError(errorObject)

    test.equal(parsed.message, 'not_defined')
  })
})
