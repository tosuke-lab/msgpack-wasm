export class Stack<T> {
  private _intenal: T[]
  private _pointer: number = -1

  constructor(size: number = 0) {
    this._intenal = new Array(size)
  }

  get top(): T | undefined {
    return this._intenal[this._pointer]
  }

  get empty(): boolean {
    return this._pointer === -1
  }

  push(value: T): void {
    this._pointer++
    if (this._intenal.length > this._pointer) {
      this._intenal[this._pointer] = value
    } else {
      this._intenal.push(value)
    }
  }

  pop(): T | undefined {
    return this._intenal[this._pointer--]
  }

  clear(): void {
    this._pointer = -1
  }
}