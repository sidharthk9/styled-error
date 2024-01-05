import path from 'path'

interface ErrorClasses extends Error {
  // some errors are thrown to display other errors.
  // we call them wrappers here.
  wrapper: string
}

export type ErrorData = {
  original: string
  what: string
  addr: string
  path: string
  dir: string
  file: string
  line: number
  col: number
  jsLine: number
  jsCol: number
  packageName: string
  shortenedPath: string
  shortenedAddr: string
  packages: string[]
}

export default class ParsedError extends Error {
  //Detecting subclasses such as SyntaxError, TypeError
  private kind: string
  private trace: string[] | ErrorData[]

  private wrapper: string

  constructor(error: ErrorClasses | any) {
    super()
    this.name = error.name
    this.message = error.message
    this.cause = error.cause
    this.kind = error.constructor.name
    this.trace = []

    if (error.wrapper !== null) {
      this.wrapper = String(error.wrapper)
    } else {
      this.wrapper = ''
    }

    if (typeof error !== 'object') {
      this.message = String(error)
    } else {
      this.stack = error.stack

      if (typeof this.stack === 'string') {
        //For pattern: Key: Value
        const matches = this.stack.match(/^([a-zA-Z0-9\_\$]+):\ /)?.pop()

        if (matches?.length) {
          this.kind = matches
        }
      }
      this.message = this.message != null ? String(error.message) : ''
    }
    if (typeof this.stack === 'string') this.parseStack()
  }

  private parseStack() {
    let messageLines: string[] = []
    let stackRef = this.stack?.split('\n')
    let reachedTrace = false

    if (stackRef != null) {
      stackRef.forEach(line => {
        if (!line.trim().length) {
          return
        }
        const item = this.parseTraceItem(line)
        //TODO: add guard rails around item for the undefined bit
        if (reachedTrace) {
          //@ts-ignore
          this.trace.push(item)
        } else {
          //For pattern:    at Function File
          const matches = line.match(/^\s*at\s.+/)
          if (matches) {
            reachedTrace = true
            //@ts-ignore
            this.trace.push(item)
          } else if (this.message.indexOf(line) === 0) {
            messageLines.push(line)
          }
        }
      })
    }
    let message = messageLines.join('\n')
    if (message.includes(this.kind)) {
      //TODO: check with debugger
      message = message
        .substring(this.kind.length, message.length)
        .replace(/^\:\s+/, '')
    }

    if (message.length) {
      this.message = [this.message, message].join('\n')
    } else {
      this.message = message
    }
  }
  //TODO: get rid of the undefined bit if possible
  private parseTraceItem(text: string): ErrorData | string {
    text = text.trim()
    if (!text) {
      return ''
    }
    if (!text.includes('at ')) {
      return text
    }
    text = text.replace(/^at /, '')

    if (
      text === 'Error (<anonymous>)' ||
      text === 'Error (<anonymous>:null:null)'
    ) {
      return ''
    }

    const original = text
    // the part that comes before the address
    let precedingAt = '' //OB: what
    // complete address, including path to module and line/col
    let moduleAddress = '' //OB: addr
    // path to module
    let modulePath = '' //OB: path
    // module dir
    let dir = ''
    // module basename
    let file = ''
    // line number. If using a compiler, the line number
    // of the module in that compiler will be used
    let line = ''
    // column, same as above
    let column = '' //OB: col
    // if using a compiler, this will translate to the line number of
    // the js equivalent of that module
    let jsLine = ''
    // like above
    let jsColumn = '' //OB: jsCol
    // path that doesn't include `node_module` dirs
    let shortenedPath = ''
    // like above
    let shortenedAddress = ''
    let packageName = '[current]'
    let packages: string[] = []

    // For Pattern: (path/to/your/file.js:42:15)
    const pathMatch = text.match(/\(([^\)]+)\)$/)?.pop()
    if (pathMatch) {
      moduleAddress = pathMatch.trim()
    }
    if (moduleAddress !== '') {
      precedingAt = text.substring(
        0,
        text.length - moduleAddress.length - 2,
      )
      precedingAt = precedingAt.trim()
    } else {
      moduleAddress = text.trim()
    }
    moduleAddress = this.fixPath(moduleAddress)

    let remaining = moduleAddress
    //For Pattern: message, <js>:42:15
    const filteringMatch = remaining.match(/\,\ <js>:(\d+):(\d+)$/)
    //TODO: use isEmpty later
    if (Array.isArray(filteringMatch) && filteringMatch.length) {
      jsLine = filteringMatch[1]
      jsColumn = filteringMatch[2]
      remaining = remaining.substring(
        0,
        remaining.length - filteringMatch[0].length,
      )
    }

    //For Pattern: message :42:15
    const lineColumnTraceMatch = remaining.match(/:(\d+):(\d+)$/)
    //TODO: use isEmpty later
    if (
      Array.isArray(lineColumnTraceMatch) &&
      lineColumnTraceMatch.length
    ) {
      line = lineColumnTraceMatch[1]
      column = lineColumnTraceMatch[2]
      remaining = remaining.substring(
        0,
        remaining.length - lineColumnTraceMatch[0].length,
      )
      modulePath = remaining
    }

    if (modulePath !== '') {
      file = path.basename(modulePath)
      dir = path.dirname(modulePath)
      if (dir === '.') {
        dir = ''
      }

      modulePath = this.fixPath(modulePath)
      file = this.fixPath(file)
      dir = this.fixPath(dir)
    }

    if (dir !== '') {
      //TODO: consider replacing with fixPath()
      const filteredDir = dir.replace(/[\\]{1,2}/g, '/')
      // For furthest Pattern: node_modules/package-name/
      const nodeModulePathMatch = filteredDir
        .match(/node_modules\/([^\/]+)(?!.*node_modules.*)/)
        ?.pop()
      if (nodeModulePathMatch) {
        packageName = nodeModulePathMatch
      }
    }

    if (jsLine === '') {
      jsLine = line
      jsColumn = column
    }

    if (modulePath !== '') {
      const { path, packages: packageNames } = this.rectifyPath(
        modulePath,
        packageName,
      )
      shortenedPath = path
      shortenedAddress =
        shortenedPath +
        moduleAddress.substring(modulePath.length, moduleAddress.length)
      packages.splice(0, packages.length, ...packageNames)
    }

    return {
      original,
      what: precedingAt,
      addr: moduleAddress,
      path: modulePath,
      dir,
      file,
      line: parseInt(line),
      col: parseInt(column),
      jsLine: parseInt(jsLine),
      jsCol: parseInt(jsColumn),
      packageName,
      shortenedPath,
      shortenedAddr: shortenedAddress,
      packages,
    }
  }

  private fixPath(path: string) {
    return path.replace(/[\\]{1,2}/g, '/')
  }

  private rectifyPath(
    path: string,
    currentPackageName: string,
  ): { path: string; packages: string[] } {
    const includesNodeModulesMatch = path.match(
      /^(.+?)\/node_modules\/(.+)$/,
    )

    const parts: string[] = []
    const packages: string[] = []

    if (!includesNodeModulesMatch?.length) {
      return {
        path: path,
        packages: [],
      }
    }

    if (typeof currentPackageName === 'string') {
      const name = `[${currentPackageName}]`
      parts.push(name)
      packages.push(name)
    } else {
      // For Pattern: node_modules/module-name
      const name = includesNodeModulesMatch[1].match(/([^\/]+)$/)![1]
      parts.push(`[${name}]`)
      packages.push(name)
    }

    let rest = includesNodeModulesMatch[2]
    const innerNodeModulePattern = new RegExp(
      /([^\/]+)\/node_modules\/(.+)$/,
    )
    while (rest.match(innerNodeModulePattern)?.length) {
      const name = rest.match(innerNodeModulePattern)![1]
      parts.push(`[${name}]`)
      packages.push(name)

      rest = rest.match(innerNodeModulePattern)![2]
    }

    // For Pattern: /path/to/some/file.txt
    const filePathPattern = new RegExp(/([^\/]+)\/(.+)$/)
    const pathMatch = rest.match(filePathPattern)
    if (Array.isArray(pathMatch) && pathMatch.length) {
      const name = pathMatch[1]
      parts.push(`[${name}]`)
      packages.push(name)
      rest = name
    }

    parts.push(rest)

    return {
      path: parts.join('/'),
      packages,
    }
  }
}
