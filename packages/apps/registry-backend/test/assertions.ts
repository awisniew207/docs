export function expectAssertArray(value: any): asserts value is [] {
  expect(value).toBeInstanceOf(Array);
}

export function expectAssertObject(value: any): asserts value is object {
  expect(value).toBeInstanceOf(Object);
}
