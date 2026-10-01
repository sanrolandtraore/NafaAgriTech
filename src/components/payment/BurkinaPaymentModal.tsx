import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  CreditCard,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  BurkinaPaymentProvider,
  BURKINA_PAYMENT_PROVIDERS,
  PaymentContext,
  burkinaPaymentAggregator,
  PaymentTransaction,
} from "@/lib/burkinaPaymentAggregator";

interface BurkinaPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  amount: number; // En FCFA
  context: PaymentContext;
  beneficiaryType: "nafa_agritech" | "partner";
  partnerId?: string;
  partnerName?: string;
  defaultPayerPhone?: string;
  defaultPayerName?: string;
  onSuccess: (transaction: PaymentTransaction) => void;
}

export const BurkinaPaymentModal: React.FC<BurkinaPaymentModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  amount,
  context,
  beneficiaryType,
  partnerId,
  partnerName,
  defaultPayerPhone = "+226 ",
  defaultPayerName = "",
  onSuccess,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<BurkinaPaymentProvider>("orange_money");
  const [payerPhone, setPayerPhone] = useState(defaultPayerPhone);
  const [payerName, setPayerName] = useState(defaultPayerName);
  const [payerEmail, setPayerEmail] = useState("");
  
  // Carte Bancaire
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [processing, setProcessing] = useState(false);
  const [completedTx, setCompletedTx] = useState<PaymentTransaction | null>(null);
  const [copiedUssd, setCopiedUssd] = useState(false);

  const meta = BURKINA_PAYMENT_PROVIDERS[selectedProvider];
  const feeAmount = Math.round((amount * meta.feePercentage) / 100);
  const totalAmount = amount + feeAmount;
  const ussdCode = burkinaPaymentAggregator.getUssdDialCode(selectedProvider, totalAmount);

  const handleCopyUssd = () => {
    if (ussdCode) {
      navigator.clipboard.writeText(ussdCode);
      setCopiedUssd(true);
      toast.success("Code USSD copié dans le presse-papier !");
      setTimeout(() => setCopiedUssd(false), 2500);
    }
  };

  const handleExecutePayment = async () => {
    if (selectedProvider !== "carte_bancaire" && selectedProvider !== "virement_bancaire") {
      if (!payerPhone.trim() || payerPhone.trim() === "+226" || payerPhone.replace(/\D/g, "").length < 8) {
        toast.error("Veuillez saisir un numéro de téléphone valide au Burkina Faso (+226)");
        return;
      }
    }

    if (selectedProvider === "carte_bancaire") {
      if (!cardNumber.trim() || cardNumber.replace(/\D/g, "").length < 16) {
        toast.error("Veuillez saisir un numéro de carte bancaire valide à 16 chiffres");
        return;
      }
      if (!cardExpiry.trim()) {
        toast.error("Veuillez saisir la date d'expiration (MM/AA)");
        return;
      }
      if (!cardCvv.trim() || cardCvv.length < 3) {
        toast.error("Veuillez saisir le code CVV à 3 chiffres");
        return;
      }
    }

    setProcessing(true);
    try {
      const res = await burkinaPaymentAggregator.processPayment({
        provider: selectedProvider,
        context,
        amount,
        payerPhone,
        payerName: payerName || "Client NAFA",
        payerEmail,
        beneficiaryType,
        partnerId,
        partnerName,
        description: title,
        cardDetails: selectedProvider === "carte_bancaire" ? {
          cardNumber,
          cardHolder: cardHolder || payerName,
          expiry: cardExpiry,
          cvv: cardCvv,
        } : undefined,
      });

      if (res.success) {
        setCompletedTx(res.transaction);
        toast.success(res.message);
        onSuccess(res.transaction);
      }
    } catch (err: any) {
      toast.error(err?.message || "Échec de traitement du paiement");
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setCompletedTx(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-2 border-emerald-500/20 shadow-2xl">
        {/* En-tête officiel NAFA Pay */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-white text-base">
                💳
              </div>
              <div>
                <h3 className="text-base font-extrabold font-heading tracking-tight flex items-center gap-2">
                  NAFA Pay — Agrégateur Burkina Faso
                </h3>
                <p className="text-[11px] text-emerald-100/80">
                  Paiement sécurisé multi-opérateurs & séquestre garanti
                </p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 text-[10px] font-bold">
              {context === "partner_subscription" ? "Abonnement Officiel" : "Séquestre Garanti"}
            </Badge>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-baseline justify-between">
            <span className="text-xs text-emerald-100 font-medium">{title}</span>
            <div className="text-right">
              <span className="text-2xl font-black font-heading text-amber-300">
                {amount.toLocaleString("fr-FR")} FCFA
              </span>
              {feeAmount > 0 && (
                <p className="text-[10px] text-emerald-200">
                  + {feeAmount.toLocaleString("fr-FR")} FCFA ({meta.feePercentage}% frais réseau) = {totalAmount.toLocaleString("fr-FR")} FCFA
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Corps du modal */}
        {completedTx ? (
          /* Écran de confirmation de paiement réussi */
          <div className="p-6 space-y-5 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <h4 className="text-lg font-heading font-extrabold text-foreground">
                Paiement Validé avec Succès !
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                La transaction a été confirmée et traitée par l'opérateur {BURKINA_PAYMENT_PROVIDERS[completedTx.provider].name}.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border border-border/80 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Référence Opérateur :</span>
                <span className="font-mono font-bold text-foreground">{completedTx.operatorReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Moyen de paiement :</span>
                <span className="font-bold text-foreground">{BURKINA_PAYMENT_PROVIDERS[completedTx.provider].shortName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant net :</span>
                <span className="font-bold text-emerald-600">{completedTx.amount.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut des fonds :</span>
                <Badge className={completedTx.status === "en_sequestre" ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"}>
                  {completedTx.status === "en_sequestre" ? "Consigné sous Séquestre NAFA" : "Crédité / Actif"}
                </Badge>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleClose} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl">
                Continuer sur NAFA-AGRITECH <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          /* Formulaire de sélection d'opérateur et saisie */
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* 1. Sélection de l'opérateur populaire */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Choisissez votre moyen de paiement au Burkina Faso
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["orange_money", "moov_money", "wave", "carte_bancaire"] as BurkinaPaymentProvider[]).map((provId) => {
                  const p = BURKINA_PAYMENT_PROVIDERS[provId];
                  const isSelected = selectedProvider === provId;
                  return (
                    <button
                      key={provId}
                      type="button"
                      onClick={() => setSelectedProvider(provId)}
                      className={`p-3 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-500/10 shadow-sm"
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-black text-white"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.logoText}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                      </div>
                      <span className="text-xs font-bold text-foreground leading-tight">
                        {p.shortName}
                      </span>
                      {p.popularBadge && (
                        <span className="text-[9px] text-muted-foreground mt-0.5">
                          {p.popularBadge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Détails selon l'opérateur choisi */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Paiement via {meta.name}
                </span>
                <span className="text-[11px] text-muted-foreground">Frais : {meta.feePercentage}%</span>
              </div>

              {/* Mobile Money (Orange Money / Moov Money / Wave) */}
              {selectedProvider !== "carte_bancaire" && selectedProvider !== "virement_bancaire" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Numéro de téléphone {meta.shortName} *</Label>
                    <Input
                      placeholder="+226 70 XX XX XX"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      className="h-10 text-xs font-medium mt-1 bg-background"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Une demande d'autorisation de débit de <strong>{totalAmount.toLocaleString("fr-FR")} FCFA</strong> sera envoyée sur votre téléphone.
                    </p>
                  </div>

                  {/* USSD Syntaxe Rapide */}
                  {ussdCode && (
                    <div className="p-2.5 rounded-lg bg-background border border-border flex items-center justify-between gap-2">
                      <div className="text-[11px]">
                        <span className="text-muted-foreground">Code USSD direct : </span>
                        <code className="font-mono font-bold text-foreground">{ussdCode}</code>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyUssd}
                        className="h-7 text-xs px-2"
                      >
                        {copiedUssd ? <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {copiedUssd ? "Copié" : "Copier"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Carte Bancaire */}
              {selectedProvider === "carte_bancaire" && (
                <div className="space-y-2.5">
                  <div>
                    <Label className="text-xs">Numéro de carte (16 chiffres) *</Label>
                    <Input
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="h-10 text-xs font-mono mt-1 bg-background"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Expiration (MM/AA) *</Label>
                      <Input
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="h-10 text-xs font-mono mt-1 bg-background"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CVV (3 chiffres) *</Label>
                      <Input
                        type="password"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="h-10 text-xs font-mono mt-1 bg-background"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Nom du titulaire de la carte</Label>
                    <Input
                      placeholder="Ex: OUEDRAOGO MOUSSA"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="h-10 text-xs mt-1 bg-background"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Note Séquestre Garanti */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {context === "partner_subscription"
                  ? "Paiement direct à NAFA-AGRITECH. Votre abonnement partenaire sera activé immédiatement avec visibilité prioritaire sur le Marketplace."
                  : "Séquestre Garanti NAFA : Vos fonds sont bloqués en sécurité. Le partenaire ne sera payé qu'après validation de la livraison ou fin de travaux."}
              </span>
            </div>

            {/* Boutons d'action */}
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={processing}
                className="h-11 rounded-xl text-xs"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleExecutePayment}
                disabled={processing}
                className="h-11 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex-1 sm:flex-initial"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion réseau opérateur...
                  </>
                ) : (
                  `Confirmer & Payer ${totalAmount.toLocaleString("fr-FR")} FCFA`
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BurkinaPaymentModal;
