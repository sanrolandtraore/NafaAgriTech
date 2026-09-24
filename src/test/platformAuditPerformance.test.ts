import { describe, it, expect, beforeEach } from 'vitest';
import { getClientDeviceId, getEffectiveUserId } from '@/lib/deviceIdentity';
import { partnerStorage } from '@/lib/partnerStorage';
import { getDedicatedPartnerBundle } from '@/lib/partnerDedicatedStorage';

describe('Audit Plateforme & Élimination des Données Fictives', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Identité cryptographique réelle des terminaux (deviceIdentity)', () => {
    it('génère un identifiant d\'appareil persistant et unique sans fallback mocké', () => {
      const devId1 = getClientDeviceId();
      expect(devId1).toMatch(/^client-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

      // Persistance dans localStorage
      const devId2 = getClientDeviceId();
      expect(devId2).toBe(devId1);
      expect(devId1).not.toBe('demo-user');
      expect(devId1).not.toBe('demo-farmer');
      expect(devId1).not.toBe('demo-partner-id');
    });

    it('getEffectiveUserId respecte l\'utilisateur connecté ou isole par deviceId réel', () => {
      const authUser = 'user-supabase-real-uuid-12345';
      expect(getEffectiveUserId(authUser)).toBe(authUser);

      const anonymousEffectiveId = getEffectiveUserId(null);
      expect(anonymousEffectiveId).toMatch(/^client-/);
      expect(anonymousEffectiveId).not.toBe('demo-user');
      expect(anonymousEffectiveId).not.toBe('demo-farmer');
      expect(anonymousEffectiveId).not.toBe('demo-partner-id');
    });
  });

  describe('Stockage Partenaire épuré de toute donnée mockée (partnerStorage)', () => {
    it('ne contient aucune offre assignée à demo-partner-id dans les offres initiales', async () => {
      const allOffers = await partnerStorage.getOffers();
      expect(allOffers.length).toBeGreaterThan(0);
      const fakeOffers = allOffers.filter(o => o.owner_id === 'demo-partner-id');
      expect(fakeOffers).toHaveLength(0);

      // Toutes les offres appartiennent à des partenaires réels répertoriés
      for (const offer of allOffers) {
        expect(offer.owner_id).toBeDefined();
        expect(offer.owner_id).not.toBe('demo-partner-id');
        expect(offer.price_indication).toBeDefined();
      }
    });

    it('démarre avec un registre de missions partenaire et clients authentiquement vide', async () => {
      const missions = await partnerStorage.getMissions();
      expect(missions).toEqual([]);
      const clients = await partnerStorage.getClients();
      expect(clients).toEqual([]);
    });

    it('isole strictement les offres par owner_id sans fuite de catalogue entre tiers', async () => {
      const sncitecOffers = await partnerStorage.getOffers('partner-sncitec');
      expect(sncitecOffers.length).toBeGreaterThan(0);
      expect(sncitecOffers.every(o => o.owner_id === 'partner-sncitec')).toBe(true);

      const unknownOffers = await partnerStorage.getOffers('unregistered-test-partner');
      expect(unknownOffers).toEqual([]);
    });

    it('fournit des profils partenaires réels avec des coordonnées officielles réelles', async () => {
      const profile = await partnerStorage.getPartnerProfile('pe-fourn-1');
      expect(profile).toBeDefined();
      expect(profile.name).toContain('SAPHYTO');
      expect(profile.phone).toMatch(/^\+226/);
      expect(profile.phone).not.toContain('XX');
    });
  });

  describe('Espace Partenaire Dédié (partnerDedicatedStorage)', () => {
    it('initialise les avis, commandes, devis et projets à vide sans données factices', () => {
      const testOwnerId = 'partner-real-test-id';
      const bundle = getDedicatedPartnerBundle(testOwnerId);
      expect(bundle.reviews).toEqual([]);
      expect(bundle.quotes).toEqual([]);
      expect(bundle.orders).toEqual([]);
      expect(bundle.projects).toEqual([]);
      expect(bundle.presentation.companyName).toBe('Mon Entreprise Agricole Partenaire');
      expect(bundle.contact.phone).toBe('+226 25 36 00 00');
    });
  });
});
