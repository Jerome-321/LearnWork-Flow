import { SyncService } from "./syncService";
import { Capacitor } from "@capacitor/core";

export class AndroidSyncService {
  private static initialized = false;
  private static getAccessToken: (() => string | null) | null = null;

  /**
   * Initialize Android sync listeners
   * @param getAccessToken Function to retrieve the current access token
   */
  static initialize(getAccessToken: () => string | null): void {
    if (this.initialized) return;
    
    // Only run on Android platform
    if (Capacitor.getPlatform() !== "android") {
      console.log("AndroidSyncService: Not on Android platform, skipping initialization");
      return;
    }

    this.getAccessToken = getAccessToken;
    this.setupEventListeners();
    this.initialized = true;
    console.log("AndroidSyncService: Initialized");
  }

  private static setupEventListeners(): void {
    // Listen for background sync events from Android WorkManager
    window.addEventListener("android-background-sync", () => {
      console.log("AndroidSyncService: Background sync triggered");
      this.performSync("background");
    });

    // Listen for foreground sync events (when app comes to foreground)
    window.addEventListener("android-foreground-sync", () => {
      console.log("AndroidSyncService: Foreground sync triggered");
      this.performSync("foreground");
    });

    // Listen for network connectivity changes
    window.addEventListener("online", () => {
      console.log("AndroidSyncService: Network online, triggering sync");
      this.performSync("network-online");
    });
  }

  private static async performSync(trigger: string): Promise<void> {
    if (!this.getAccessToken) {
      console.warn("AndroidSyncService: No access token provider configured");
      return;
    }

    const token = this.getAccessToken();
    if (!token) {
      console.warn("AndroidSyncService: No access token available");
      return;
    }

    try {
      console.log(`AndroidSyncService: Starting sync (trigger: ${trigger})`);
      const result = await SyncService.syncWithBackend(this.getAccessToken);
      
      if (result.success) {
        console.log(
          `AndroidSyncService: Sync completed - ${result.synced} synced, ${result.failed} failed`
        );
      } else {
        console.warn("AndroidSyncService: Sync failed");
      }
    } catch (error) {
      console.error("AndroidSyncService: Sync error:", error);
    }
  }

  /**
   * Manually trigger a sync (useful for testing or user-initiated sync)
   */
  static async manualSync(): Promise<void> {
    if (!this.getAccessToken) {
      throw new Error("AndroidSyncService not initialized");
    }
    await this.performSync("manual");
  }
}
