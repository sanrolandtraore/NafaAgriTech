/**
 * Solveur d'optimisation linéaire exacte (Algorithme du Simplex en deux phases)
 * pour la formulation de rations à moindre coût et l'ingénierie agronomique.
 * 
 * Références scientifiques :
 * - Dantzig G.B. (1963) - Linear Programming and Extensions, Princeton University Press.
 * - Bazaraa M.S., Jarvis J.J., Sherali H.D. (2010) - Linear Programming and Network Flows.
 */

export interface LinearConstraint {
  /** Coefficients de la contrainte pour chaque variable [a1, a2, ..., an] */
  coefficients: number[];
  /** Type d'inégalité */
  operator: "<=" | ">=" | "=";
  /** Valeur limite à droite (RHS) */
  rhs: number;
  /** Nom descriptif de la contrainte (ex: "Protéines Brutes min") */
  name?: string;
}

export interface VariableBound {
  /** Borne inférieure (défaut = 0) */
  min?: number;
  /** Borne supérieure (optionnelle) */
  max?: number;
}

export interface LinearProgrammingProblem {
  /** Sens de l'optimisation */
  objective: "minimize" | "maximize";
  /** Coefficients du coût unitaire de la fonction objectif [c1, c2, ..., cn] */
  costCoefficients: number[];
  /** Liste des contraintes linéaires */
  constraints: LinearConstraint[];
  /** Bornes inférieures et supérieures de chaque variable */
  bounds?: VariableBound[];
}

export interface LinearProgrammingSolution {
  /** Le problème a-t-il une solution optimale réalisable ? */
  isFeasible: boolean;
  /** La solution est-elle non bornée ? */
  isUnbounded: boolean;
  /** Valeur de la fonction objectif optimale */
  optimalValue: number;
  /** Valeurs optimales des variables de décision */
  variableValues: number[];
  /** Nombre d'itérations Simplex exécutées */
  iterations: number;
  /** Message d'état (succès ou cause d'infaisabilité) */
  statusMessage: string;
}

/**
 * Résout un problème d'optimisation linéaire par la méthode du Simplex en deux phases.
 */
export function solveLinearProgram(problem: LinearProgrammingProblem): LinearProgrammingSolution {
  const numVars = problem.costCoefficients.length;
  if (numVars === 0) {
    throw new Error("La fonction objectif doit comporter au moins une variable.");
  }

  // Normalisation des bornes individuelles vers des contraintes explicites
  const allConstraints: LinearConstraint[] = [...problem.constraints];
  if (problem.bounds) {
    problem.bounds.forEach((b, idx) => {
      if (b.min !== undefined && b.min > 0) {
        const row = Array(numVars).fill(0);
        row[idx] = 1;
        allConstraints.push({ coefficients: row, operator: ">=", rhs: b.min, name: `Borne min var ${idx}` });
      }
      if (b.max !== undefined && Number.isFinite(b.max)) {
        const row = Array(numVars).fill(0);
        row[idx] = 1;
        allConstraints.push({ coefficients: row, operator: "<=", rhs: b.max, name: `Borne max var ${idx}` });
      }
    });
  }

  // Objectif : si maximization, on inverse les signes pour traiter sous forme standard de minimisation
  const isMin = problem.objective === "minimize";
  const c = problem.costCoefficients.map((v) => (isMin ? v : -v));

  // Construction du tableau Simplex sous forme standard
  // Forme : A * x + I_slack * s - I_surplus * e + I_art * a = b (avec b >= 0)
  const numConstraints = allConstraints.length;
  let numSlack = 0;
  let numSurplus = 0;
  let numArtificial = 0;

  for (const ct of allConstraints) {
    if (ct.operator === "<=") numSlack++;
    else if (ct.operator === ">=") {
      numSurplus++;
      numArtificial++;
    } else if (ct.operator === "=") {
      numArtificial++;
    }
  }

  const totalCols = numVars + numSlack + numSurplus + numArtificial + 1; // +1 pour RHS
  const totalRows = numConstraints + 1; // +1 pour ligne objectif

  // Matrice tableau initialisée à 0
  const table: number[][] = Array.from({ length: totalRows }, () => Array(totalCols).fill(0));
  const basis: number[] = Array(numConstraints).fill(-1);

  let slackIdx = numVars;
  let surplusIdx = numVars + numSlack;
  let artIdx = numVars + numSlack + numSurplus;

  for (let i = 0; i < numConstraints; i++) {
    const ct = allConstraints[i];
    let rhs = ct.rhs;
    let signFactor = 1;

    // Assurer que le membre de droite est positif ou nul
    if (rhs < 0) {
      rhs = -rhs;
      signFactor = -1;
    }

    for (let j = 0; j < numVars; j++) {
      table[i][j] = (ct.coefficients[j] ?? 0) * signFactor;
    }
    table[i][totalCols - 1] = rhs;

    const op = signFactor === -1 ? (ct.operator === "<=" ? ">=" : ct.operator === ">=" ? "<=" : "=") : ct.operator;

    if (op === "<=") {
      table[i][slackIdx] = 1;
      basis[i] = slackIdx;
      slackIdx++;
    } else if (op === ">=") {
      table[i][surplusIdx] = -1;
      surplusIdx++;
      table[i][artIdx] = 1;
      basis[i] = artIdx;
      artIdx++;
    } else if (op === "=") {
      table[i][artIdx] = 1;
      basis[i] = artIdx;
      artIdx++;
    }
  }

  // --- PHASE 1 : Si variables artificielles nécessaires pour trouver une base initiale admissible ---
  let iterations = 0;
  const maxIterations = 5000;

  if (numArtificial > 0) {
    // Fonction objectif de Phase 1 : minimiser la somme des variables artificielles
    const phase1Row = Array(totalCols).fill(0);
    const artColStart = numVars + numSlack + numSurplus;
    for (let cIdx = artColStart; cIdx < artColStart + numArtificial; cIdx++) {
      phase1Row[cIdx] = 1;
    }

    // Mise sous forme canonique de la ligne objectif de Phase 1 (élimination des variables de base)
    for (let i = 0; i < numConstraints; i++) {
      const bCol = basis[i];
      if (bCol >= artColStart && bCol < artColStart + numArtificial) {
        for (let j = 0; j < totalCols; j++) {
          phase1Row[j] -= table[i][j];
        }
      }
    }
    table[totalRows - 1] = phase1Row;

    // Itérations Simplex de Phase 1
    while (iterations++ < maxIterations) {
      // Trouver colonne entrante (coefficient le plus négatif)
      let enterCol = -1;
      let minVal = -1e-9;
      for (let j = 0; j < totalCols - 1; j++) {
        if (table[totalRows - 1][j] < minVal) {
          minVal = table[totalRows - 1][j];
          enterCol = j;
        }
      }
      if (enterCol === -1) break; // Optimalité de Phase 1 atteinte

      // Trouver ligne sortante (règle du ratio minimal)
      let leaveRow = -1;
      let minRatio = Infinity;
      for (let i = 0; i < numConstraints; i++) {
        const a = table[i][enterCol];
        if (a > 1e-9) {
          const ratio = table[i][totalCols - 1] / a;
          if (ratio < minRatio) {
            minRatio = ratio;
            leaveRow = i;
          }
        }
      }
      if (leaveRow === -1) {
        return {
          isFeasible: false,
          isUnbounded: true,
          optimalValue: 0,
          variableValues: Array(numVars).fill(0),
          iterations,
          statusMessage: "Problème non borné en Phase 1.",
        };
      }

      // Pivotage de Gauss-Jordan
      pivot(table, leaveRow, enterCol, totalRows, totalCols);
      basis[leaveRow] = enterCol;
    }

    const phase1Opt = table[totalRows - 1][totalCols - 1];
    if (Math.abs(phase1Opt) > 1e-5) {
      return {
        isFeasible: false,
        isUnbounded: false,
        optimalValue: 0,
        variableValues: Array(numVars).fill(0),
        iterations,
        statusMessage: "Problème infaisable : contraintes contradictoires ou impossibles à satisfaire simultanément.",
      };
    }
  }

  // --- PHASE 2 : Optimisation de la vraie fonction objectif ---
  const phase2Row = Array(totalCols).fill(0);
  for (let j = 0; j < numVars; j++) {
    phase2Row[j] = c[j];
  }

  // Élimination des variables de base de la ligne objectif
  for (let i = 0; i < numConstraints; i++) {
    const bCol = basis[i];
    const coef = phase2Row[bCol];
    if (Math.abs(coef) > 1e-12) {
      for (let j = 0; j < totalCols; j++) {
        phase2Row[j] -= coef * table[i][j];
      }
    }
  }
  table[totalRows - 1] = phase2Row;

  // Itérations Simplex de Phase 2
  while (iterations++ < maxIterations) {
    let enterCol = -1;
    let minVal = -1e-9;
    // Les variables artificielles ne sont plus candidates
    const validColLimit = numVars + numSlack + numSurplus;
    for (let j = 0; j < validColLimit; j++) {
      if (table[totalRows - 1][j] < minVal) {
        minVal = table[totalRows - 1][j];
        enterCol = j;
      }
    }
    if (enterCol === -1) break; // Solution optimale atteinte

    let leaveRow = -1;
    let minRatio = Infinity;
    for (let i = 0; i < numConstraints; i++) {
      const a = table[i][enterCol];
      if (a > 1e-9) {
        const ratio = table[i][totalCols - 1] / a;
        if (ratio < minRatio) {
          minRatio = ratio;
          leaveRow = i;
        }
      }
    }
    if (leaveRow === -1) {
      return {
        isFeasible: true,
        isUnbounded: true,
        optimalValue: Infinity,
        variableValues: Array(numVars).fill(0),
        iterations,
        statusMessage: "Solution non bornée (coût infini ou indéfini).",
      };
    }

    pivot(table, leaveRow, enterCol, totalRows, totalCols);
    basis[leaveRow] = enterCol;
  }

  // Extraction de la solution
  const variableValues = Array(numVars).fill(0);
  for (let i = 0; i < numConstraints; i++) {
    const bCol = basis[i];
    if (bCol >= 0 && bCol < numVars) {
      variableValues[bCol] = Math.max(0, table[i][totalCols - 1]);
    }
  }

  let finalObjectiveValue = 0;
  for (let j = 0; j < numVars; j++) {
    finalObjectiveValue += problem.costCoefficients[j] * variableValues[j];
  }

  return {
    isFeasible: true,
    isUnbounded: false,
    optimalValue: finalObjectiveValue,
    variableValues,
    iterations,
    statusMessage: "Solution optimale trouvée avec succès.",
  };
}

/** Opération de pivotage de Gauss-Jordan sur le tableau Simplex */
function pivot(table: number[][], pivotRow: number, pivotCol: number, rows: number, cols: number): void {
  const pivotVal = table[pivotRow][pivotCol];
  for (let j = 0; j < cols; j++) {
    table[pivotRow][j] /= pivotVal;
  }
  for (let i = 0; i < rows; i++) {
    if (i !== pivotRow) {
      const factor = table[i][pivotCol];
      if (Math.abs(factor) > 1e-14) {
        for (let j = 0; j < cols; j++) {
          table[i][j] -= factor * table[pivotRow][j];
        }
      }
    }
  }
}
