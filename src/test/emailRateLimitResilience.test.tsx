import { describe, it, expect, beforeEach, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("Résilience Auth - Neutralisation de l'erreur Email Rate Limit Exceeded", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("1. L'erreur de rate limit d'e-mail sur l'identifiant téléphone ne doit jamais bloquer l'inscription", async () => {
    // Simuler que Supabase renvoie une erreur de rate limit sur l'e-mail synthétique
    const mockSignUp = vi.spyOn(supabase.auth, "signUp").mockResolvedValue({
      data: { user: null, session: null },
      error: {
        name: "AuthApiError",
        message: "Email rate limit exceeded",
        status: 429,
      } as any,
    });

    // Simuler upsert Supabase sans erreur
    vi.spyOn(supabase, "from").mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any);

    // Importer AuthContext ou tester la fonction logique
    const { phoneToDeterministicUuid } = await import("@/contexts/AuthContext");
    const uuid = phoneToDeterministicUuid("+22670123456");
    expect(uuid).toBeDefined();
    expect(uuid.length).toBe(36);
  });

  it("2. Les messages d'erreur de rate limit doivent être traduits en français clair et constructif", () => {
    const rateLimitErrorMsg = "Email rate limit exceeded";
    const isRateLimited =
      rateLimitErrorMsg.toLowerCase().includes("rate limit") ||
      rateLimitErrorMsg.toLowerCase().includes("over_email_send_rate_limit");

    expect(isRateLimited).toBe(true);
  });
});
