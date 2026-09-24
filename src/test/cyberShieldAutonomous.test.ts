import { describe, it, expect, beforeEach } from 'vitest';
import {
  CyberShieldIDS,
  VelocitySentinel,
  AuditLogChain,
  CyberShieldSystem,
} from '@/lib/cyberShieldEngine';

describe('Système Autonome de Détection & de Blocage Cyber (IDS/IPS / RASP)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    AuditLogChain.clearLogs();
  });

  describe('1. Moteur d\'Inspection Heuristique & Détection Vectorielle (IDS)', () => {
    it('détecte et neutralise les charges utiles XSS classiques et obfusquées', () => {
      const xssVectors = [
        "<script>alert('XSS Exploit')</script>",
        "<img src=x onerror=alert(document.cookie)>",
        "<svg onload=alert(1)>",
        "javascript:void(document.location='http://evil.com')",
        "eval(String.fromCharCode(97,108,101,114,116))",
      ];

      for (const vector of xssVectors) {
        const result = CyberShieldIDS.inspectPayload(vector);
        expect(result.isThreat).toBe(true);
        expect(result.categories).toContain('XSS_INJECTION');
        expect(result.score).toBeGreaterThanOrEqual(40);
        expect(result.sanitizedValue).not.toContain('<script>');
        expect(result.sanitizedValue).not.toContain('onerror');
      }
    });

    it('détecte et bloque les tentatives d\'injections SQL et NoSQL', () => {
      const sqliVectors = [
        "' OR '1'='1",
        "admin' --",
        "' UNION SELECT id, username, password FROM users --",
        "; WAITFOR DELAY '0:0:5'--",
      ];

      for (const vector of sqliVectors) {
        const result = CyberShieldIDS.inspectPayload(vector);
        expect(result.isThreat).toBe(true);
        expect(result.categories).toContain('SQL_INJECTION');
        expect(result.score).toBeGreaterThanOrEqual(50);
      }

      const noSqlVector = { filter: { $where: "this.password.length > 5" } };
      const noSqlResult = CyberShieldIDS.inspectPayload(noSqlVector);
      expect(noSqlResult.isThreat).toBe(true);
      expect(noSqlResult.categories).toContain('NOSQL_INJECTION');
    });

    it('détecte les attaques par traversée de répertoire (Path Traversal) et pollution de prototype', () => {
      const traversal = CyberShieldIDS.inspectPayload("../../etc/passwd");
      expect(traversal.isThreat).toBe(true);
      expect(traversal.categories).toContain('PATH_TRAVERSAL');

      const pollution = CyberShieldIDS.inspectPayload(JSON.parse('{"__proto__": {"isAdmin": true}}'));
      expect(pollution.isThreat).toBe(true);
      expect(pollution.categories).toContain('PROTOTYPE_POLLUTION');
      expect(Object.prototype.hasOwnProperty.call(pollution.sanitizedValue, '__proto__')).toBe(false);
      expect((pollution.sanitizedValue as any).isAdmin).toBeUndefined();
    });

    it('assainit récursivement les objets complexes et tableaux sans altérer les données légitimes', () => {
      const cleanData = {
        name: "Coopérative Faso Maraîchers",
        hectares: 12.5,
        crops: ["Tomate", "Oignon"],
      };

      const scanClean = CyberShieldIDS.inspectPayload(cleanData);
      expect(scanClean.isThreat).toBe(false);
      expect(scanClean.score).toBe(0);

      const hostileData = {
        title: "Kit Irrigation Goutte-à-Goutte",
        description: "Matériel fiable <script>evil()</script>",
        price: 450000,
      };

      const scanHostile = CyberShieldIDS.inspectPayload(hostileData);
      expect(scanHostile.isThreat).toBe(true);
      expect(scanHostile.sanitizedValue.description).not.toContain('<script>');
    });
  });

  describe('2. Sentinelle Anti-Brute Force & Régulation de Vélocité', () => {
    it('tolère les requêtes normales puis déclenche un verrouillage automatique dès la 5ème tentative rapide', () => {
      const actionKey = 'test_login_user_ouedraogo';

      // 4 tentatives autorisées
      for (let i = 1; i <= 4; i++) {
        const attempt = VelocitySentinel.checkAndRecordAttempt(actionKey);
        expect(attempt.isBlocked).toBe(false);
      }

      // 5ème tentative : seuil critique atteint -> Verrouillage autonome
      const criticalAttempt = VelocitySentinel.checkAndRecordAttempt(actionKey);
      expect(criticalAttempt.isBlocked).toBe(true);
      expect(criticalAttempt.remainingLockoutSeconds).toBeGreaterThan(0);

      // 6ème tentative : toujours sous verrou
      const blockedAgain = VelocitySentinel.checkAndRecordAttempt(actionKey);
      expect(blockedAgain.isBlocked).toBe(true);

      // Réinitialisation après succès
      VelocitySentinel.reset(actionKey);
      const afterReset = VelocitySentinel.checkAndRecordAttempt(actionKey);
      expect(afterReset.isBlocked).toBe(false);
    });
  });

  describe('3. Piège Honeytoken (Jetons de Miel) & Quarantaine Autonome Immédiate', () => {
    it('déclenche une quarantaine matérielle immédiate avec révocation de session en cas de touche robot', () => {
      // Préparation d'une fausse session
      localStorage.setItem("supabase.auth.token", "token-secret-authentifie");
      localStorage.setItem("nafa_offline_session_v1", "session-active");

      expect(CyberShieldSystem.getQuarantineState()).toBeNull();

      // Un bot remplit le champ invisible
      CyberShieldSystem.triggerHoneytokenTrap("_auth_security_trap", "script-bot-value");

      const quarantine = CyberShieldSystem.getQuarantineState();
      expect(quarantine).not.toBeNull();
      expect(quarantine?.isQuarantined).toBe(true);
      expect(quarantine?.threatCategory).toBe('HONEYTOKEN_TRIPWIRE');
      expect(quarantine?.score).toBe(100);
      expect(quarantine?.incidentId).toMatch(/^INC-/);

      // Vérification de la purge de session Zero-Trust
      expect(localStorage.getItem("supabase.auth.token")).toBeNull();
      expect(localStorage.getItem("nafa_offline_session_v1")).toBeNull();
    });
  });

  describe('4. Registre d\'Audit Inviolable Scellé Cryptographiquement (SHA-256)', () => {
    it('génère une chaîne de hachage inviolable liant chaque incident au précédent', () => {
      AuditLogChain.appendEvent({
        fingerprint: 'dev-client-1',
        threatCategory: 'XSS_INJECTION',
        severity: 'HIGH',
        score: 80,
        details: 'Attaque XSS neutralisée',
        autonomousAction: 'HARD_QUARANTINE',
      });

      AuditLogChain.appendEvent({
        fingerprint: 'dev-client-2',
        threatCategory: 'SQL_INJECTION',
        severity: 'CRITICAL',
        score: 95,
        details: 'Tentative SQLi bloquée',
        autonomousAction: 'HARD_QUARANTINE',
      });

      const logs = AuditLogChain.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].prevHash).toBe('sha256-0000000000000000000000000000000000000000000000000000000000000000');
      expect(logs[1].prevHash).toBe(logs[0].hash);

      const verification = AuditLogChain.verifyLogIntegrity();
      expect(verification.isValid).toBe(true);
      expect(verification.count).toBe(2);
    });

    it('détecte immédiatement toute falsification frauduleuse d\'un journal d\'audit', () => {
      AuditLogChain.appendEvent({
        fingerprint: 'dev-client-1',
        threatCategory: 'XSS_INJECTION',
        severity: 'HIGH',
        score: 80,
        details: 'Attaque XSS neutralisée',
        autonomousAction: 'HARD_QUARANTINE',
      });

      // Simulation d'une altération hostile du localStorage
      const logs = AuditLogChain.getLogs();
      logs[0].score = 10; // Un pirate altère le score après coup
      localStorage.setItem('nafa_cyber_audit_chain_v1', JSON.stringify(logs));

      const verification = AuditLogChain.verifyLogIntegrity();
      expect(verification.isValid).toBe(false);
      expect(verification.brokenIndex).toBe(0);
    });
  });

  describe('5. Procédure de Déblocage d\'Urgence Administrateur', () => {
    it('rejette les clés d\'urgence invalides et accepte la clé maître officielle', () => {
      CyberShieldSystem.triggerHardQuarantine('ANOMALOUS_PAYLOAD', 80, 'Test de verrouillage');
      expect(CyberShieldSystem.getQuarantineState()?.isQuarantined).toBe(true);

      // Clé invalide
      const rejected = CyberShieldSystem.releaseQuarantine('mauvaise-cle');
      expect(rejected).toBe(false);
      expect(CyberShieldSystem.getQuarantineState()?.isQuarantined).toBe(true);

      // Clé officielle d'urgence
      const accepted = CyberShieldSystem.releaseQuarantine('NAFA-SEC-UNBLOCK-991');
      expect(accepted).toBe(true);
      expect(CyberShieldSystem.getQuarantineState()).toBeNull();
    });
  });
});
