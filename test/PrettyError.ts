import { test } from 'tap'

import PrettyError from '../src/prettyError'
import { defaultStyle } from '../src/config'

const isFormatted = error =>
  error.stack.indexOf(`  \u001b[0m\u001b[97m\u001b[41m`) === 0

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

test('PrettyError cases', () => {
  test('constructor works', test => {
    const prettyError = new PrettyError()
    test.ok(
      prettyError instanceof PrettyError,
      'Instance should be created',
    )
    test.end()
  })
  test('getObject returns an object', test => {
    const prettyError = new PrettyError()
    const object = prettyError.getObject('hello')
    test.type(object, 'object', 'item should be an object')
    test.end()
  })
  test('instance uses the default style and is changed through appending styles to it', test => {
    const prettyError = new PrettyError()

    test.same(
      prettyError.getStyle(),
      defaultStyle,
      'Default styles should match',
    )

    prettyError.appendStyle({
      '.selector': {
        display: 'block',
      },
    })

    test.notSame(
      prettyError.getStyle(),
      defaultStyle,
      'styles should not match after the appending part',
    )

    test.end()
  })
  test('render() shows styled outputs', test => {
    const prettyError = new PrettyError()

    prettyError.skipNodeFiles()
    prettyError.appendStyle({
      'pretty-error': {
        marginLeft: 4,
      },
    })

    let errorObject = error(() => test.same('a', 'b'))
    let output = prettyError.render(error, false)
    console.log('First: ', output)

    errorObject = error(() => test.equal('a', 'b'))
    output = prettyError.render(error, false)
    console.log('Second: ', output)

    // @ts-ignore
    errorObject = error(() => Array.split(Object))
    output = prettyError.render(error, false)
    console.log('Third:', prettyError.render(output))

    errorObject = 'Plain error message'
    output = prettyError.render(errorObject, false)
    console.log('Fourth: ', output)

    errorObject = {
      message: 'Custom error message',
      kind: 'Custom Error',
    }
    output = prettyError.render(errorObject, false)
    console.log('Fifth: ', output)

    errorObject = {
      message: 'Error with custom stack',
      stack: ['line one', 'line two'],
      wrapper: 'UnhandledRejection',
    }
    output = prettyError.render(errorObject, false)
    console.log('Sixth: ', output)

    // @ts-ignore
    errorObject = error(() => PrettyError.someNonExistingFunction())
    output = prettyError.render(errorObject, false)
    console.log('Seventh: ', output)

    test.end()
  })
  test('render() shows uncolored outputs', test => {
    const prettyError = new PrettyError()
    prettyError.withoutColors()
    prettyError.skipNodeFiles()
    prettyError.appendStyle({
      'pretty-error': {
        marginLeft: 4,
      },
    })

    const errorObject = error(() => test.equal('a', 'b'))
    const output = prettyError.render(errorObject, false)
    console.log('Eighth: ', output)

    test.end()
  })
  test('start() throws unformatted errors when not started', test => {
    const error = new Error('foo bar')
    const formatted = isFormatted(error)

    test.equal('formatted', false)

    test.end()
  })
})
