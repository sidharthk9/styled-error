import { Callback } from './types'

export const isEmpty = (arr: any[]) => Array.isArray(arr) && arr.length < 1

export const spliceElements = <T extends string | Callback>(
  array: T[],
  itemsToRemove: T[],
) => {
  itemsToRemove.forEach(item => {
    let index = array.indexOf(item)
    while (index !== -1) {
      array.splice(index, 1)
      index = array.indexOf(item)
    }
  })
}
