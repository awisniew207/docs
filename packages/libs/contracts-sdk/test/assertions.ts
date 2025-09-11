// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function expectAssertArray(value: any): asserts value is [] {
  expect(value).toBeInstanceOf(Array);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function expectAssertObject(value: any): asserts value is object {
  expect(value).toBeInstanceOf(Object);
}

/**
 * Safely checks if a result has an error
 * This is used to fix TypeScript errors related to the optional isError property
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasError(result: any): boolean {
  return result && 'error' in result;
}
