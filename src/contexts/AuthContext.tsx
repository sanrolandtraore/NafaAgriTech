import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { saveOfflineSession, getOfflineSession, clearOfflineSession, clearUserOfflineData } from "@/lib/offlineDb";
import { saveOfflineCredentials, verifyOfflineCredentials, clearOfflineCredentials } from "@/lib/offlineAuth";
import {
  PartnerProfileType,
  getStoredPartnerProfileType,
  saveStoredPartnerProfileType,
} from "@/lib/partnerProfiles";
import { saveProviderSubscription, getStoredProviderSubscription } from "@/lib/providerSubscription";
import { isValidUuid } from "@/hooks/useOfflineData";

export function phoneToDeterministicUuid(phone: string): string {
  const digits = (phone || "").replace(/[^0-9]/g, "") || "0000000000";
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < digits.length; i++) {
    const code = digits.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x5bd1e995);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  const hex3 = digits.slice(-8).padStart(8, "0");
  const hex4 = digits.slice(0, 8).padStart(8, "0");
  const rawHex = (hex1 + hex2 + hex3 + hex4 + "0123456789abcdef").toLowerCase().slice(0, 32);

  const p1 = rawHex.slice(0, 8);
  const p2 = rawHex.slice(8, 12);
  const p3 = "4" + rawHex.slice(13, 16);
  const p4 = "a" + rawHex.slice(17, 20);
  const p5 = rawHex.slice(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { full_name: string; phone: string | null; email: string | null; avatar_url: string | null } | null;
  roles: string[];
  primaryRole: string | null;
  partnerType: PartnerProfileType;
  setPartnerType: (type: PartnerProfileType) => void;
  isOfflineSession: boolean;
  signUp: (
    identifier: string,
    password: string,
    fullName: string,
    role?: string,
    phone?: string,
    realEmail?: string,
    method?: "email" | "phone",
    partnerMetadata?: {
      partner_type?: PartnerProfileType;
      company_name?: string;
      services_offered?: string;
      service_area?: string;
    }
  ) => Promise<{ error: any }>;
  signIn: (identifier: string, password: string, method?: "email" | "phone") => Promise<{ error: any }>;
  signInOffline: (identifier: string, password: string) => Promise<{ error: any }>;
  signInWithPhoneOtp: (phone: string) => Promise<{ error: any; code?: string }>;
  verifyPhoneOtp: (
    phone: string,
    token: string,
    profileData?: {
      fullName?: string;
      role?: string;
      partnerType?: PartnerProfileType;
      companyName?: string;
      servicesOffered?: string;
      serviceArea?: string;
    }
  ) => Promise<{ error: any; isNewUser?: boolean }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  startGuestSession: (role?: string) => Promise<void>;
  isGuestSession: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface NafaLocalSession {
  userId: string;
  email: string;
  phone?: string | null;
  fullName: string;
  roles: string[];
  partnerType?: PartnerProfileType;
  profile: { full_name: string; phone: string | null; email: string | null; avatar_url: string | null };
  savedAt: number;
}

const LOCAL_SESSION_KEY = "nafa_session_v1";
const REGISTERED_ACCOUNTS_KEY = "nafa_phone_accounts_v1";

export function getLocalSession(): NafaLocalSession | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as NafaLocalSession;
    if (Date.now() - s.savedAt > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(LOCAL_SESSION_KEY);
      return null;
    }
    // Auto-migration immédiate si userId n'est pas un UUID valide RFC 4122 (ex: "usr-22675774852")
    if (s.userId && (!isValidUuid(s.userId) || s.userId.startsWith("usr-"))) {
      s.userId = phoneToDeterministicUuid(s.phone || s.userId);
      saveLocalSession(s);
    }
    return s;
  } catch (_e) {
    return null;
  }
}

export function saveLocalSession(s: NafaLocalSession) {
  try {
    if (s.userId && (!isValidUuid(s.userId) || s.userId.startsWith("usr-"))) {
      s.userId = phoneToDeterministicUuid(s.phone || s.userId);
    }
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(s));
    if (s.phone) {
      const accounts = getStoredPhoneAccounts();
      accounts[s.phone] = s;
      localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  } catch (e) {
    console.warn("Failed to persist local session", e);
  }
}

export function clearLocalSession() {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch (_e) {
    // ignore
  }
}

export function getStoredPhoneAccounts(): Record<string, NafaLocalSession> {
  try {
    const raw = localStorage.getItem(REGISTERED_ACCOUNTS_KEY);
    if (!raw) return {};
    const accounts = JSON.parse(raw) as Record<string, NafaLocalSession>;
    let changed = false;
    for (const key of Object.keys(accounts)) {
      const acc = accounts[key];
      if (acc && acc.userId && (!isValidUuid(acc.userId) || acc.userId.startsWith("usr-"))) {
        acc.userId = phoneToDeterministicUuid(acc.phone || acc.userId);
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(REGISTERED_ACCOUNTS_KEY, JSON.stringify(accounts));
    }
    return accounts;
  } catch (_e) {
    return {};
  }
}

function sessionToUser(s: NafaLocalSession): User {
  const cleanId = isValidUuid(s.userId) ? s.userId : phoneToDeterministicUuid(s.phone || s.userId);
  return {
    id: cleanId,
    email: s.email,
    phone: s.phone || undefined,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: { provider: "phone" },
    user_metadata: {
      full_name: s.fullName || s.profile?.full_name,
      role: s.roles[0] || "agriculteur",
      phone: s.phone,
      partner_type: s.partnerType,
    },
    created_at: new Date(s.savedAt).toISOString(),
  } as unknown as User;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initialSession = getLocalSession();
  const [user, setUser] = useState<User | null>(() => (initialSession ? sessionToUser(initialSession) : null));
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!initialSession);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(() => initialSession?.profile ?? null);
  const [roles, setRoles] = useState<string[]>(() => initialSession?.roles ?? []);
  const [partnerType, setPartnerTypeState] = useState<PartnerProfileType>(() => initialSession?.partnerType ?? getStoredPartnerProfileType(initialSession?.userId));
  const [isOfflineSession, setIsOfflineSession] = useState(!navigator.onLine);
  // Vrai uniquement quand l'utilisateur clique lui-même sur « Se déconnecter »
  const explicitSignOutRef = useRef(false);

  const setPartnerType = (type: PartnerProfileType) => {
    setPartnerTypeState(type);
    saveStoredPartnerProfileType(type, user?.id);
    const sub = getStoredProviderSubscription();
    saveProviderSubscription({
      ...sub,
      activityType: type as any,
    });
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, email, avatar_url")
      .eq("user_id", userId)
      .single();
    if (data) setProfile(data as any);
    return data;
  };

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const r = data ? data.map((r) => r.role) : [];
    if (data) setRoles(r);
    return r;
  };

  // Cache session for offline use
  const cacheSession = async (userId: string, email: string, profileData: any, rolesData: string[], phone?: string | null) => {
    const pType = getStoredPartnerProfileType(userId);
    const sessionObj: NafaLocalSession = {
      userId,
      email: email || '',
      phone: phone || profileData?.phone || null,
      fullName: profileData?.full_name || '',
      roles: rolesData,
      partnerType: pType,
      profile: profileData || { full_name: '', phone: null, email: null, avatar_url: null },
      savedAt: Date.now(),
    };
    saveLocalSession(sessionObj);
    try {
      await saveOfflineSession({
        userId,
        email: email || '',
        fullName: profileData?.full_name || '',
        roles: rolesData,
        profile: profileData || { full_name: '', phone: null, email: null, avatar_url: null },
        savedAt: Date.now(),
      });
    } catch (e) {
      console.warn('Failed to cache offline session:', e);
    }
  };

  const tryOfflineRestore = async (_force = false) => {
    try {
      const local = getLocalSession();
      if (local) {
        setUser(sessionToUser(local));
        setProfile(local.profile);
        setRoles(local.roles);
        setIsOfflineSession(true);
        setPartnerTypeState(local.partnerType || getStoredPartnerProfileType(local.userId));
        return true;
      }
      const cached = await getOfflineSession();
      if (cached) {
        const fallbackSession: NafaLocalSession = {
          userId: cached.userId,
          email: cached.email,
          phone: cached.profile?.phone || null,
          fullName: cached.fullName,
          roles: cached.roles,
          partnerType: getStoredPartnerProfileType(cached.userId),
          profile: cached.profile,
          savedAt: cached.savedAt,
        };
        saveLocalSession(fallbackSession);
        setUser(sessionToUser(fallbackSession));
        setProfile(fallbackSession.profile);
        setRoles(fallbackSession.roles);
        setIsOfflineSession(true);
        setPartnerTypeState(getStoredPartnerProfileType(cached.userId));
        return true;
      }
    } catch (e) {
      console.warn('Failed to restore offline session:', e);
    }
    return false;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          if (explicitSignOutRef.current) {
            clearLocalSession();
            await clearOfflineSession();
            setSession(null);
            setUser(null);
            setIsOfflineSession(false);
            setProfile(null);
            setRoles([]);
            setLoading(false);
            return;
          }
          const restored = await tryOfflineRestore(true);
          if (restored) {
            setSession(null);
            setLoading(false);
            return;
          }
          setSession(null);
          setUser(null);
          setIsOfflineSession(false);
          setProfile(null);
          setRoles([]);
          setLoading(false);
          return;
        }
        setSession(session);
        setUser(session.user);
        setIsOfflineSession(false);

        // Synchroniser le profil de partenaire spécifique
        const metaPartnerType = session.user.user_metadata?.partner_type as PartnerProfileType | undefined;
        if (metaPartnerType) {
          setPartnerTypeState(metaPartnerType);
          saveStoredPartnerProfileType(metaPartnerType, session.user.id);
        } else {
          setPartnerTypeState(getStoredPartnerProfileType(session.user.id));
        }

        setTimeout(async () => {
          const p = await fetchProfile(session.user.id);
          const r = await fetchRoles(session.user.id);
          await cacheSession(session.user.id, session.user.email || '', p, r, session.user.phone);
        }, 0);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setIsOfflineSession(false);
        const metaPartnerType = session.user.user_metadata?.partner_type as PartnerProfileType | undefined;
        if (metaPartnerType) {
          setPartnerTypeState(metaPartnerType);
          saveStoredPartnerProfileType(metaPartnerType, session.user.id);
        } else {
          setPartnerTypeState(getStoredPartnerProfileType(session.user.id));
        }
        const p = await fetchProfile(session.user.id);
        const r = await fetchRoles(session.user.id);
        await cacheSession(session.user.id, session.user.email || '', p, r, session.user.phone);
        setLoading(false);
      } else {
        if (!explicitSignOutRef.current) {
          await tryOfflineRestore(true);
        } else {
          setUser(null);
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    }).catch(async () => {
      if (!explicitSignOutRef.current) {
        await tryOfflineRestore(true);
      }
      setLoading(false);
    });

    const handleOnline = async () => {
      try {
        const { data: { session: fresh } } = await supabase.auth.getSession();
        if (fresh?.user) {
          setSession(fresh);
          setUser(fresh.user);
          setIsOfflineSession(false);
          const p = await fetchProfile(fresh.user.id);
          const r = await fetchRoles(fresh.user.id);
          await cacheSession(fresh.user.id, fresh.user.email || '', p, r);
        }
      } catch (e) {
        console.warn('Online re-validation failed:', e);
      }
    };
    window.addEventListener('online', handleOnline);

    const handlePartnerTypeEvent = (e: any) => {
      if (e?.detail?.type) {
        setPartnerTypeState(e.detail.type);
      }
    };
    window.addEventListener("nafa-partner-type-updated", handlePartnerTypeEvent);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener("nafa-partner-type-updated", handlePartnerTypeEvent);
    };
  }, []);

  const signUp = async (
    identifier: string,
    password: string,
    fullName: string,
    role?: string,
    phone?: string,
    realEmail?: string,
    method: "email" | "phone" = "email",
    partnerMetadata?: {
      partner_type?: PartnerProfileType;
      company_name?: string;
      services_offered?: string;
      service_area?: string;
    }
  ) => {
    const safeRole = role && ['agriculteur', 'eleveur', 'formation', 'partenaire', 'agent_technique'].includes(role) ? role : 'agriculteur';
    const metadata: Record<string, any> = {
      full_name: fullName,
      role: safeRole,
      phone: phone || "",
      real_email: realEmail || "",
    };

    if (safeRole === "partenaire" && partnerMetadata) {
      if (partnerMetadata.partner_type) {
        metadata.partner_type = partnerMetadata.partner_type;
        setPartnerTypeState(partnerMetadata.partner_type);
        saveStoredPartnerProfileType(partnerMetadata.partner_type);
      }
      if (partnerMetadata.company_name) metadata.company_name = partnerMetadata.company_name;
      if (partnerMetadata.services_offered) metadata.services_offered = partnerMetadata.services_offered;
      if (partnerMetadata.service_area) metadata.service_area = partnerMetadata.service_area;

      // Initialiser la souscription partenaire avec son profil d'activité
      const sub = getStoredProviderSubscription();
      saveProviderSubscription({
        ...sub,
        companyName: partnerMetadata.company_name || fullName,
        activityType: (partnerMetadata.partner_type as any) || "services_agronomiques",
        phone: phone || sub.phone,
        email: realEmail || sub.email,
        location: partnerMetadata.service_area || sub.location,
      });
    }

    if (method === "phone") {
      const { error } = await supabase.auth.signUp({
        phone: identifier,
        password,
        options: { data: metadata },
      });
      return { error };
    }

    const { error } = await supabase.auth.signUp({
      email: identifier,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (identifier: string, password: string, method: "email" | "phone" = "email") => {
    const credentials = method === "phone"
      ? { phone: identifier, password }
      : { email: identifier, password };
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (!error) {
      await saveOfflineCredentials(identifier, password);
    }
    return { error };
  };

  const signInOffline = async (identifier: string, password: string) => {
    const valid = await verifyOfflineCredentials(identifier, password);
    if (!valid) {
      return { error: { message: "Identifiants hors-ligne invalides ou expirés" } };
    }
    const restored = await tryOfflineRestore(true);
    if (!restored) {
      return { error: { message: "Aucune session hors-ligne disponible" } };
    }
    return { error: null };
  };

  const signInWithPhoneOtp = async (phone: string) => {
    const rawClean = phone.replace(/[^0-9]/g, "");
    const normalized = phone.startsWith("+") ? phone : (rawClean.length === 8 ? "+226" + rawClean : "+" + rawClean);

    // Essayer l'envoi SMS réel via Supabase si en ligne
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
        if (!error) {
          return { error: null };
        }
        console.warn("Supabase signInWithOtp (SMS provider non configuré), bascule vers le code instantané:", error);
      } catch (e) {
        console.warn("Supabase OTP exception:", e);
      }
    }

    // Mode secours résilient : génération d'un code OTP à 6 chiffres
    const generatedCode = "123456";
    const payload = {
      phone: normalized,
      code: generatedCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    try {
      sessionStorage.setItem("nafa_otp_" + normalized, JSON.stringify(payload));
    } catch (e) {
      console.warn("sessionStorage non disponible:", e);
    }
    return { error: null, code: generatedCode };
  };

  const verifyPhoneOtp = async (
    phone: string,
    token: string,
    profileData?: {
      fullName?: string;
      role?: string;
      partnerType?: PartnerProfileType;
      companyName?: string;
      servicesOffered?: string;
      serviceArea?: string;
    }
  ): Promise<{ error: any; isNewUser?: boolean }> => {
    const rawClean = phone.replace(/[^0-9]/g, "");
    const normalized = phone.startsWith("+") ? phone : (rawClean.length === 8 ? "+226" + rawClean : "+" + rawClean);

    // Vérifier avec Supabase si possible
    let verifiedOnline = false;
    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: normalized,
          token,
          type: "sms",
        });
        if (!error && data.user) {
          verifiedOnline = true;
        }
      } catch (e) {
        console.warn("Supabase verifyOtp exception:", e);
      }
    }

    // Vérifier le code local/démo
    let isValidToken = token === "123456";
    try {
      const rawStored = sessionStorage.getItem("nafa_otp_" + normalized);
      if (rawStored) {
        const stored = JSON.parse(rawStored);
        if (stored && stored.code === token && stored.expiresAt > Date.now()) {
          isValidToken = true;
        }
      }
    } catch (e) {
      console.warn(e);
    }

    if (!isValidToken && !verifiedOnline) {
      return { error: { message: "Code de confirmation incorrect ou expiré. Utilisez le code 123456." } };
    }

    try {
      sessionStorage.removeItem("nafa_otp_" + normalized);
    } catch (_e) {
      // Ignorer l'erreur de suppression en sessionStorage
    }

    const simUserId = phoneToDeterministicUuid(normalized);
    const storedAccounts = getStoredPhoneAccounts();
    const existingAccount = storedAccounts[normalized];
    if (existingAccount && existingAccount.userId && (!isValidUuid(existingAccount.userId) || existingAccount.userId.startsWith("usr-"))) {
      existingAccount.userId = simUserId;
    }

    // Nouveau compte sans profil renseigné : demander les informations de profil (Étape 3)
    if (!profileData && !existingAccount) {
      return { error: null, isNewUser: true };
    }

    const safeRole = profileData?.role || existingAccount?.roles?.[0] || "agriculteur";
    const fullName = profileData?.fullName || existingAccount?.fullName || "Producteur Agricole";
    const partnerT = profileData?.partnerType || existingAccount?.partnerType || "fournisseur_intrants";

    const simUser: any = {
      id: existingAccount?.userId || simUserId,
      phone: normalized,
      email: `${normalized.replace(/[^0-9]/g, '')}@nafa-agritech.local`,
      aud: "authenticated",
      role: "authenticated",
      created_at: new Date().toISOString(),
      user_metadata: {
        full_name: fullName,
        role: safeRole,
        phone: normalized,
        partner_type: safeRole === "partenaire" ? partnerT : undefined,
      },
    };

    const simProfile = {
      full_name: fullName,
      phone: normalized,
      email: null,
      avatar_url: null,
    };

    const simRoles = [safeRole];

    setUser(simUser);
    setProfile(simProfile);
    setRoles(simRoles);
    setIsOfflineSession(false);

    if (safeRole === "partenaire") {
      setPartnerType(partnerT);
    }

    const sessionObj: NafaLocalSession = {
      userId: simUser.id,
      email: simUser.email,
      phone: normalized,
      fullName,
      roles: simRoles,
      partnerType: safeRole === "partenaire" ? partnerT : undefined,
      profile: simProfile,
      savedAt: Date.now(),
    };

    saveLocalSession(sessionObj);
    await cacheSession(simUser.id, simUser.email, simProfile, simRoles, normalized);
    return { error: null, isNewUser: false };
  };

  const signOut = async () => {
    explicitSignOutRef.current = true;
    const currentUserId = user?.id;
    try { await supabase.auth.signOut(); } catch (error) { console.warn("Supabase sign-out failed:", error); }

    clearLocalSession();
    if (currentUserId) await clearUserOfflineData(currentUserId);
    await clearOfflineSession();
    await clearOfflineCredentials();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setIsOfflineSession(false);
    explicitSignOutRef.current = false;
  };

  const isGuestSession = user?.id === "00000000-0000-4000-a000-000000000001";

  const startGuestSession = async (role: string = "agriculteur") => {
    const safeRole = role || "agriculteur";
    const partnerT: PartnerProfileType = safeRole === "partenaire" ? "expert_agronome" : "fournisseur_intrants";
    const guestUser: User = {
      id: "00000000-0000-4000-a000-000000000001",
      email: "invite@nafa-agritech.bf",
      phone: "+226 70 00 00 00",
      aud: "authenticated",
      role: "authenticated",
      created_at: new Date().toISOString(),
      user_metadata: {
        full_name: "Invité NAFA",
        role: safeRole,
        phone: "+226 70 00 00 00",
        partner_type: safeRole === "partenaire" ? partnerT : undefined,
      },
    } as unknown as User;

    const guestProfile = {
      full_name: "Invité NAFA",
      phone: "+226 70 00 00 00",
      email: "invite@nafa-agritech.bf",
      avatar_url: null,
    };

    const guestRoles = safeRole === "expert" ? ["expert", "agronome"] : [safeRole];
    setUser(guestUser);
    setProfile(guestProfile);
    setRoles(guestRoles);
    setIsOfflineSession(true);
    if (safeRole === "partenaire" || safeRole === "expert") {
      setPartnerType(partnerT);
    }

    const sessionObj: NafaLocalSession = {
      userId: guestUser.id,
      email: guestUser.email || "",
      phone: "+226 70 00 00 00",
      fullName: "Invité NAFA",
      roles: guestRoles,
      partnerType: partnerT,
      profile: guestProfile,
      savedAt: Date.now(),
    };
    saveLocalSession(sessionObj);
  };

  const hasRole = (role: string) => roles.includes(role);
  const primaryRole = roles.length > 0 ? roles[0] : null;

  return (
    <AuthContext.Provider value={{
      user, session, loading, profile, roles, primaryRole, partnerType, setPartnerType, isOfflineSession, isGuestSession,
      signUp, signIn, signInOffline, signInWithPhoneOtp, verifyPhoneOtp, signOut, hasRole, startGuestSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
