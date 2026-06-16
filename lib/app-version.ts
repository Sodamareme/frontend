const globalVersionStore = globalThis as typeof globalThis & {
  __sonatelAppRuntimeVersion__?: string;
};

function createRuntimeVersion() {
  const configuredVersion = process.env.NEXT_PUBLIC_APP_BUILD_ID?.trim();

  if (configuredVersion) {
    return configuredVersion;
  }

  return `${Date.now()}`;
}

export const APP_RUNTIME_VERSION =
  globalVersionStore.__sonatelAppRuntimeVersion__ ??
  (globalVersionStore.__sonatelAppRuntimeVersion__ = createRuntimeVersion());
