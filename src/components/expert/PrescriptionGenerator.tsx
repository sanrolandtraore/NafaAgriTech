import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileDown, Plus, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PrescriptionLine {
  product: string;
  dose: string;
  surface: string;
  mode: string;
  dar: string;
}

export interface PrescriptionInitialData {
  clientName?: string;
  clientPhone?: string;
  parcel?: string;
  crop?: string;
  diagnosis?: string;
  recommendations?: string;
  lines?: PrescriptionLine[];
}

interface PrescriptionGeneratorProps {
  initialData?: PrescriptionInitialData;
  onClose?: () => void;
}

export function PrescriptionGenerator({ initialData, onClose }: PrescriptionGeneratorProps) {
  const { profile, user } = useAuth();
  const [clientName, setClientName] = useState(initialData?.clientName || profile?.full_name || "");
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || profile?.phone || "");
  const [parcel, setParcel] = useState(initialData?.parcel || "");
  const [crop, setCrop] = useState(initialData?.crop || "");
  const [diagnosis, setDiagnosis] = useState(initialData?.diagnosis || "");
  const [lines, setLines] = useState<PrescriptionLine[]>(
    initialData?.lines && initialData.lines.length > 0
      ? initialData.lines
      : [{ product: "", dose: "", surface: "", mode: "", dar: "" }]
  );
  const [recommendations, setRecommendations] = useState(initialData?.recommendations || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      if (initialData.clientName) setClientName(initialData.clientName);
      if (initialData.clientPhone) setClientPhone(initialData.clientPhone);
      if (initialData.parcel) setParcel(initialData.parcel);
      if (initialData.crop) setCrop(initialData.crop);
      if (initialData.diagnosis) setDiagnosis(initialData.diagnosis);
      if (initialData.recommendations) setRecommendations(initialData.recommendations);
      if (initialData.lines && initialData.lines.length > 0) setLines(initialData.lines);
    }
  }, [initialData]);

  const upd = (i: number, k: keyof PrescriptionLine, v: string) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  };
  const addLine = () => setLines(prev => [...prev, { product: "", dose: "", surface: "", mode: "", dar: "" }]);
  const rmLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i));

  const generatePdf = async () => {
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString("fr-FR");
      
      // Header Branding NAFA - AGRITECH
      doc.setFontSize(16);
      doc.setTextColor(24, 120, 60);
      doc.text("NAFA - AGRITECH • ORDONNANCE PHYTOSANITAIRE", 105, 18, { align: "center" });
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text("Expertise Scientifique & Conseil Agricole Conforme Normes INERA / CSP-CILSS", 105, 24, { align: "center" });

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Date d'émission : ${today}`, 14, 34);
      doc.text(`Praticien / Conseiller : ${profile?.full_name || "Conseiller Agronome NAFA - AGRITECH"}`, 14, 40);
      doc.text(`Contact plateforme : +226 75774852 / 50134920`, 14, 46);

      doc.setLineWidth(0.3);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 50, 196, 50);

      // Section Exploitant / Client
      doc.setFontSize(11);
      doc.setTextColor(24, 120, 60);
      doc.text("IDENTIFICATION DU BÉNÉFICIAIRE & PARCELLE", 14, 58);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`Nom de l'exploitant : ${clientName || "Non renseigné"}`, 14, 65);
      if (clientPhone) doc.text(`Téléphone : ${clientPhone}`, 14, 71);
      doc.text(`Parcelle / Localisation : ${parcel || "Non spécifiée"}`, 14, clientPhone ? 77 : 71);
      doc.text(`Culture concernée : ${crop || "Non spécifiée"}`, 14, clientPhone ? 83 : 77);

      // Section Diagnostic
      const diagY = clientPhone ? 93 : 87;
      doc.setFontSize(11);
      doc.setTextColor(24, 120, 60);
      doc.text("DIAGNOSTIC AGRONOMIQUE ÉTABLI", 14, diagY);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      const diagSplit = doc.splitTextToSize(diagnosis || "Observation et diagnostic phytosanitaire de terrain.", 180);
      doc.text(diagSplit, 14, diagY + 6);

      // Section Prescriptions & Produits
      let y = diagY + 6 + diagSplit.length * 4 + 6;
      doc.setFontSize(11);
      doc.setTextColor(24, 120, 60);
      doc.text("PRESCRIPTIONS TECHNIQUES (BIO & CHIMIQUE HOMOLOGUÉ CSP)", 14, y);
      y += 4;
      doc.line(14, y, 196, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text("Produit / Matière", 14, y);
      doc.text("Dose recommandée", 70, y);
      doc.text("Surface / Volume", 110, y);
      doc.text("Mode d'application", 145, y);
      doc.text("DAR", 182, y);
      y += 2;
      doc.line(14, y, 196, y);
      y += 5;

      doc.setTextColor(0, 0, 0);
      lines.forEach(l => {
        doc.text(l.product || "—", 14, y);
        doc.text(l.dose || "—", 70, y);
        doc.text(l.surface || "—", 110, y);
        doc.text(l.mode || "—", 145, y);
        doc.text(l.dar || "—", 182, y);
        y += 6;
      });

      // Section Recommandations
      if (recommendations) {
        y += 4;
        doc.setFontSize(11);
        doc.setTextColor(24, 120, 60);
        doc.text("RECOMMANDATIONS PROPHYLACTIQUES & SÉCURITÉ", 14, y);
        y += 5;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8.5);
        const recSplit = doc.splitTextToSize(recommendations, 180);
        doc.text(recSplit, 14, y);
        y += recSplit.length * 4;
      }

      // Mentions légales & Signature
      y = Math.max(y + 8, 250);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Respecter impérativement les Délais Avant Récolte (DAR) et les équipements de protection (EPI).", 14, y);
      doc.text("NAFA - AGRITECH • Bobo-Dioulasso, Burkina Faso • nafaagritech@gmail.com • +226 75774852 / 50134920", 14, y + 4);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.text("Cachet & Signature du Conseiller :", 125, y - 6);
      doc.line(125, y + 10, 196, y + 10);

      const fileName = `ordonnance-${(clientName || "exploitant").replace(/[^a-zA-Z0-9]/g, "_")}-${today.replace(/\//g, "-")}.pdf`;
      doc.save(fileName);
      toast({ title: "Ordonnance générée avec succès", description: `Fichier téléchargé : ${fileName}` });

      // Archivage sécurisé en base distante si connecté
      if (user) {
        setSaving(true);
        try {
          await supabase.from("expert_prescriptions").insert({
            expert_id: user.id,
            client_user_id: user.id,
            title: `Ordonnance ${clientName || "Client"} - ${today}`,
            content: { clientName, clientPhone, parcel, crop, diagnosis, lines, recommendations } as any,
          });
          toast({ title: "Ordonnance archivée dans le dossier client" });
        } catch (dbErr) {
          console.warn("Archivage serveur ignoré :", dbErr);
        } finally {
          setSaving(false);
        }
      }

      if (onClose) onClose();
    } catch (e: any) {
      toast({ title: "Erreur de génération", description: e.message || "Impossible de générer le document.", variant: "destructive" });
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold">Nom de l'exploitant / Client *</Label>
          <Input placeholder="Ex: Oumarou Sawadogo" value={clientName} onChange={e => setClientName(e.target.value)} className="h-9 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Téléphone de l'exploitant</Label>
          <Input placeholder="+226 70 00 00 00" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="h-9 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Parcelle / Localité</Label>
          <Input placeholder="Ex: Parcelle Nord - Bama" value={parcel} onChange={e => setParcel(e.target.value)} className="h-9 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Culture concernée</Label>
          <Input placeholder="Ex: Maïs / Niébé / Tomate" value={crop} onChange={e => setCrop(e.target.value)} className="h-9 text-sm mt-1" />
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold">Diagnostic agronomique posé</Label>
        <Textarea rows={2} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="Description de l'attaque ou de la carence..." className="text-xs mt-1" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Prescriptions produits & dosages (Bio / Chimie)</Label>
          <Button size="sm" variant="outline" onClick={addLine} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Ajouter un produit
          </Button>
        </div>
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
            <Input className="col-span-3 h-8 text-xs" placeholder="Produit / Préparation" value={l.product} onChange={e => upd(i, "product", e.target.value)} />
            <Input className="col-span-2 h-8 text-xs" placeholder="Dose (ex: 50g/L)" value={l.dose} onChange={e => upd(i, "dose", e.target.value)} />
            <Input className="col-span-2 h-8 text-xs" placeholder="Surface / Vol" value={l.surface} onChange={e => upd(i, "surface", e.target.value)} />
            <Input className="col-span-3 h-8 text-xs" placeholder="Mode d'application" value={l.mode} onChange={e => upd(i, "mode", e.target.value)} />
            <Input className="col-span-1 h-8 text-xs" placeholder="DAR" value={l.dar} onChange={e => upd(i, "dar", e.target.value)} />
            <Button size="icon" variant="ghost" className="col-span-1 h-8 w-8 text-destructive" onClick={() => rmLine(i)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div>
        <Label className="text-xs font-semibold">Recommandations prophylactiques & Prévention INERA</Label>
        <Textarea rows={2} value={recommendations} onChange={e => setRecommendations(e.target.value)} placeholder="Pratiques culturales, aération, rotation..." className="text-xs mt-1" />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button className="flex-1 gradient-primary text-primary-foreground font-semibold h-10" onClick={generatePdf} disabled={saving || !clientName}>
          <FileDown className="h-4 w-4 mr-2" /> Télécharger l'Ordonnance PDF Officielle
        </Button>
        {onClose && (
          <Button variant="outline" className="h-10" onClick={onClose}>
            Fermer
          </Button>
        )}
      </div>
    </Card>
  );
}
