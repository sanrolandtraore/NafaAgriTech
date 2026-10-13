import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { sanitizeRedirectUrl } from "@/lib/safeRedirect";
import InscriptionPage from "@/pages/auth/InscriptionPage";
import ConnexionPage from "@/pages/auth/ConnexionPage";
import MotDePasseOubliePage from "@/pages/auth/MotDePasseOubliePage";
import VerifierEmailPage from "@/pages/auth/VerifierEmailPage";

// Mock AuthContext
const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdatePassword = vi.fn();
const mockResendVerificationEmail = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signUp: mockSignUp,
    signIn: mockSignIn,
    signInWithOtp: vi.fn(),
    signInOffline: vi.fn(),
    resetPasswordForEmail: mockResetPasswordForEmail,
    updatePassword: mockUpdatePassword,
    resendVerificationEmail: mockResendVerificationEmail,
    signOut: mockSignOut,
    isOfflineSession: false,
    role: null,
    profile: null,
    primaryRole: null,
  }),
  useOptionalAuth: () => null,
}));

describe("Sécurité des redirections (safeRedirect)", () => {
  it("accepte les chemins internes sécurisés", () => {
    expect(sanitizeRedirectUrl("/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectUrl("/dashboard/farms?filter=all")).toBe("/dashboard/farms?filter=all");
    expect(sanitizeRedirectUrl("/profil")).toBe("/profil");
  });

  it("bloque les attaques par redirection ouverte et domaines externes", () => {
    expect(sanitizeRedirectUrl("https://evil-phishing.com")).toBe("/dashboard");
    expect(sanitizeRedirectUrl("http://attacker.com/steal-session")).toBe("/dashboard");
    expect(sanitizeRedirectUrl("//malicious.com")).toBe("/dashboard");
    expect(sanitizeRedirectUrl("javascript:alert(1)")).toBe("/dashboard");
    expect(sanitizeRedirectUrl(null)).toBe("/dashboard");
    expect(sanitizeRedirectUrl("")).toBe("/dashboard");
  });
});

describe("Page d'inscription native (/inscription)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le formulaire d'inscription mobile avec sélection de pays et nom", () => {
    render(
      <BrowserRouter>
        <InscriptionPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Créer un compte/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom et Prénom/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/70 00 00 00/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuer vers mon profil/i })).toBeInTheDocument();
  });

  it("permet de basculer vers l'inscription classique par e-mail", () => {
    render(
      <BrowserRouter>
        <InscriptionPage />
      </BrowserRouter>
    );

    const emailSwitchBtn = screen.getByText(/S'inscrire plutôt avec une adresse e-mail/i);
    fireEvent.click(emailSwitchBtn);

    expect(screen.getByLabelText(/Adresse e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Créer mon compte par e-mail/i })).toBeInTheDocument();
  });
});

describe("Page de connexion native (/connexion)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche la saisie du numéro de mobile et le bouton continuer", () => {
    render(
      <BrowserRouter>
        <ConnexionPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Bienvenue sur/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/70 00 00 00/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continuer/i })).toBeInTheDocument();
  });

  it("permet de basculer vers la connexion par e-mail", () => {
    render(
      <BrowserRouter>
        <ConnexionPage />
      </BrowserRouter>
    );

    const emailSwitchBtn = screen.getByText(/Se connecter plutôt avec une adresse e-mail/i);
    fireEvent.click(emailSwitchBtn);

    expect(screen.getByLabelText(/Adresse e-mail professionnelle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Se connecter par e-mail/i })).toBeInTheDocument();
  });
});

describe("Page mot de passe oublié (/mot-de-passe-oublie)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le champ e-mail pour réinitialisation", () => {
    render(
      <BrowserRouter>
        <MotDePasseOubliePage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Mot de passe oublié \?/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Votre adresse e-mail de connexion/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Envoyer le lien de réinitialisation/i })).toBeInTheDocument();
  });
});

describe("Page de confirmation email (/verifier-email)", () => {
  it("affiche les instructions de confirmation et bouton de renvoi", () => {
    render(
      <BrowserRouter>
        <VerifierEmailPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Vérifiez votre adresse e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Renvoyer l'e-mail de confirmation/i })).toBeInTheDocument();
  });
});
