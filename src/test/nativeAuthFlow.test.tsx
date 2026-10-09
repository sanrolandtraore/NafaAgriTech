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

  it("affiche le formulaire complet avec sélection de profil", () => {
    render(
      <BrowserRouter>
        <InscriptionPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Créer un compte/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom et Prénom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adresse e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmer le mot de passe/i)).toBeInTheDocument();
    expect(screen.getByText(/Votre activité principale/i)).toBeInTheDocument();
  });

  it("valide la correspondance et la longueur des mots de passe", async () => {
    render(
      <BrowserRouter>
        <InscriptionPage />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText(/Nom et Prénom/i);
    const emailInput = screen.getByLabelText(/Adresse e-mail/i);
    const passInput = screen.getByLabelText(/^Mot de passe/i);
    const confirmInput = screen.getByLabelText(/Confirmer le mot de passe/i);
    const submitBtn = screen.getByRole("button", { name: /Créer mon compte/i });

    fireEvent.change(nameInput, { target: { value: "Oumar Sawadogo" } });
    fireEvent.change(emailInput, { target: { value: "oumar@example.com" } });
    fireEvent.change(passInput, { target: { value: "12345" } });
    fireEvent.change(confirmInput, { target: { value: "different" } });

    fireEvent.click(submitBtn);

    // Ne doit pas appeler signUp si non valide
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

describe("Page de connexion native (/connexion)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le formulaire de connexion avec lien mot de passe oublié", () => {
    render(
      <BrowserRouter>
        <ConnexionPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Adresse e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByText(/Mot de passe oublié \?/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Se connecter/i })).toBeInTheDocument();
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
