/**
 * Traçabilité des résultats de calcul.
 *
 * Chaque moteur d'ingénierie renvoie un objet `Provenance` qui décrit
 * précisément comment le résultat a été obtenu : méthodes, références
 * bibliographiques, hypothèses et avertissements de domaine de validité.
 * Aucune valeur affichée à l'utilisateur ne doit exister sans sa provenance.
 */

export interface MethodReference {
  /** Nom court de la méthode, ex. "Colebrook-White". */
  name: string;
  /** Référence bibliographique vérifiable. */
  reference: string;
}

export interface Provenance {
  engine: string;
  engineVersion: string;
  methods: MethodReference[];
  assumptions: string[];
  validityWarnings: string[];
}

export function createProvenance(
  engine: string,
  engineVersion: string,
  methods: MethodReference[],
  assumptions: string[] = [],
  validityWarnings: string[] = [],
): Provenance {
  return {
    engine,
    engineVersion,
    methods: [...methods],
    assumptions: [...assumptions],
    validityWarnings: [...validityWarnings],
  };
}
