import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getEffectiveUserId } from "@/lib/deviceIdentity";
import {
  partnerInvoiceStorage,
  PartnerInvoice,
  InvoiceItem,
  InvoiceType,
  InvoiceStatus,
  formatFcfa,
  amountInWordsFrench,
} from "@/lib/partnerInvoiceStorage";
import { generatePartnerInvoicePdf } from "@/lib/partnerInvoicePdf";
import { partnerBrandingStorage } from "@/lib/partnerBrandingStorage";
import BackNavigationButton from "@/components/BackNavigationButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Receipt,
  Plus,
  FileText,
  Download,
  Trash2,
  Edit,
  Copy,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  Send,
  Building2,
  Phone,
  Calendar,
  Wallet,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const UNIT_OPTIONS = [
  "unité",
  "sac",
  "kg",
  "tonne",
  "litre",
  "prestation",
  "forfait",
  "jour",
  "hectare",
  "mètre",
  "plant",
  "boîte",
];

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
> = {
  brouillon: { label: "Brouillon", variant: "secondary", icon: Clock },
  envoyee: { label: "Envoyée", variant: "outline", icon: Send },
  validee: { label: "Validée", variant: "default", icon: CheckCircle2 },
  payee: { label: "Payée", variant: "default", icon: CheckCircle2 },
  annulee: { label: "Annulée", variant: "destructive", icon: Ban },
};

export default function PartnerInvoicesPage() {
  const { user } = useAuth();
  const partnerId = getEffectiveUserId(user?.id);

  const [invoices, setInvoices] = useState<PartnerInvoice[]>([]);
  const [filterType, setFilterType] = useState<"all" | "proforma" | "definitive">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // État du modal d'édition/création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PartnerInvoice | null>(null);

  // Formulaire local
  const [docType, setDocType] = useState<InvoiceType>("proforma");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientNifRccm, setClientNifRccm] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Espèces");
  const [paymentTerms, setPaymentTerms] = useState("Comptant à réception");
  const [bankDetails, setBankDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("envoyee");

  // Recharger les factures
  const loadInvoices = () => {
    const list = partnerInvoiceStorage.getAll(partnerId);
    setInvoices(list);
  };

  useEffect(() => {
    loadInvoices();
    const handleUpdate = () => loadInvoices();
    window.addEventListener("partner-invoices-updated", handleUpdate);
    return () => window.removeEventListener("partner-invoices-updated", handleUpdate);
  }, [partnerId]);

  // Initialiser un nouveau document
  const handleOpenCreate = (type: InvoiceType) => {
    const today = new Date().toISOString().split("T")[0];
    const defaultDue = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
    const newNumber = partnerInvoiceStorage.generateInvoiceNumber(partnerId, type);

    setEditingInvoice(null);
    setDocType(type);
    setInvoiceNumber(newNumber);
    setDate(today);
    setDueDate(defaultDue);
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setClientAddress("");
    setClientNifRccm("");
    setItems([
      {
        id: "item_1",
        designation: "",
        quantity: 1,
        unit: "unité",
        unitPrice: 0,
        total: 0,
      },
    ]);
    setDiscountPercent(0);
    setTaxRate(0);
    setPaymentMethod("Espèces");
    setPaymentTerms(type === "proforma" ? "Offre valable 30 jours" : "Comptant à réception");
    setBankDetails("");
    setNotes("");
    setStatus("envoyee");
    setIsModalOpen(true);
  };

  // Ouvrir en modification
  const handleOpenEdit = (inv: PartnerInvoice) => {
    setEditingInvoice(inv);
    setDocType(inv.type);
    setInvoiceNumber(inv.invoiceNumber);
    setDate(inv.date);
    setDueDate(inv.dueDate);
    setClientName(inv.client.name);
    setClientPhone(inv.client.phone);
    setClientEmail(inv.client.email || "");
    setClientAddress(inv.client.address || "");
    setClientNifRccm(inv.client.nifRccm || "");
    setItems(inv.items.length > 0 ? inv.items : [{
      id: "item_1",
      designation: "",
      quantity: 1,
      unit: "unité",
      unitPrice: 0,
      total: 0,
    }]);
    setDiscountPercent(inv.discountPercent || 0);
    setTaxRate(inv.taxRate || 0);
    setPaymentMethod(inv.paymentMethod || "Espèces");
    setPaymentTerms(inv.paymentTerms || "");
    setBankDetails(inv.bankDetails || "");
    setNotes(inv.notes || "");
    setStatus(inv.status);
    setIsModalOpen(true);
  };

  // Dupliquer un document existant
  const handleDuplicate = (inv: PartnerInvoice) => {
    const today = new Date().toISOString().split("T")[0];
    const defaultDue = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
    const newNumber = partnerInvoiceStorage.generateInvoiceNumber(partnerId, inv.type);

    const duplicated: PartnerInvoice = {
      ...inv,
      id: "inv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      invoiceNumber: newNumber,
      date: today,
      dueDate: defaultDue,
      status: "brouillon",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    partnerInvoiceStorage.save(partnerId, duplicated);
    toast.success(`Copie créée avec le numéro ${newNumber}.`);
  };

  // Convertir une proforma en facture définitive
  const handleConvertToDefinitive = (inv: PartnerInvoice) => {
    const definitive = partnerInvoiceStorage.convertProformaToDefinitive(partnerId, inv.id);
    if (definitive) {
      toast.success(`Facture commerciale ${definitive.invoiceNumber} générée avec succès.`);
    } else {
      toast.error("Impossible de convertir ce document.");
    }
  };

  // Supprimer
  const handleDelete = (id: string, num: string) => {
    if (window.confirm(`Confirmez-vous la suppression du document ${num} ?`)) {
      partnerInvoiceStorage.delete(partnerId, id);
      toast.success(`Document ${num} supprimé.`);
    }
  };

  // Gestion des lignes d'articles
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: "item_" + Date.now(),
        designation: "",
        quantity: 1,
        unit: "unité",
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          const q = field === "quantity" ? Number(value) || 0 : item.quantity;
          const p = field === "unitPrice" ? Number(value) || 0 : item.unitPrice;
          updated.total = Math.round(q * p);
        }
        return updated;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("La facture doit comporter au moins une ligne.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Calculs financiers
  const totals = useMemo(() => {
    return partnerInvoiceStorage.calculateTotals(items, discountPercent, taxRate);
  }, [items, discountPercent, taxRate]);

  // Sauvegarder
  const handleSaveDocument = (shouldDownloadPdf: boolean = false) => {
    if (!clientName.trim()) {
      toast.error("Veuillez renseigner le nom du client.");
      return;
    }
    if (!invoiceNumber.trim()) {
      toast.error("Veuillez renseigner le numéro de facture.");
      return;
    }
    const hasValidItem = items.some((it) => it.designation.trim() && it.quantity > 0);
    if (!hasValidItem) {
      toast.error("Veuillez renseigner au moins un article avec désignation et quantité.");
      return;
    }

    const docId = editingInvoice?.id || "inv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    const invoiceToSave: PartnerInvoice = {
      id: docId,
      partnerId,
      type: docType,
      invoiceNumber: invoiceNumber.trim(),
      date,
      dueDate,
      client: {
        name: clientName.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim() || undefined,
        address: clientAddress.trim() || undefined,
        nifRccm: clientNifRccm.trim() || undefined,
      },
      items: items.filter((it) => it.designation.trim()),
      subtotal: totals.subtotal,
      discountPercent,
      discountAmount: totals.discountAmount,
      taxRate,
      taxAmount: totals.taxAmount,
      totalTtc: totals.totalTtc,
      paymentMethod,
      paymentTerms,
      bankDetails: bankDetails.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      createdAt: editingInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    partnerInvoiceStorage.save(partnerId, invoiceToSave);
    toast.success(`Document ${invoiceToSave.invoiceNumber} enregistré avec succès.`);
    setIsModalOpen(false);

    if (shouldDownloadPdf) {
      handleDownloadPdf(invoiceToSave);
    }
  };

  // Télécharger le PDF
  const handleDownloadPdf = (inv: PartnerInvoice) => {
    try {
      const doc = generatePartnerInvoicePdf(inv);
      const filename = `${inv.type === "proforma" ? "Proforma" : "Facture"}_${inv.invoiceNumber}.pdf`;
      doc.save(filename);
      toast.success(`Fichier ${filename} téléchargé.`);
    } catch (e) {
      console.error("Erreur génération PDF:", e);
      toast.error("Erreur lors de la génération du document PDF.");
    }
  };

  // Filtrage
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterType !== "all" && inv.type !== filterType) return false;
      if (filterStatus !== "all" && inv.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = inv.client.name.toLowerCase().includes(query);
        const matchNum = inv.invoiceNumber.toLowerCase().includes(query);
        const matchPhone = inv.client.phone.includes(query);
        if (!matchName && !matchNum && !matchPhone) return false;
      }
      return true;
    });
  }, [invoices, filterType, filterStatus, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    const totalDefinitive = invoices
      .filter((i) => i.type === "definitive" && i.status !== "annulee")
      .reduce((acc, i) => acc + i.totalTtc, 0);

    const totalPaid = invoices
      .filter((i) => i.type === "definitive" && i.status === "payee")
      .reduce((acc, i) => acc + i.totalTtc, 0);

    const totalProforma = invoices
      .filter((i) => i.type === "proforma" && i.status !== "annulee")
      .reduce((acc, i) => acc + i.totalTtc, 0);

    const countPending = invoices.filter(
      (i) => i.type === "definitive" && (i.status === "envoyee" || i.status === "brouillon")
    ).length;

    return {
      totalDefinitive,
      totalPaid,
      totalProforma,
      countPending,
    };
  }, [invoices]);

  return (
    <div className="space-y-6 container max-w-7xl mx-auto px-4 py-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <BackNavigationButton fallbackTo="/dashboard" />
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-foreground flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              Facturation & Devis Proforma
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Générez, convertissez et téléchargez des factures proforma et factures commerciales certifiées.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => handleOpenCreate("proforma")}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10 gap-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            Créer une Facture Proforma
          </Button>
          <Button
            onClick={() => handleOpenCreate("definitive")}
            className="gradient-primary text-primary-foreground gap-2 font-medium"
          >
            <Plus className="h-4 w-4" />
            Créer une Facture Définitive
          </Button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Facturation Commerciale
            </CardDescription>
            <CardTitle className="text-xl font-bold flex items-center justify-between">
              <span>{formatFcfa(stats.totalDefinitive)}</span>
              <DollarSign className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Total facturé définitif
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Règlements Encaissés
            </CardDescription>
            <CardTitle className="text-xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
              <span>{formatFcfa(stats.totalPaid)}</span>
              <Wallet className="h-5 w-5 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Factures marquées payées
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              Proformas en Cours
            </CardDescription>
            <CardTitle className="text-xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>{formatFcfa(stats.totalProforma)}</span>
              <FileText className="h-5 w-5 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Offres proformas chiffrées
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">
              En Attente de Règlement
            </CardDescription>
            <CardTitle className="text-xl font-bold flex items-center justify-between">
              <span>{stats.countPending}</span>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Factures en attente d'encaissement
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par client, numéro ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Filtre type */}
              <div className="flex rounded-md border p-1 bg-muted/40">
                <Button
                  size="sm"
                  variant={filterType === "all" ? "default" : "ghost"}
                  onClick={() => setFilterType("all")}
                  className="h-7 text-xs px-2.5"
                >
                  Tous ({invoices.length})
                </Button>
                <Button
                  size="sm"
                  variant={filterType === "proforma" ? "default" : "ghost"}
                  onClick={() => setFilterType("proforma")}
                  className="h-7 text-xs px-2.5"
                >
                  Proformas ({invoices.filter((i) => i.type === "proforma").length})
                </Button>
                <Button
                  size="sm"
                  variant={filterType === "definitive" ? "default" : "ghost"}
                  onClick={() => setFilterType("definitive")}
                  className="h-7 text-xs px-2.5"
                >
                  Définitives ({invoices.filter((i) => i.type === "definitive").length})
                </Button>
              </div>

              {/* Filtre statut */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="envoyee">Envoyée</SelectItem>
                  <SelectItem value="validee">Validée</SelectItem>
                  <SelectItem value="payee">Payée</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des factures */}
      {filteredInvoices.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto stroke-1" />
            <h3 className="text-lg font-bold">Aucune facture pour le moment</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Vous pouvez émettre une facture proforma pour un devis commercial ou une facture définitive pour vos livraisons d'intrants, matériels et services.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={() => handleOpenCreate("proforma")} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Proforma
              </Button>
              <Button onClick={() => handleOpenCreate("definitive")} className="gap-2 gradient-primary text-primary-foreground">
                <Plus className="h-4 w-4" />
                Nouvelle Facture Définitive
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const statusInfo = STATUS_CONFIG[inv.status] || STATUS_CONFIG.envoyee;
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={inv.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Informations principales */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-base text-foreground">
                        {inv.invoiceNumber}
                      </span>
                      <Badge
                        variant={inv.type === "proforma" ? "outline" : "default"}
                        className={
                          inv.type === "proforma"
                            ? "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 font-semibold text-xs"
                            : "bg-primary text-primary-foreground font-semibold text-xs"
                        }
                      >
                        {inv.type === "proforma" ? "Facture Proforma" : "Facture Définitive"}
                      </Badge>
                      <Badge variant={statusInfo.variant} className="gap-1 text-xs font-medium">
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {inv.client.name}
                      </span>
                      {inv.client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {inv.client.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Émise le {inv.date} • Échéance : {inv.dueDate}
                      </span>
                      <span>
                        {inv.items.length} ligne{inv.items.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Montant & Actions */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0">
                    <div className="text-left lg:text-right pr-2">
                      <div className="text-xs text-muted-foreground">Net à payer TTC</div>
                      <div className="text-lg font-bold text-primary font-mono">
                        {formatFcfa(inv.totalTtc)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Télécharger PDF */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPdf(inv)}
                        title="Télécharger le PDF officiel"
                        className="h-8 gap-1 text-xs"
                      >
                        <Download className="h-3.5 w-3.5 text-primary" />
                        PDF
                      </Button>

                      {/* Convertir proforma -> facture */}
                      {inv.type === "proforma" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleConvertToDefinitive(inv)}
                          title="Convertir en Facture Définitive"
                          className="h-8 gap-1 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          Facturer
                        </Button>
                      )}

                      {/* Dupliquer */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDuplicate(inv)}
                        title="Dupliquer"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>

                      {/* Modifier */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(inv)}
                        title="Modifier"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      {/* Supprimer */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                        title="Supprimer"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Création / Édition */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Receipt className="h-5 w-5 text-primary" />
              {editingInvoice ? "Modifier le document" : `Nouvelle ${docType === "proforma" ? "Facture Proforma" : "Facture Commerciale"}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Section 1 : Paramètres du document */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/30 border">
              <div>
                <Label className="text-xs font-bold">Type de Document *</Label>
                <Select
                  value={docType}
                  onValueChange={(val: InvoiceType) => {
                    setDocType(val);
                    if (!editingInvoice) {
                      setInvoiceNumber(partnerInvoiceStorage.generateInvoiceNumber(partnerId, val));
                    }
                  }}
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proforma">Facture Proforma</SelectItem>
                    <SelectItem value="definitive">Facture Définitive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold">N° de Facture *</Label>
                <Input
                  className="mt-1 h-9 font-mono font-medium"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="EX: PRO-2026-0001"
                />
              </div>

              <div>
                <Label className="text-xs font-bold">Date d'émission *</Label>
                <Input
                  type="date"
                  className="mt-1 h-9"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs font-bold">
                  {docType === "proforma" ? "Date de validité *" : "Date d'échéance *"}
                </Label>
                <Input
                  type="date"
                  className="mt-1 h-9"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Section 2 : Coordonnées Client */}
            <div className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Coordonnées du Client</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2">
                  <Label className="text-xs">Nom / Raison Sociale du Client *</Label>
                  <Input
                    placeholder="Ex: Coopérative Neerwaya de Komsilga"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Téléphone *</Label>
                  <Input
                    placeholder="+226 70 00 00 00"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Courriel (facultatif)</Label>
                  <Input
                    type="email"
                    placeholder="client@domaine.bf"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Ville / Adresse</Label>
                  <Input
                    placeholder="Ouagadougou, Secteur 15"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">NIF / IFU / RCCM (facultatif)</Label>
                  <Input
                    placeholder="Ex: 00012345Z"
                    value={clientNifRccm}
                    onChange={(e) => setClientNifRccm(e.target.value)}
                    className="mt-1 h-9 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3 : Lignes de facturation */}
            <div className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Articles & Prestations</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                  className="gap-1.5 h-8 text-xs border-primary text-primary hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter une ligne
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded bg-muted/20 border"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <Label className="text-[10px] text-muted-foreground sm:hidden">Désignation</Label>
                      <Input
                        placeholder={`Désignation ligne ${index + 1}`}
                        value={item.designation}
                        onChange={(e) => handleUpdateItem(item.id, "designation", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-[10px] text-muted-foreground sm:hidden">Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity || ""}
                        onChange={(e) => handleUpdateItem(item.id, "quantity", e.target.value)}
                        className="h-8 text-xs text-center"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-[10px] text-muted-foreground sm:hidden">Unité</Label>
                      <Select
                        value={item.unit}
                        onValueChange={(val) => handleUpdateItem(item.id, "unit", val)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((u) => (
                            <SelectItem key={u} value={u} className="text-xs">
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <Label className="text-[10px] text-muted-foreground sm:hidden">Prix U. (FCFA)</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Prix U."
                        value={item.unitPrice || ""}
                        onChange={(e) => handleUpdateItem(item.id, "unitPrice", e.target.value)}
                        className="h-8 text-xs text-right font-mono"
                      />
                    </div>

                    <div className="col-span-12 sm:col-span-1 flex items-center justify-between sm:justify-center">
                      <span className="text-xs font-mono font-bold sm:hidden">
                        Total: {formatFcfa(item.total)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4 : Totaux & Taxes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Modalités & Remarques */}
              <div className="space-y-3 p-4 rounded-lg border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Modalités & Informations Légales
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Mode de règlement</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Espèces">Espèces</SelectItem>
                        <SelectItem value="Orange Money">Orange Money</SelectItem>
                        <SelectItem value="Moov Money">Moov Money</SelectItem>
                        <SelectItem value="Virement bancaire">Virement bancaire</SelectItem>
                        <SelectItem value="Chèque">Chèque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Statut actuel</Label>
                    <Select value={status} onValueChange={(val: InvoiceStatus) => setStatus(val)}>
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="envoyee">Envoyée</SelectItem>
                        <SelectItem value="validee">Validée</SelectItem>
                        <SelectItem value="payee">Payée</SelectItem>
                        <SelectItem value="annulee">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Conditions de règlement</Label>
                  <Input
                    placeholder="Ex: Acompte de 50 % à la commande, solde à la livraison"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Coordonnées de paiement (Mobile Money / RIB)</Label>
                  <Input
                    placeholder="Ex: Orange Money : 70 00 00 00 / Coris Bank : BF01..."
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Notes particulières ou mentions</Label>
                  <Textarea
                    placeholder="Mentions légales, conditions de garantie, observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 text-xs min-h-[50px]"
                  />
                </div>
              </div>

              {/* Récapitulatif financier chiffré */}
              <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Récapitulatif Financier
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-muted-foreground">Total HT brut :</span>
                    <span className="font-mono font-medium">{formatFcfa(totals.subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-1 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Remise commerciale :</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                          className="h-7 w-16 text-xs text-center"
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                    <span className="font-mono text-muted-foreground">
                      - {formatFcfa(totals.discountAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 py-1 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Taux de TVA :</span>
                      <Select
                        value={String(taxRate)}
                        onValueChange={(val) => setTaxRate(Number(val))}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 % (Exonéré)</SelectItem>
                          <SelectItem value="18">18 % (Standard)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="font-mono text-muted-foreground">
                      {formatFcfa(totals.taxAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3 bg-primary/10 rounded-md px-3 mt-2 border border-primary/20">
                    <span className="text-base font-bold text-foreground">Net à payer TTC :</span>
                    <span className="text-xl font-bold font-mono text-primary">
                      {formatFcfa(totals.totalTtc)}
                    </span>
                  </div>

                  {/* Montant en toutes lettres */}
                  <div className="p-2.5 rounded bg-background border text-xs">
                    <span className="font-semibold text-muted-foreground block mb-0.5">
                      Arrêtée la présente facture à la somme de :
                    </span>
                    <span className="italic text-foreground">
                      {amountInWordsFrench(totals.totalTtc)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSaveDocument(false)}
              className="gap-2"
            >
              Enregistrer
            </Button>
            <Button
              onClick={() => handleSaveDocument(true)}
              className="gradient-primary text-primary-foreground gap-2 font-bold"
            >
              <Download className="h-4 w-4" />
              Enregistrer & Télécharger PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
