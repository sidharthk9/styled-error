export type Callback = (
  traceLine: Object | any,
  lineNumber: number,
) => boolean

export interface ConfigOptions {
  skipPackages?: boolean | string[]
  skipPaths?: boolean | string[]
  skip?: boolean | Callback | Callback[]
  maxItems?: number
  skipNodeFiles?: boolean | any
  filters?: boolean | Callback | Callback[]
  parsedErrorFilters?: boolean | Callback | Callback[]
  aliases?: boolean | Object
}
