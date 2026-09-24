import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Package,
  Award,
  Eye,
  Heart,
  Handshake,
  FileText,
  Store,
  BarChart3,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Star,
  ShieldCheck,
  TrendingUp,
  ShoppingCart,
  Target
} from "lucide-react";
import { toast } from "sonner";
import {
  DedicatedPartnerBundle,
  DedicatedPartnerService,
  DedicatedPartnerProduct,
  getDedicatedPartnerBundle,
  saveDedicatedPartnerBundle,
  addPartnerService,
  deletePartnerService,
  addPartnerProduct,
  deletePartnerProduct,
  updatePartnerOrderStatus,
  updatePartnerQuoteStatus,
} from "@/lib/partnerDedicatedStorage";

const VALID_TABS = [
  "dashboard",
  "presentation",
  "services",
  "produits",
  "realisations",
  "galerie",
  "avis",
  "contact",
  "devis",
  "commandes",
  "statistiques",
];

export const PartnerDedicatedSpace: React.FC = () => {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";
  const activeTab = VALID_TABS.includes(currentTab) ? currentTab : "dashboard";

  // Identifiant unique du partenaire pour isolation totale des données
  const partnerId = user?.id || "demo-partner-id";

  const [bundle, setBundle] = useState<DedicatedPartnerBundle>(() =>
    getDedicatedPartnerBundle(partnerId)
  );

  // Recharger le bundle si l'utilisateur change
  useEffect(() => {
    setBundle(getDedicatedPartnerBundle(partnerId));
  }, [partnerId]);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  // Formulaire d'ajout de service
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    priceEstimate: "",
    turnaroundTime: "",
    category: "Général",
    isAvailable: true,
  });
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  // Formulaire d'ajout de produit
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
    unit: "Unité",
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80",
    category: "Intrants & Matériel",
    isAvailable: true,
  });
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  // Sauvegarde des modifications de Présentation
  const handleSavePresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveDedicatedPartnerBundle(partnerId, bundle);
    toast.success("Présentation de l'entreprise mise à jour !");
  };

  // Sauvegarde des coordonnées de Contact
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveDedicatedPartnerBundle(partnerId, bundle);
    toast.success("Coordonnées de contact mises à jour !");
  };

  // Ajout de Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.title.trim()) {
      toast.error("Veuillez renseigner le nom du service.");
      return;
    }
    const created = await addPartnerService(partnerId, newService);
    setBundle(getDedicatedPartnerBundle(partnerId));
    setIsServiceDialogOpen(false);
    setNewService({
      title: "",
      description: "",
      priceEstimate: "",
      turnaroundTime: "",
      category: "Général",
      isAvailable: true,
    });
    toast.success(`Service "${created.title}" ajouté avec succès !`);
  };

  // Suppression de Service
  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) return;
    await deletePartnerService(partnerId, id);
    setBundle(getDedicatedPartnerBundle(partnerId));
    toast.success("Service supprimé.");
  };

  // Ajout de Produit
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) {
      toast.error("Veuillez renseigner le nom du produit.");
      return;
    }
    const created = await addPartnerProduct(partnerId, newProduct);
    setBundle(getDedicatedPartnerBundle(partnerId));
    setIsProductDialogOpen(false);
    setNewProduct({
      name: "",
      description: "",
      price: 0,
      unit: "Unité",
      stock: 10,
      imageUrl: "https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80",
      category: "Intrants & Matériel",
      isAvailable: true,
    });
    toast.success(`Produit "${created.name}" ajouté avec succès !`);
  };

  // Suppression de Produit
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    await deletePartnerProduct(partnerId, id);
    setBundle(getDedicatedPartnerBundle(partnerId));
    toast.success("Produit retiré du catalogue.");
  };

  // Changement statut de commande
  const handleOrderStatusChange = async (orderId: string, status: any) => {
    await updatePartnerOrderStatus(partnerId, orderId, status);
    setBundle(getDedicatedPartnerBundle(partnerId));
    toast.success(`Statut de la commande mis à jour : ${status}`);
  };

  // Changement statut de devis
  const handleQuoteStatusChange = async (quoteId: string, status: any) => {
    await updatePartnerQuoteStatus(partnerId, quoteId, status);
    setBundle(getDedicatedPartnerBundle(partnerId));
    toast.success(`Statut du devis mis à jour : ${status}`);
  };

  // Calculs statistiques
  const totalRevenueFcfa = bundle.orders
    .filter((o) => o.status === "livree" || o.paymentStatus === "payé")
    .reduce((acc, curr) => acc + curr.totalAmountFcfa, 0);
  const totalQuotesValue = bundle.quotes.reduce((acc, curr) => acc + curr.estimatedAmountFcfa, 0);
  const averageRating =
    bundle.reviews.length > 0
      ? (bundle.reviews.reduce((acc, r) => acc + r.rating, 0) / bundle.reviews.length).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* En-tête Espace Partenaire Dédié */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={bundle.presentation.logoUrl}
              alt={bundle.presentation.companyName}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-emerald-400/50 shadow-md bg-white shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight">
                  {bundle.presentation.companyName}
                </h1>
                {bundle.presentation.isVerified && (
                  <Badge className="bg-emerald-500 hover:bg-emerald-400 text-white gap-1 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5" /> Entreprise Vérifiée
                  </Badge>
                )}
                <Badge variant="outline" className="border-emerald-400/40 text-emerald-100 text-xs">
                  {bundle.presentation.legalStatus}
                </Badge>
              </div>
              <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl">
                {bundle.presentation.tagline}
              </p>
              <div className="flex items-center gap-4 text-xs text-emerald-200/80 mt-2">
                <span>Agrément : {bundle.presentation.licenseNumber}</span>
                <span>•</span>
                <span>{bundle.presentation.yearsOfExperience} ans d'expérience</span>
                <span>•</span>
                <span>ID Partenaire : {partnerId.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-right shrink-0">
            <div className="text-xs text-emerald-200">Chiffre d'Affaires Réalisé</div>
            <div className="text-xl font-bold text-white">
              {totalRevenueFcfa.toLocaleString("fr-FR")} FCFA
            </div>
          </div>
        </div>
      </div>

      {/* Navigation stricte par les 11 sections réglementaires */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="overflow-x-auto pb-2 no-scrollbar">
          <TabsList className="bg-muted/70 p-1 rounded-xl h-auto flex flex-nowrap w-max gap-1">
            <TabsTrigger value="dashboard" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <LayoutDashboard className="h-3.5 w-3.5" /> Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="presentation" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <Building2 className="h-3.5 w-3.5" /> Présentation
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <ClipboardList className="h-3.5 w-3.5" /> Services ({bundle.services.length})
            </TabsTrigger>
            <TabsTrigger value="produits" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <Package className="h-3.5 w-3.5" /> Produits ({bundle.products.length})
            </TabsTrigger>
            <TabsTrigger value="realisations" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <Award className="h-3.5 w-3.5" /> Réalisations ({bundle.projects.length})
            </TabsTrigger>
            <TabsTrigger value="galerie" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <Eye className="h-3.5 w-3.5" /> Galerie ({bundle.gallery.length})
            </TabsTrigger>
            <TabsTrigger value="avis" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <Heart className="h-3.5 w-3.5" /> Avis ({bundle.reviews.length})
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <Handshake className="h-3.5 w-3.5" /> Contact
            </TabsTrigger>
            <TabsTrigger value="devis" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <FileText className="h-3.5 w-3.5" /> Devis ({bundle.quotes.length})
            </TabsTrigger>
            <TabsTrigger value="commandes" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <Store className="h-3.5 w-3.5" /> Commandes ({bundle.orders.length})
            </TabsTrigger>
            <TabsTrigger value="statistiques" className="gap-1.5 text-xs py-2 px-3 rounded-lg">
              <BarChart3 className="h-3.5 w-3.5" /> Statistiques
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. TABLEAU DE BORD */}
        <TabsContent value="dashboard" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Recettes Encaissées</p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {totalRevenueFcfa.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Commandes Totales</p>
                  <p className="text-lg font-bold text-foreground mt-1">{bundle.orders.length}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Devis Chiffrés</p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {totalQuotesValue.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Satisfaction Clients</p>
                  <p className="text-lg font-bold text-foreground mt-1 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {averageRating} / 5
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="h-4 w-4 text-emerald-600" /> Dernières Commandes Reçues
                </CardTitle>
                <CardDescription>Commandes directes passées auprès de votre entreprise.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bundle.orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{order.orderNumber} - {order.customerName}</div>
                      <div className="text-muted-foreground text-[11px] truncate max-w-[240px]">{order.items}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{order.totalAmountFcfa.toLocaleString("fr-FR")} F</div>
                      <Badge variant="outline" className="text-[10px] uppercase">{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" /> Demandes de Devis Récentes
                </CardTitle>
                <CardDescription>Devis sollicités par les exploitants et coopératives.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bundle.quotes.slice(0, 3).map((quote) => (
                  <div key={quote.id} className="p-3 rounded-xl border bg-muted/30 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground">{quote.clientName}</div>
                      <div className="text-muted-foreground text-[11px] truncate max-w-[240px]">{quote.serviceOrProduct}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{quote.estimatedAmountFcfa.toLocaleString("fr-FR")} F</div>
                      <Badge variant="outline" className="text-[10px] uppercase">{quote.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. PRÉSENTATION */}
        <TabsContent value="presentation" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fiche de Présentation Entreprise</CardTitle>
              <CardDescription>Informations publiques visibles par les clients sur la Marketplace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePresentation} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Raison Sociale / Nom Entreprise</Label>
                    <Input
                      id="companyName"
                      value={bundle.presentation.companyName}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          presentation: { ...bundle.presentation, companyName: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tagline">Slogan Professionnel</Label>
                    <Input
                      id="tagline"
                      value={bundle.presentation.tagline}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          presentation: { ...bundle.presentation, tagline: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description Détaillée</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={bundle.presentation.description}
                    onChange={(e) =>
                      setBundle({
                        ...bundle,
                        presentation: { ...bundle.presentation, description: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="legalStatus">Statut Juridique</Label>
                    <Input
                      id="legalStatus"
                      value={bundle.presentation.legalStatus}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          presentation: { ...bundle.presentation, legalStatus: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="licenseNumber">Numéro d'Agrément / RCCM</Label>
                    <Input
                      id="licenseNumber"
                      value={bundle.presentation.licenseNumber}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          presentation: { ...bundle.presentation, licenseNumber: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="yearsExp">Années d'Expérience</Label>
                    <Input
                      id="yearsExp"
                      type="number"
                      value={bundle.presentation.yearsOfExperience}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          presentation: {
                            ...bundle.presentation,
                            yearsOfExperience: parseInt(e.target.value, 10) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    Enregistrer la Présentation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. SERVICES */}
        <TabsContent value="services" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Catalogue de Prestations & Services</h2>
            <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5">
                  <Plus className="h-4 w-4" /> Ajouter un Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter une nouvelle prestation</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddService} className="space-y-3 text-xs pt-2">
                  <div className="space-y-1">
                    <Label>Intitulé du service</Label>
                    <Input
                      placeholder="Ex: Forage & Pompage solaire immergé"
                      value={newService.title}
                      onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Détails techniques de l'intervention..."
                      value={newService.description}
                      onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Tarif indicatif</Label>
                      <Input
                        placeholder="Ex: 50 000 F / jour"
                        value={newService.priceEstimate}
                        onChange={(e) => setNewService({ ...newService, priceEstimate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Délais d'intervention</Label>
                      <Input
                        placeholder="Ex: Sous 48 heures"
                        value={newService.turnaroundTime}
                        onChange={(e) => setNewService({ ...newService, turnaroundTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-emerald-600 text-white">
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundle.services.map((service) => (
              <Card key={service.id} className="relative">
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{service.title}</h3>
                      <Badge variant="outline" className="text-[10px] mt-1">{service.category}</Badge>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteService(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground">{service.description}</p>
                  <div className="pt-2 flex items-center justify-between font-semibold border-t">
                    <span className="text-emerald-600 dark:text-emerald-400">{service.priceEstimate}</span>
                    <span className="text-muted-foreground text-[11px]">{service.turnaroundTime}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 4. PRODUITS */}
        <TabsContent value="produits" className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Catalogue Produits & Stocks</h2>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5">
                  <Plus className="h-4 w-4" /> Ajouter un Produit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter un produit au catalogue</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-3 text-xs pt-2">
                  <div className="space-y-1">
                    <Label>Nom du produit</Label>
                    <Input
                      placeholder="Ex: Engrais minéral NPK 14-23-14"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Caractéristiques, dosage, certification..."
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label>Prix (FCFA)</Label>
                      <Input
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Unité</Label>
                      <Input
                        placeholder="Sac 50kg, Boîte..."
                        value={newProduct.unit}
                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value, 10) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>URL de l'image</Label>
                    <Input
                      value={newProduct.imageUrl}
                      onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" className="bg-emerald-600 text-white">
                      Enregistrer
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {bundle.products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <img src={product.imageUrl} alt={product.name} className="h-40 w-full object-cover" />
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{product.name}</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-700 shrink-0"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-[11px] line-clamp-2">{product.description}</p>
                  <div className="pt-2 flex items-center justify-between font-bold border-t">
                    <span className="text-emerald-600">{product.price.toLocaleString("fr-FR")} FCFA</span>
                    <span className="text-muted-foreground text-[10px]">Stock: {product.stock} {product.unit}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 5. RÉALISATIONS */}
        <TabsContent value="realisations" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundle.projects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <img src={project.imageUrl} alt={project.title} className="h-48 w-full object-cover" />
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{project.location}</Badge>
                    <span className="text-muted-foreground text-[11px]">{project.completionDate}</span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">{project.title}</h3>
                  <p className="text-muted-foreground">{project.description}</p>
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Impact : {project.results}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 6. GALERIE */}
        <TabsContent value="galerie" className="space-y-4 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {bundle.gallery.map((media) => (
              <div key={media.id} className="rounded-xl overflow-hidden border bg-card shadow-xs group">
                <img src={media.url} alt={media.title} className="h-36 w-full object-cover group-hover:scale-105 transition" />
                <div className="p-2 text-[11px] font-semibold text-foreground truncate">{media.title}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 7. AVIS */}
        <TabsContent value="avis" className="space-y-4 pt-2">
          <div className="space-y-3">
            {bundle.reviews.map((rev) => (
              <Card key={rev.id}>
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <span>{rev.authorName}</span>
                      <span className="text-muted-foreground font-normal">({rev.authorLocation})</span>
                    </div>
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(rev.rating) ? "fill-amber-400" : "text-gray-300"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{rev.comment}</p>
                  {rev.reply && (
                    <div className="p-2 rounded-lg bg-muted text-[11px] text-foreground mt-2 border-l-2 border-emerald-500">
                      <span className="font-semibold text-emerald-600">Réponse de l'entreprise : </span>
                      {rev.reply}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 8. CONTACT */}
        <TabsContent value="contact" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coordonnées Officielles & Localisation</CardTitle>
              <CardDescription>Permettez aux producteurs et techniciens de vous joindre facilement.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveContact} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Téléphone Appel Direct</Label>
                    <Input
                      id="phone"
                      value={bundle.contact.phone}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          contact: { ...bundle.contact, phone: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp">Numéro WhatsApp Commercial</Label>
                    <Input
                      id="whatsapp"
                      value={bundle.contact.whatsapp}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          contact: { ...bundle.contact, whatsapp: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Professionnel</Label>
                    <Input
                      id="email"
                      value={bundle.contact.email}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          contact: { ...bundle.contact, email: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="workingHours">Horaires d'Ouverture</Label>
                    <Input
                      id="workingHours"
                      value={bundle.contact.workingHours}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          contact: { ...bundle.contact, workingHours: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Adresse / Quartier</Label>
                    <Input
                      id="address"
                      value={bundle.contact.address}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          contact: { ...bundle.contact, address: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={bundle.contact.city}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          contact: { ...bundle.contact, city: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="region">Région</Label>
                    <Input
                      id="region"
                      value={bundle.contact.region}
                      onChange={(e) =>
                        setBundle({
                          ...bundle,
                          contact: { ...bundle.contact, region: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    Enregistrer les Coordonnées
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 9. DEVIS */}
        <TabsContent value="devis" className="space-y-4 pt-2">
          <div className="space-y-3">
            {bundle.quotes.map((quote) => (
              <Card key={quote.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-sm text-foreground">{quote.serviceOrProduct}</div>
                    <div className="text-muted-foreground mt-0.5">
                      Client : <span className="font-semibold text-foreground">{quote.clientName}</span> ({quote.clientPhone})
                    </div>
                    {quote.notes && <div className="text-[11px] text-muted-foreground italic mt-1">« {quote.notes} »</div>}
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="font-bold text-sm text-emerald-600">
                        {quote.estimatedAmountFcfa.toLocaleString("fr-FR")} FCFA
                      </div>
                      <div className="text-[10px] text-muted-foreground">{quote.date}</div>
                    </div>
                    <select
                      value={quote.status}
                      onChange={(e) => handleQuoteStatusChange(quote.id, e.target.value)}
                      className="h-8 rounded-lg border bg-background px-2 text-xs font-semibold"
                    >
                      <option value="reçu">Reçu</option>
                      <option value="chiffré">Chiffré</option>
                      <option value="envoyé">Envoyé</option>
                      <option value="accepté">Accepté</option>
                      <option value="refusé">Refusé</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 10. COMMANDES */}
        <TabsContent value="commandes" className="space-y-4 pt-2">
          <div className="space-y-3">
            {bundle.orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-sm text-foreground">
                      Commande #{order.orderNumber} - {order.customerName}
                    </div>
                    <div className="text-muted-foreground mt-0.5">{order.items}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">Téléphone : {order.customerPhone}</div>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="font-bold text-sm text-emerald-600">
                        {order.totalAmountFcfa.toLocaleString("fr-FR")} FCFA
                      </div>
                      <Badge variant="outline" className="text-[10px]">{order.paymentStatus}</Badge>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                      className="h-8 rounded-lg border bg-background px-2 text-xs font-semibold"
                    >
                      <option value="en_attente">En attente</option>
                      <option value="en_preparation">En préparation</option>
                      <option value="expediee">Expédiée</option>
                      <option value="livree">Livrée</option>
                      <option value="annulee">Annulée</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 11. STATISTIQUES */}
        <TabsContent value="statistiques" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Volume Global d'Affaires</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chiffre d'Affaires Encaissé :</span>
                  <span className="font-bold text-emerald-600">{totalRevenueFcfa.toLocaleString("fr-FR")} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Devis en Négociation :</span>
                  <span className="font-bold text-amber-600">{totalQuotesValue.toLocaleString("fr-FR")} F</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance Commerciale</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taux d'acceptation Devis :</span>
                  <span className="font-bold text-sky-600">
                    {bundle.quotes.length > 0
                      ? `${Math.round(
                          (bundle.quotes.filter((q) => q.status === "accepté").length / bundle.quotes.length) * 100
                        )}%`
                      : "0%"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commandes Livrées :</span>
                  <span className="font-bold text-emerald-600">
                    {bundle.orders.filter((o) => o.status === "livree").length} / {bundle.orders.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notoriété & Confiance</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Note Moyenne :</span>
                  <span className="font-bold text-amber-500">{averageRating} / 5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre d'Avis Clients :</span>
                  <span className="font-bold text-foreground">{bundle.reviews.length} avis</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default PartnerDedicatedSpace;
