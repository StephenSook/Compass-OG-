// Ambient redirect: TS5.6 with moduleResolution: node10 ignores the SDK's
// `exports` field. This module declaration re-exports from the explicit
// CommonJS subpath so consumers can write `from "@0glabs/0g-ts-sdk"`.
declare module "@0glabs/0g-ts-sdk" {
  export * from "@0glabs/0g-ts-sdk/lib.commonjs/index.js";
}
