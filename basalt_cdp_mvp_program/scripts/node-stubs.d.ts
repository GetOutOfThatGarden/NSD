// Minimal stubs to satisfy TypeScript when @types/node isn't installed
// These cover built-in modules used by our scripts and the global process.

declare module 'fs' {
  const anyFs: any;
  export = anyFs;
}

declare module 'os' {
  const anyOs: any;
  export = anyOs;
}

declare module 'path' {
  const anyPath: any;
  export = anyPath;
}

declare module 'node:fs' {
  const anyFs: any;
  export = anyFs;
}

declare module 'node:os' {
  const anyOs: any;
  export = anyOs;
}

declare module 'node:path' {
  const anyPath: any;
  export = anyPath;
}

declare var process: any;

// Ambient module declarations to unblock TS while dependencies install