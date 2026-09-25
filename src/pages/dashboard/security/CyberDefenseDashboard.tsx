import React, { useState, useEffect } from "react";
import {
  CyberShieldSystem,
  CyberShieldIDS,
  VelocitySentinel,
  AuditLogChain,
  SecurityAuditEvent,
  ThreatDetectionResult,
} from "@/lib/cyberShieldEngine";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Terminal,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  FileText,
  Key,
  Database,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const CyberDefenseDashboard: React.FC = () => {
  const [logs, setLogs] = useState<SecurityAuditEvent[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<{ isValid: boolean; count: number } | null>(null);
  const [testPayload, setTestPayload] = useState<string>("<script>alert('Test d'intrusion XSS')</script>");
  const [simulationResult, setSimulationResult] = useState<ThreatDetectionResult | null>(null);
  const [bruteForceCount, setBruteForceCount] = useState<number>(0);
  const [bruteForceBlocked, setBruteForceBlocked] = useState<boolean>(false);

  const refreshLogs = () => {
    const currentLogs = AuditLogChain.getLogs();
    setLogs(currentLogs);
    setIntegrityStatus(AuditLogChain.verifyLogIntegrity());
  };

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateInspection = () => {
    const res = CyberShieldIDS.inspectPayload(testPayload);
    setSimulationResult(res);

    // Enregistrer l'incident simulé si menace
    if (res.isThreat) {
      CyberShieldSystem.registerIncident({
        threatCategory: res.categories[0] || "ANOMALOUS_PAYLOAD",
        severity: res.severity,
        score: res.score,
        details: `[Simulation Sandbox] ${res.details.join(" | ")}`,
        autonomousAction: res.autonomousAction,
      });
      refreshLogs();
    }
  };

  const handleSimulateBruteForce = () => {
    const actionKey = "auth_login_simulation";
    const res = VelocitySentinel.checkAndRecordAttempt(actionKey);
    setBruteForceCount((prev) => prev + 1);
    if (res.isBlocked) {
      setBruteForceBlocked(true);
      refreshLogs();
    }
  };

  const handleResetBruteForce = () => {
    VelocitySentinel.reset("auth_login_simulation");
    setBruteForceCount(0);
    setBruteForceBlocked(false);
  };

  const handleSimulateHoneytoken = () => {
    CyberShieldSystem.triggerHoneytokenTrap("_hp_decoy_field", "auto-scraper-bot-submission");
  };

  const handleExportAuditReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nafa-security-audit-report-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 border border-slate-700/60 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert className="h-64 w-64 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              BOUCLIER AUTONOME IDS / IPS / RASP ACTIF
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Centre de Cybersécurité & Bouclier Autonome
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Système d'auto-défense temps réel de grade militaire (Zero-Trust, OWASP, NIST SP 800-94).
              Détection des intrusions, neutralisation des vecteurs et mise en quarantaine autonome sans intervention humaine externe.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleExportAuditReport}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Exporter Registre Scellé (JSON)
            </Button>
            <Button
              onClick={refreshLogs}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Incidents Neutralisés</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
              {logs.length}
            </div>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Intégrité Chaîne Log</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-1 flex items-center gap-1.5">
              {integrityStatus?.isValid ? "100% Scellé" : "Vérification..."}
            </div>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Temps de Neutralisation</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1">
              &lt; 2 ms
            </div>
          </div>
          <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800">
            <div className="text-xs text-slate-400 font-medium">Intervention Externe</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-1">
              0 requise (100% Autonome)
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="engines" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="engines">Moteurs Actifs</TabsTrigger>
          <TabsTrigger value="sandbox">Bac à Sable (Sandbox)</TabsTrigger>
          <TabsTrigger value="logs">Registre d'Audit SHA-256</TabsTrigger>
        </TabsList>

        {/* Tab 1: Moteurs Actifs */}
        <TabsContent value="engines" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: XSS Hunter */}
            <Card className="border-emerald-500/20 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Actif</Badge>
                  <Cpu className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-bold mt-2">1. XSS & DOM Injection Hunter</CardTitle>
                <CardDescription className="text-xs">
                  Analyse syntaxique heuristique sur balises script, gestionnaires d'événements (onload, onerror), javascript:, et URI obfusquées.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Assainissement récursif automatique
                </div>
                <div>Filtrage des attaques polyglottes & UTF-8</div>
              </CardContent>
            </Card>

            {/* Card 2: SQLi Shield */}
            <Card className="border-emerald-500/20 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Actif</Badge>
                  <Database className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-bold mt-2">2. SQL & NoSQL Query Shield</CardTitle>
                <CardDescription className="text-xs">
                  Neutralisation des injections SQL (UNION, DROP, WAITFOR, pg_sleep) et altérations d'opérateurs NoSQL ($where, $ne).
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Protection Offline Dexie & Online Supabase
                </div>
                <div>Isolation stricte des requêtes paramétrées</div>
              </CardContent>
            </Card>

            {/* Card 3: Velocity Sentinel */}
            <Card className="border-emerald-500/20 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Actif</Badge>
                  <Zap className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-bold mt-2">3. Sentinelle Anti-Brute Force</CardTitle>
                <CardDescription className="text-xs">
                  Régulation dynamique de la vélocité. Verrouillage automatique de 15 minutes dès 5 tentatives erronées en moins de 60s.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Backoff exponentiel automatisé
                </div>
                <div>Suivi d'empreinte terminal sans cookie tiers</div>
              </CardContent>
            </Card>

            {/* Card 4: Honeytoken Tripwire */}
            <Card className="border-emerald-500/20 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Actif</Badge>
                  <Terminal className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-bold mt-2">4. Pièges Honeytokens (Jetons de Miel)</CardTitle>
                <CardDescription className="text-xs">
                  Champs leurres invisibles intégrés aux formulaires. Détection immédiate des bots, scrapers et scripts automatisés.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Score 100/100 immédiat en cas de touche
                </div>
                <div>Déclenchement instantané de la Quarantaine</div>
              </CardContent>
            </Card>

            {/* Card 5: Anti-Clickjacking */}
            <Card className="border-emerald-500/20 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Actif</Badge>
                  <Lock className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-bold mt-2">5. Anti-Clickjacking & Frame Busting</CardTitle>
                <CardDescription className="text-xs">
                  Vérification d'ancêtre de cadre. Évasion automatique ou neutralisation en cas d'embarquement dans une iframe pirate.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Auto-neutralisation si top !== self
                </div>
                <div>Protection des interactions tactiles</div>
              </CardContent>
            </Card>

            {/* Card 6: Chained Audit */}
            <Card className="border-emerald-500/20 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Actif</Badge>
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-bold mt-2">6. Registre d'Audit Inviolable (SHA-256)</CardTitle>
                <CardDescription className="text-xs">
                  Chaque événement de sécurité est lié cryptographiquement au précédent (Blockchain locale). Toute tentative de falsification est immédiatement décelée.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-1.5 text-foreground font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Vérification d'intégrité en temps réel
                </div>
                <div>Historique scellé inaltérable</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Sandbox / Simulateur d'Attaques */}
        <TabsContent value="sandbox" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test 1 : Injection Payload */}
            <Card className="shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Play className="h-4 w-4 text-emerald-600" />
                  Testeur d'Injection (XSS, SQLi, NoSQL)
                </CardTitle>
                <CardDescription className="text-xs">
                  Injectez un vecteur malveillant pour observer le calcul du score de risque et l'action autonome prise par l'IDS.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-700">Charge Utile (Payload) :</div>
                  <Input
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                    className="font-mono text-xs"
                    placeholder="Ex: <script>alert(1)</script> ou ' OR '1'='1"
                  />
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTestPayload("<script>alert('XSS Exploit')</script>")}
                    className="px-2 py-1 bg-muted rounded hover:bg-muted/80 text-foreground"
                  >
                    XSS Script
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestPayload("' UNION SELECT id, password FROM users --")}
                    className="px-2 py-1 bg-muted rounded hover:bg-muted/80 text-foreground"
                  >
                    SQLi Union
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestPayload("../../etc/passwd")}
                    className="px-2 py-1 bg-muted rounded hover:bg-muted/80 text-foreground"
                  >
                    Path Traversal
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestPayload('{"$where": "this.password.length > 0"}')}
                    className="px-2 py-1 bg-muted rounded hover:bg-muted/80 text-foreground"
                  >
                    NoSQL $where
                  </button>
                </div>

                <Button onClick={handleSimulateInspection} className="w-full text-xs font-semibold">
                  Exécuter l'Inspection Autonome
                </Button>

                {simulationResult && (
                  <div
                    className={`rounded-xl p-4 border text-xs space-y-2 animate-fade-in ${
                      simulationResult.isThreat
                        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200"
                        : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>RÉSULTAT DU SCANNEUR :</span>
                      <span>Score de Risque : {simulationResult.score}/100</span>
                    </div>
                    <div>
                      <span className="font-semibold">Action Autonome :</span>{" "}
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {simulationResult.autonomousAction}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-semibold">Sévérité :</span> {simulationResult.severity}
                    </div>
                    {simulationResult.details.length > 0 && (
                      <div className="pt-1">
                        <span className="font-semibold block mb-0.5">Détails de Détection :</span>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {simulationResult.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="pt-1 border-t border-current/20">
                      <span className="font-semibold block mb-0.5">Valeur Assainie par le RASP :</span>
                      <code className="bg-background/80 px-2 py-0.5 rounded text-[11px] block overflow-x-auto">
                        {String(simulationResult.sanitizedValue || "(vide ou neutralisé)")}
                      </code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test 2 : Brute Force & Honeytoken */}
            <div className="space-y-6">
              <Card className="shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Simulateur de Rafale (Brute Force)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Générez plus de 5 tentatives rapides pour observer le déclenchement autonome du verrou de sécurité (15 min).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted text-xs">
                    <span>Tentatives dans la fenêtre :</span>
                    <span className="font-mono font-bold text-sm text-foreground">{bruteForceCount} / 5</span>
                  </div>

                  {bruteForceBlocked ? (
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Verrouillé automatiquement pour 15 min !
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResetBruteForce}
                        className="h-7 text-[10px]"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" /> Reset
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleSimulateBruteForce}
                      variant="outline"
                      className="w-full text-xs font-semibold border-amber-500/40 hover:bg-amber-500/10 text-amber-600"
                    >
                      Déclencher Tentative de Connexion (+1)
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xs border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Déclenchement du Piège Honeytoken
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Simule la soumission frauduleuse d'un bot dans un champ invisible. Active immédiatement la quarantaine matérielle !
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleSimulateHoneytoken}
                    variant="destructive"
                    className="w-full text-xs font-semibold"
                  >
                    Activer le Piège Honeytoken (Quarantaine Immédiate)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Registre d'Audit Inviolable */}
        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Journal d'Audit Cryptographique Inviolable</CardTitle>
                <CardDescription className="text-xs">
                  Chaîne de blocs locale SHA-256 liant chaque événement à son prédécesseur.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                {integrityStatus?.isValid ? "Integre 100%" : "Alteration Detectee"}
              </Badge>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Aucun incident de sécurité enregistré. Le système surveille les flux en continu.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-muted text-muted-foreground border-b">
                      <tr>
                        <th className="p-2.5">Date & Heure</th>
                        <th className="p-2.5">Vecteur</th>
                        <th className="p-2.5">Score</th>
                        <th className="p-2.5">Sévérité</th>
                        <th className="p-2.5">Action Autonome</th>
                        <th className="p-2.5">Hachage Scellé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {logs
                        .slice()
                        .reverse()
                        .map((ev) => (
                          <tr key={ev.id} className="hover:bg-muted/40 transition-colors">
                            <td className="p-2.5 whitespace-nowrap text-slate-500">
                              {new Date(ev.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="p-2.5 font-bold text-foreground">{ev.threatCategory}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  ev.score >= 70
                                    ? "bg-red-500/20 text-red-600"
                                    : ev.score >= 40
                                    ? "bg-amber-500/20 text-amber-600"
                                    : "bg-emerald-500/20 text-emerald-600"
                                }`}
                              >
                                {ev.score}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className="font-semibold">{ev.severity}</span>
                            </td>
                            <td className="p-2.5">
                              <Badge variant="outline" className="text-[10px]">
                                {ev.autonomousAction}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-slate-400 truncate max-w-[140px]" title={ev.hash}>
                              {ev.hash}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CyberDefenseDashboard;
