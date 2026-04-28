import { replaceBrowserStoreSnapshot } from "@/lib/browserStore";

export function resetBrowserStore() {
  replaceBrowserStoreSnapshot({});
}
