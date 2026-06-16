const globalVersionStore = globalThis as typeof globalThis & {
  __sonatelAppRuntimeVersion__?: string;
};

function resolveRuntimeVersion() {
  return process.env.NEXT_PUBLIC_APP_BUILD_ID?.trim() || "development";
}

export const APP_RUNTIME_VERSION =
  globalVersionStore.__sonatelAppRuntimeVersion__ ??
  (globalVersionStore.__sonatelAppRuntimeVersion__ = resolveRuntimeVersion());
