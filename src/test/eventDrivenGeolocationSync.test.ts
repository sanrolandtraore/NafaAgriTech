import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { nafaEventBus } from "@/services/eventBus";
import { userGeolocationService, UserLocationState } from "@/services/userGeolocationService";
import { businessEngineSyncService } from "@/services/businessEngineSyncService";
import { triggerRealtimeEngineSyncOnLogin } from "@/contexts/AuthContext";

describe("Event-Driven Architecture — Geolocation & Business Engine Realtime Sync", () => {
  beforeEach(() => {
    nafaEventBus.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. NafaEventBus Core", () => {
    it("should subscribe, emit, and receive events with payload", () => {
      const handler = vi.fn();
      const unsubscribe = nafaEventBus.on("location:detected", handler);

      const mockPayload = { latitude: 12.37, longitude: -1.52, city: "Ouagadougou" };
      nafaEventBus.emit("location:detected", mockPayload);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(mockPayload);
      expect(nafaEventBus.getLastPayload("location:detected")).toEqual(mockPayload);

      unsubscribe();
      nafaEventBus.emit("location:detected", { ...mockPayload, city: "Bobo" });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle 'once' listener correctly", () => {
      const handler = vi.fn();
      nafaEventBus.once("auth:login", handler);

      nafaEventBus.emit("auth:login", { userId: "user-1", role: "producer" });
      nafaEventBus.emit("auth:login", { userId: "user-2", role: "agronomist" });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ userId: "user-1", role: "producer" });
    });
  });

  describe("2. User Geolocation Service (Browser GPS & IP Fallback)", () => {
    it("should detect precise position via HTML5 navigator.geolocation when allowed", async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 11.1783,
              longitude: -4.2974,
              altitude: 350,
              accuracy: 15,
            },
            timestamp: Date.now(),
          });
        }),
      };

      vi.stubGlobal("navigator", {
        ...globalThis.navigator,
        geolocation: mockGeolocation,
      });

      const location = await userGeolocationService.detectLocationAtLogin();

      expect(location).toBeDefined();
      expect(location.method).toBe("browser_gps");
      expect(location.latitude).toBeCloseTo(11.1783, 3);
      expect(location.longitude).toBeCloseTo(-4.2974, 3);
      expect(location.accuracyM).toBe(15);
      expect(location.isApproximate).toBe(false);
      expect(location.province).toBe("Houet");
      expect(location.nearestToponym).toBeDefined();
    });

    it("should fall back gracefully to IP lookup or default toponym when GPS is rejected", async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((_success, error) => {
          error({
            code: 1, // PERMISSION_DENIED
            message: "User denied Geolocation",
          });
        }),
      };

      vi.stubGlobal("navigator", {
        ...globalThis.navigator,
        geolocation: mockGeolocation,
      });

      vi.stubGlobal("fetch", vi.fn(async (url: string) => {
        if (url.includes("ipapi.co")) {
          return {
            ok: true,
            json: async () => ({
              latitude: 12.3686,
              longitude: -1.5275,
              city: "Ouagadougou",
              region: "Centre",
              country_name: "Burkina Faso",
              ip: "102.164.20.1",
            }),
          };
        }
        return { ok: false };
      }));

      const location = await userGeolocationService.detectLocationAtLogin();

      expect(location).toBeDefined();
      expect(location.method).toBe("ip_lookup");
      expect(location.city).toBe("Ouagadougou");
      expect(location.country).toBe("Burkina Faso");
      expect(location.isApproximate).toBe(true);
      expect(location.ipAddress).toBe("102.164.20.1");
    });
  });

  describe("3. Business Engine Synchronization (FAO-56, Regional Agro Context, Alerts)", () => {
    it("should compute localized agro-climatic context and emit 'engine:sync_completed'", async () => {
      const syncCompletedSpy = vi.fn();
      nafaEventBus.on("engine:sync_completed", syncCompletedSpy);

      const mockLocation: UserLocationState = {
        latitude: 11.5,
        longitude: -0.5, // Bagré pole area / Centre-Est
        accuracyM: 25,
        method: "browser_gps",
        city: "Bagré",
        province: "Boulgou",
        region: "Centre-Est",
        country: "Burkina Faso",
        detectedAt: new Date().toISOString(),
        isApproximate: false,
      };

      const context = await businessEngineSyncService.syncEngineWithLocation(mockLocation);

      expect(context).toBeDefined();
      expect(context.location.city).toBe("Bagré");
      expect(context.agroZone).toBeDefined();
      // ETo should be computed via FAO-56 Penman-Monteith (typically 4.0 - 8.0 mm/jour in Sahel)
      expect(context.climate.fao56EToMmDay).toBeGreaterThan(3.5);
      expect(context.climate.fao56EToMmDay).toBeLessThan(9.5);
      expect(context.climate.season).toBeDefined();
      expect(context.phytosanitaryAlerts.length).toBeGreaterThan(0);
      expect(context.veterinaryAlerts.length).toBeGreaterThan(0);
      expect(context.marketplaceLogisticsFactor).toBeGreaterThan(0);

      expect(syncCompletedSpy).toHaveBeenCalledTimes(1);
      expect(syncCompletedSpy).toHaveBeenCalledWith(context);
    });

    it("should trigger engine synchronization automatically upon triggerRealtimeEngineSyncOnLogin", async () => {
      const syncStartedSpy = vi.fn();
      const syncCompletedSpy = vi.fn();
      const authLoginSpy = vi.fn();

      nafaEventBus.on("engine:sync_started", syncStartedSpy);
      nafaEventBus.on("engine:sync_completed", syncCompletedSpy);
      nafaEventBus.on("auth:login", authLoginSpy);

      // Mock navigator geolocation
      vi.stubGlobal("navigator", {
        ...globalThis.navigator,
        geolocation: {
          getCurrentPosition: (success: any) => {
            success({
              coords: { latitude: 12.37, longitude: -1.52, accuracy: 20 },
              timestamp: Date.now(),
            });
          },
        },
      });

      triggerRealtimeEngineSyncOnLogin("agri-42", "producer");

      // Wait a tick for async chains
      await new Promise((r) => setTimeout(r, 100));

      expect(authLoginSpy).toHaveBeenCalledTimes(1);
      expect(syncStartedSpy).toHaveBeenCalled();
      expect(syncCompletedSpy).toHaveBeenCalled();

      const lastContext = businessEngineSyncService.getCurrentContext();
      expect(lastContext).not.toBeNull();
      expect(lastContext?.location.city).toBeDefined();
    });
  });
});
