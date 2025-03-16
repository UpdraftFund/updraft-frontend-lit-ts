// Type definitions for Web Test Runner and @open-wc/testing

declare global {
  // Mocha test functions
  function describe(name: string, fn: () => void): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function before(fn: () => void): void;
  function after(fn: () => void): void;
  
  // Chai assertions
  namespace Chai {
    interface Assertion {
      // Add any custom assertions used in tests
      equal: (value: any) => Assertion;
      true: Assertion;
      false: Assertion;
      undefined: Assertion;
      null: Assertion;
      deep: Assertion;
      include: (value: any) => Assertion;
      length: (value: number) => Assertion;
    }
  }
}

// This empty export is needed to make TypeScript treat this as a module
export {};
