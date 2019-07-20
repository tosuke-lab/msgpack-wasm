export interface MessagePackSerde<T> {
  getResult(): T
  clear(): void
  addValue(value: unknown): void
  enterArray(size: number): void
  enterMap(size: number): void
}