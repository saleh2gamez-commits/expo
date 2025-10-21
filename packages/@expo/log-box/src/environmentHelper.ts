export function setupExpoDomHostOsPolyfill() {
  globalThis.process = globalThis.process || {};
  globalThis.process.env.EXPO_DOM_HOST_OS ??= process.env.EXPO_OS;
}

export function useEnvironmentVariablesPolyfill({
  devServerUrl,
  platform,
}: {
  devServerUrl?: string;
  platform?: string;
}) {
  globalThis.process = globalThis.process || {};
  globalThis.process.env.EXPO_DEV_SERVER_ORIGIN ??= devServerUrl;
  globalThis.process.env.EXPO_DOM_HOST_OS ??= platform;
}
