import { disableElectronRuntime, isElectronRuntime, shouldFallbackToBrowserStore } from "@/lib/runtime";

export async function withDataFallback<T>(
  browserAction: () => T | Promise<T>,
  electronAction: () => Promise<T>
): Promise<T> {
  if (!isElectronRuntime) {
    return await browserAction();
  }

  try {
    return await electronAction();
  } catch (error) {
    if (!shouldFallbackToBrowserStore(error)) {
      throw error;
    }

    disableElectronRuntime(error);
    return await browserAction();
  }
}
