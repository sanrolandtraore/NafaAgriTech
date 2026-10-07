import { describe, it, expect, beforeEach, vi } from "vitest";
import { 
  syncAllDatastores, 
  computeGlobalPendingCount, 
  broadcastDataChange,
  notifyAppOfUpdate,
  getUniversalSyncSummary,
  onUniversalSyncChange 
} from "@/lib/universalSyncEngine";
import { db, saveOfflineRecord } from "@/lib/dexieDb";

describe("NAFA - AGRITECH : Système Universel de Synchronisation Partout", () => {
  beforeEach(async () => {
    try {
      await db.offlineRecords.clear();
      await db.cachedEntities.clear();
    } catch (_e) {}
  });

  it("calcule correctement le total cumulé des éléments en attente sur l'ensemble des datastores", async () => {
    // Insérer un record Dexie en attente
    await saveOfflineRecord(
      "client_visits",
      "insert",
      { clientName: "Ferme du Kou", notes: "Inspection phytosanitaire" },
      "tech-01"
    );

    const counts = await computeGlobalPendingCount();
    expect(counts.totalPending).toBeGreaterThanOrEqual(1);
    expect(counts.dexiePending).toBeGreaterThanOrEqual(1);
  });

  it("notifie l'application via les événements personnalisés nafa:sync-completed et nafa:data-updated", () => {
    let syncCompletedFired = false;
    let dataUpdatedFired = false;

    const onSync = () => { syncCompletedFired = true; };
    const onData = () => { dataUpdatedFired = true; };

    window.addEventListener("nafa:sync-completed", onSync);
    window.addEventListener("nafa:data-updated", onData);

    notifyAppOfUpdate("farms");

    expect(syncCompletedFired).toBe(true);
    expect(dataUpdatedFired).toBe(true);

    window.removeEventListener("nafa:sync-completed", onSync);
    window.removeEventListener("nafa:data-updated", onData);
  });

  it("diffuse les modifications via broadcastDataChange", () => {
    let notifiedTable = "";
    const onData = (e: any) => {
      notifiedTable = e.detail?.table || "";
    };

    window.addEventListener("nafa:data-updated", onData);

    broadcastDataChange("parcels", { id: "p1", name: "Parcelle Nord" });

    expect(notifiedTable).toBe("parcels");

    window.removeEventListener("nafa:data-updated", onData);
  });

  it("permet de souscrire de façon réactive au statut de synchronisation universelle", () => {
    let receivedSummary: any = null;
    const unsub = onUniversalSyncChange((summary) => {
      receivedSummary = summary;
    });

    expect(receivedSummary).toBeDefined();
    expect(receivedSummary.details).toBeDefined();
    expect(["idle", "syncing", "synced", "error", "offline"]).toContain(receivedSummary.status);

    unsub();
  });

  it("exécute syncAllDatastores sans planter même en environnement hors ligne ou déconnecté", async () => {
    const res = await syncAllDatastores({ silent: true });
    expect(res).toBeDefined();
    expect(typeof res.synced).toBe("number");
    expect(typeof res.failed).toBe("number");

    const summary = getUniversalSyncSummary();
    expect(summary).toBeDefined();
  });
});
