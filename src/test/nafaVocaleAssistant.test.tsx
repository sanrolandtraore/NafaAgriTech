import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { analyzeVoiceQuery, playVoiceSpeech, NAFA_VOICE_LANGUAGES } from "@/lib/nafaVocaleEngine";
import NafaVocaleAssistant from "@/components/agriculteur/NafaVocaleAssistant";
import { PublicMarketItem } from "@/pages/dashboard/ServiceMarketplacePage";

const mockCatalogItems: PublicMarketItem[] = [
  {
    id: "item-tracteur-1",
    provider_id: "prov-1",
    partner_name: "Faso Machinisme Bobo",
    title: "Tracteur Massey 75CV pour labour",
    description: "Disponible avec conducteur qualifié",
    category: "machinisme",
    price: 25000,
    price_unit: "hectare",
    location_name: "Bobo-Dioulasso, Hauts-Bassins",
    city: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    distanceKm: 15,
    phone: "+226 70 12 34 56",
    whatsapp: "+226 70 12 34 56",
    imageUrl: null,
    availability: "immediate",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "item-engrais-1",
    provider_id: "prov-2",
    partner_name: "Comptoir Agricole Ouaga",
    title: "Engrais NPK 14-23-14 & Semences Maïs",
    description: "Sacs de 50kg certifiés",
    category: "intrants_semences",
    price: 22500,
    price_unit: "sac",
    location_name: "Ouagadougou, Centre",
    city: "Ouagadougou",
    region: "Centre",
    distanceKm: 8,
    phone: "+226 76 98 76 54",
    whatsapp: "+226 76 98 76 54",
    imageUrl: null,
    availability: "immediate",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
];

describe("NAFA Vocale — Moteur d'assistance vocale multilingue sahélien", () => {
  it("1. Analyse et comprend une demande vocale en Mooré (Tracteur à Bobo)", () => {
    const queryMoore = "Ne y beogo, mam baooda toraaktɛɛr n na n kood hektaare a naase Bobo-Dioulasso pʋgẽ.";
    const result = analyzeVoiceQuery(queryMoore, "moore");

    expect(result.detectedCategory).toBe("machinisme");
    expect(result.detectedCity).toBe("Bobo-Dioulasso");
    expect(result.detectedAction).toBe("louer");
    expect(result.language).toBe("moore");
    expect(result.voiceReplyText).toContain("toraaktɛɛr");
  });

  it("2. Analyse et comprend une demande vocale en Dioula (Semences et Engrais)", () => {
    const queryDioula = "N bɛ kaba si ni fari NPK sisekisɛ boro fila fɛ Ouagadougou.";
    const result = analyzeVoiceQuery(queryDioula, "dioula");

    expect(result.detectedCategory).toBe("intrants_semences");
    expect(result.detectedCity).toBe("Ouagadougou");
    expect(result.language).toBe("dioula");
    expect(result.voiceReplyText).toContain("si");
    expect(result.voiceReplyText).toContain("fari");
  });

  it("3. Analyse et comprend une demande vocale en Fulfuldé (Pompe solaire)", () => {
    const queryFulfulde = "Mi ɗon ɗaɓɓa pompe ndiyam naange ngam yarnugol ngesa am.";
    const result = analyzeVoiceQuery(queryFulfulde, "fulfulde");

    expect(result.detectedCategory).toBe("irrigation_solaire");
    expect(result.language).toBe("fulfulde");
    expect(result.voiceReplyText).toContain("pompe");
  });

  it("4. Analyse et comprend une demande vocale en Français", () => {
    const queryFr = "Je cherche un tracteur disponible pour faire du labour vers Bobo-Dioulasso rapidement.";
    const result = analyzeVoiceQuery(queryFr, "fr");

    expect(result.detectedCategory).toBe("machinisme");
    expect(result.detectedCity).toBe("Bobo-Dioulasso");
    expect(result.language).toBe("fr");
    expect(result.voiceReplyText).toContain("tracteur");
  });

  it("5. Vérifie que toutes les 4 langues possèdent des messages d'accueil et des exemples prêts", () => {
    const languages = ["fr", "moore", "dioula", "fulfulde"] as const;
    languages.forEach((lang) => {
      const info = NAFA_VOICE_LANGUAGES[lang];
      expect(info.nativeName).toBeDefined();
      expect(info.welcomeVoiceText.length).toBeGreaterThan(10);
      expect(info.sampleQueries.length).toBeGreaterThanOrEqual(4);
    });
  });
});

describe("Composant UI : NafaVocaleAssistant (Style WhatsApp Voice Note)", () => {
  it("affiche le composant NAFA Vocale avec les 4 langues et les exemples vocaux", () => {
    render(<NafaVocaleAssistant catalogItems={mockCatalogItems} />);

    expect(screen.getAllByText(/NAFA Vocale/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/100% Sans Écriture/i)).toBeInTheDocument();

    // Boutons de langues présents
    expect(screen.getByRole("button", { name: /Mooré/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Julakan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fulfulde/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Français/i })).toBeInTheDocument();
  });

  it("permet de déclencher un exemple vocal et affiche les résultats avec boutons d'appel et WhatsApp", () => {
    render(<NafaVocaleAssistant catalogItems={mockCatalogItems} />);

    // Clic sur l'exemple vocal du tracteur
    const sampleBtn = screen.getByRole("button", { name: /Toraaktɛɛr labour yĩnga Bobo/i });
    fireEvent.click(sampleBtn);

    // Vérifie que les offres trouvées sont affichées
    expect(screen.getByText("Faso Machinisme Bobo")).toBeInTheDocument();
    expect(screen.getByText("Tracteur Massey 75CV pour labour")).toBeInTheDocument();

    // Vérifie que les boutons d'appel direct et WhatsApp sont disponibles pour les non-lecteurs
    const callButtons = screen.getAllByRole("link", { name: /Appeler/i });
    expect(callButtons.length).toBeGreaterThanOrEqual(1);
    expect(callButtons[0]).toHaveAttribute("href", "tel:+226 70 12 34 56");

    const waButtons = screen.getAllByRole("link", { name: /WhatsApp/i });
    expect(waButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("affiche la bannière Voix Naturelle Sahélienne et le bouton de test audio", () => {
    render(<NafaVocaleAssistant catalogItems={mockCatalogItems} />);

    expect(screen.getByText(/Voix Naturelle Sahélienne :/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tester la voix/i })).toBeInTheDocument();
  });
});

describe("Moteur Phonétique & Prosodie Sahélienne (convertToSahelianPhonetics)", () => {
  it("transcrit fidèlement le Mooré avec phonétique naturelle sans bégaiement", async () => {
    const { convertToSahelianPhonetics, SAHELIAN_VOICE_CONFIGS } = await import("@/lib/sahelianVoiceSynthesizer");
    const rawMoore = "Ne y beogo ! Mam yaa NAFA Vocale. Tʋm-y koɛɛga tɩ m sõng-y n paam toraaktɛɛr, koodo, engrais bɩ rũmsi.";
    const phonetic = convertToSahelianPhonetics(rawMoore, "moore");

    expect(phonetic).toContain("Né y béogo");
    expect(phonetic).toContain("toraktère");
    expect(phonetic).toContain("roumsi");
    expect(phonetic).not.toContain("toraaktɛɛr");
    expect(phonetic).not.toContain("ʋ");

    const mooreConfig = SAHELIAN_VOICE_CONFIGS.moore;
    expect(mooreConfig.rate).toBeCloseTo(0.90);
    expect(mooreConfig.pitch).toBeCloseTo(1.04);
  });

  it("transcrit fidèlement le Dioula avec phonétique naturelle mandingue", async () => {
    const { convertToSahelianPhonetics, SAHELIAN_VOICE_CONFIGS } = await import("@/lib/sahelianVoiceSynthesizer");
    const rawDioula = "I ni sogoma ! N'tɔgɔ NAFA Vocale. I ka kuma ci n ma, n bɛna i dɛmɛ ka traktɛri, si, fari walima baganw sɔrɔ.";
    const phonetic = convertToSahelianPhonetics(rawDioula, "dioula");

    expect(phonetic).toContain("N'togo");
    expect(phonetic).toContain("traktéri");
    expect(phonetic).toContain("bagan-ou");
    expect(phonetic).not.toContain("traktɛri");
    expect(phonetic).not.toContain("ɛ");

    const dioulaConfig = SAHELIAN_VOICE_CONFIGS.dioula;
    expect(dioulaConfig.rate).toBeCloseTo(0.92);
    expect(dioulaConfig.pitch).toBeCloseTo(0.98);
  });

  it("transcrit fidèlement le Fulfuldé avec phonétique naturelle peule", async () => {
    const { convertToSahelianPhonetics, SAHELIAN_VOICE_CONFIGS } = await import("@/lib/sahelianVoiceSynthesizer");
    const rawFulfulde = "Jam waali ! Miin woni NAFA Vocale. Nelam haala maa, mi wallete heɓde aawdi, lekki ngesa, traktɛɛr malla jawdi.";
    const phonetic = convertToSahelianPhonetics(rawFulfulde, "fulfulde");

    expect(phonetic).toContain("Djam wali");
    expect(phonetic).toContain("Min woni");
    expect(phonetic).toContain("traktère");
    expect(phonetic).toContain("djawdi");
    expect(phonetic).not.toContain("traktɛɛr");
    expect(phonetic).not.toContain("ɗ");

    const fulfuldeConfig = SAHELIAN_VOICE_CONFIGS.fulfulde;
    expect(fulfuldeConfig.rate).toBeCloseTo(0.88);
    expect(fulfuldeConfig.pitch).toBeCloseTo(1.02);
  });
});
