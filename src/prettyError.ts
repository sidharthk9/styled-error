import merge from 'deepmerge'
import renderKid from 'renderkid'
import ParsedError from './parsedError'
import { modulesList, defaultStyle } from './config'
import { isEmpty, spliceElements } from './utils'
import { Callback, ConfigOptions } from './types'

export default class PrettyError {
  static instance: any

  private useColors: boolean
  private maxItems: number
  private packagesToSkip: string[]
  private pathsToSkip: string[]
  private skipCallbacks: Callback[]
  private filterCallbacks: Callback[]
  private parsedErrorFilters: any[]
  private aliases: any[]
  private style: any
  private renderer: any

  private currentTracingType:
    | ((error: Error, frames: NodeJS.CallSite[]) => any)
    | undefined

  private static filters = {
    'module.exports': function (item: Record<any, any>) {
      if (item.what == null) {
        return
      }
      item.what = item.what.replace(/\.module\.exports\./g, ' - ')
    },
  }

  static getDefaultStyle() {
    return defaultStyle
  }

  static start() {
    let instance = PrettyError.instance
    if (!instance) {
      instance = new PrettyError()
      instance.start()
    }

    return instance
  }

  static stop() {
    const instance = PrettyError.instance
    //TODO: look into this more.
    if (instance) {
      return instance.stop()
    }
    //TODO: used to be void(0). Is there a cleaner way?
    return undefined
  }

  constructor() {
    this.useColors = true
    this.maxItems = 50
    this.packagesToSkip = []
    this.pathsToSkip = []
    this.skipCallbacks = []
    this.filterCallbacks = []
    this.parsedErrorFilters = []
    this.aliases = []

    this.renderer = new renderKid()
    this.style = PrettyError.getDefaultStyle()

    this.currentTracingType = undefined
  }

  start() {
    this.currentTracingType = Error.prepareStackTrace

    const prepareTrace = (
      error: Error,
      frames: NodeJS.CallSite[],
    ): string => {
      let result = error.toString()
      const formattedFrames = frames
        .map(frame => `  at ${frame.toString()}`)
        .join('\n')

      result += '\n' + formattedFrames

      return result
    }

    Error.prepareStackTrace = (error, frames) => {
      const stack = prepareTrace(...[error, frames])

      const errorEvent = {
        stack,
        message: error.toString().replace(/^.*: /, ''),
      }
      this.render(errorEvent, false)
    }
  }

  stop() {
    this.currentTracingType = undefined
    Error.prepareStackTrace = this.currentTracingType
  }

  private applyConfigOption(
    optionName: keyof ConfigOptions,
    value: boolean | string[] | Callback[] | undefined,
  ) {
    switch (optionName) {
      case 'skipPackages':
        if (Array.isArray(value)) {
          if (value.every(item => typeof item === 'string'))
            //@ts-ignore
            this.skipPackages(...value)
        } else if (value === false) {
          this.unSkipAllPackages()
        }
        break
      case 'skipPaths':
        if (Array.isArray(value)) {
          //@ts-ignore
          this.skipPath(...value)
        } else if (value === false) {
          this.unSkipAllPaths()
        }
        break
      case 'skip':
        if (Array.isArray(value)) {
          //@ts-ignore
          this.skip(...value)
        } else if (value === false) {
          this.unskipAll()
        }
        break
      case 'maxItems':
        if (typeof value === 'number') {
          this.setMaxItems(value)
        }
        break
      case 'skipNodeFiles':
        if (value === true) {
          this.skipNodeFiles()
        } else if (value === false) {
          this.unskipNodeFiles()
        }
        break
      case 'filters':
        if (Array.isArray(value)) {
          //@ts-ignore
          this.filter(...value)
        } else if (value === false) {
          this.removeAllFilters()
        }
        break
      case 'parsedErrorFilters':
        if (Array.isArray(value)) {
          //@ts-ignore
          this.filterParsedError(...value)
        } else if (value === false) {
          this.removeAllParsedErrorFilters()
        }
        break
      case 'aliases':
        //@ts-ignore
        if (typeof value === 'object' && value instanceof Callback) {
          for (const path in value) {
            const alias = value[path]
            //@ts-ignore
            this.alias(path, alias)
          }
        } else if (value === false) {
          this.removeAllAliases()
        }
        break
      default:
        break
    }
  }

  config(options: Partial<ConfigOptions>) {
    for (const [field, value] of Object.entries(options)) {
      this.applyConfigOption(field as keyof ConfigOptions, value)
    }
  }

  withoutColors() {
    this.useColors = false
  }

  withColors() {
    this.useColors = true
  }

  skipPackages(...packages: string[]) {
    if (isEmpty(packages)) return

    this.packagesToSkip.push(...packages)
  }

  unskipPackage(...packages: string[]) {
    if (isEmpty(packages)) return

    spliceElements(this.packagesToSkip, packages)
  }

  unSkipAllPackages() {
    this.packagesToSkip.length = 0
  }

  skipPath(...paths: string[]) {
    if (isEmpty(paths)) return

    this.pathsToSkip.push(...paths)
  }

  unskipPath(...paths: string[]) {
    if (isEmpty(paths)) return

    spliceElements(this.pathsToSkip, paths)
  }

  unSkipAllPaths() {
    this.pathsToSkip.length = 0
  }

  skip(...callbacks: Callback[]) {
    if (isEmpty(callbacks)) return

    this.skipCallbacks.push(...callbacks)
  }

  unskip(...callbacks: Callback[]) {
    if (isEmpty(callbacks)) return

    spliceElements(this.skipCallbacks, callbacks)
  }

  unskipAll() {
    this.skipCallbacks.length = 0
  }

  //Do the names change with node versions?
  skipNodeFiles() {
    this.skipPath(...modulesList)
  }

  //Do the names change with node versions?
  unskipNodeFiles() {
    this.unskipPath(...modulesList)
  }

  filter(...callbacks: Callback[]) {
    this.filterCallbacks.push(...callbacks)
  }

  removeFilter(...callbacks: Callback[]) {
    if (isEmpty(callbacks)) return

    spliceElements(this.filterCallbacks, callbacks)
  }

  removeAllFilters() {
    this.filterCallbacks.length = 0
  }

  filterParsedError(...callbacks: Callback[]) {
    this.parsedErrorFilters.push(...callbacks)
  }

  removeParsedErrorFilter(...callbacks: Callback[]) {
    if (isEmpty(callbacks)) return

    spliceElements(this.parsedErrorFilters, callbacks)
  }

  removeAllParsedErrorFilters() {
    this.parsedErrorFilters.length = 0
  }

  setMaxItems(maxItems: number) {
    if (typeof maxItems !== 'number' || maxItems < 1) return
    this.maxItems = Math.floor(maxItems)
  }

  alias(expression: string | RegExp, alias: string) {
    this.aliases.push({ expression, alias })
  }

  removeAlias(expression: string | RegExp) {
    spliceElements(this.aliases, [expression])
  }

  removeAllAliases() {
    this.aliases.length = 0
  }

  get getStyle() {
    return this.style
  }

  appendStyle(styleObj: Object) {
    const updatedStyle = merge(this.style, styleObj)
    this.style = updatedStyle
    this.renderer.style(updatedStyle)
  }

  private get getRenderer() {
    return this.renderer
  }

  //TODO: Maybe, move the toBeLogged into a property?
  render(
    error: Error | any,
    toBeLogged = false,
    useColors = this.useColors,
  ) {
    const object = this.getObject(error)

    const renderedError = this.renderer.render(object, useColors)
    if (toBeLogged) {
      console.error(renderedError)
    }
  }

  getObject(error: Error | any) {
    if (!(error instanceof ParsedError)) {
      error = new ParsedError(error)
    }

    this.applyParsedErrorFiltersOn(error)
    const title: Record<string, any> = {}
    if (error.wrapper !== '') {
      title.wrapper = `${error.wrapper}`
    }
    title.kind = error.kind
    const header = {
      title,
      colon: ':',
      message: String(error.message).trim(),
    }
    const traceItems: any[] = []
    let count = -1

    for (const [index, item] of Object.entries(error.trace)) {
      if (item == null) {
        continue
      }
      if (this.skipOrFilter(item, Number(index)) === true) {
        continue
      }
      count += 1
      if (count > this.maxItems) {
        break
      }
      if (typeof item === 'string') {
        traceItems.push({
          item: {
            custom: item,
          },
        })
        continue
      }

      let pointer
      //@ts-ignore
      if (item.file == null) {
        pointer = ''
      } else {
        pointer = {
          //@ts-ignore
          file: item.file,
          colon: ':',
          //@ts-ignore
          line: item.line,
        }
      }
      let footer = {
        //@ts-ignore
        addr: item.shortenedAddr,
      }
      //@ts-ignore
      if (item.extra != null) {
        //@ts-ignore
        footer.extra = item.extra
      }

      const markupItem = {
        item: {
          header: {
            pointer,
          },
          footer,
        },
      }

      //@ts-ignore
      if (typeof item.what === 'string' && item.what.trim().length > 0) {
        //@ts-ignore
        markupItem.item.header.what = item.what
      }

      traceItems.push(markupItem)
    }

    const object = {
      'pretty-error': {
        header,
        ...(!isEmpty(traceItems) && { trace: traceItems }),
      },
    }

    return object
  }

  private skipOrFilter(item: Record<string, any>, itemNumber: number) {
    if (typeof item === 'object') {
      if (
        item.hasOwnProperty('modName') &&
        this.packagesToSkip.includes(item?.modName)
      ) {
        return true
      }

      if (
        item.hasOwnProperty('path') &&
        this.pathsToSkip.includes(item?.path)
      ) {
        return true
      }

      if (item.hasOwnProperty('packages')) {
        for (const name of item.packages) {
          if (this.packagesToSkip.includes(name)) {
            return true
          }
        }
      }

      if (
        item.hasOwnProperty('shortenedAddr') &&
        typeof item?.shortenedAddr === 'string'
      ) {
        for (const { expression, alias } of this.aliases) {
          item.shortenedAddr = item.shortenedAddr.replace(
            expression,
            alias,
          )
        }
      }
    }

    for (const func of this.skipCallbacks) {
      let result = func(item, itemNumber)
      if (result === true) {
        return true
      }
    }

    for (const func of this.filterCallbacks) {
      func(item, itemNumber)
    }

    return false
  }

  private applyParsedErrorFiltersOn(error: any) {
    for (const func of this.parsedErrorFilters) {
      func(error)
    }
  }
}
