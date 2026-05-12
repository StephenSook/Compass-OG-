// Ambient redirect for the storage SDK: TS5.6 with moduleResolution: node10
// ignores the package's `exports` field. This module declaration re-exports
// from the explicit CommonJS subpath so consumers can write
// `from "@0gfoundation/0g-storage-ts-sdk"`.
declare module "@0gfoundation/0g-storage-ts-sdk" {
  export * from "@0gfoundation/0g-storage-ts-sdk/lib.commonjs/index.js";
}
