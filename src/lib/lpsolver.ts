/**
 * ═══════════════════════════════════════════════════════════════
 * ULPSS - Universal Linear Programming Smart Solver
 * MOTEUR MATHEMATIQUE PRINCIPAL
 * ═══════════════════════════════════════════════════════════════
 *
 * Implements:
 *   - Graphical Method (exact intersections, feasible region)
 *   - Simplex Method (intermediate tableaux, Gauss pivots)
 *   - Duality (automatic construction, shadow prices)
 *   - Sensitivity analysis
 * ═══════════════════════════════════════════════════════════════
 */

import type {
  LPProblem,
  Constraint,
  ConstraintLine,
  IntersectionPoint,
  Vertex,
  GraphicSolution,
  SimplexTableau,
  SimplexSolution,
  DualProblem,
  DualityAnalysis,
  OptimizationType,
} from '@/types/lp';

// ──────────────────────────────────────────────────────────────
// MATHEMATICAL UTILITIES
// ──────────────────────────────────────────────────────────────

const EPS = 1e-9;

function eq(a: number, b: number): boolean {
  return Math.abs(a - b) < EPS;
}

function round(n: number, digits = 6): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

/** Solves a 2x2 system: a11*x + a12*y = b1, a21*x + a22*y = b2 */
function solve2x2(
  a11: number, a12: number, b1: number,
  a21: number, a22: number, b2: number
): [number, number] | null {
  const det = a11 * a22 - a12 * a21;
  if (Math.abs(det) < EPS) return null; // Parallel lines
  const x = (b1 * a22 - a12 * b2) / det;
  const y = (a11 * b2 - b1 * a21) / det;
  return [round(x), round(y)];
}

/** Checks if a point satisfies all constraints */
function isFeasible(point: number[], constraints: Constraint[]): boolean {
  if (point.some(v => v < -EPS)) return false;
  for (const c of constraints) {
    const lhs = c.coefficients.reduce((s, coef, i) => s + coef * point[i], 0);
    if (c.operator === '<=' && lhs > c.rhs + EPS) return false;
    if (c.operator === '>=' && lhs < c.rhs - EPS) return false;
    if (c.operator === '=' && !eq(lhs, c.rhs)) return false;
  }
  return true;
}

/** Evaluates Z at a given point */
function evaluateZ(point: number[], coefficients: number[]): number {
  return round(point.reduce((s, v, i) => s + coefficients[i] * v, 0));
}

/** Generates a label for a point (A, B, C, ...) */
function getVertexLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

// ──────────────────────────────────────────────────────────────
// GRAPHICAL METHOD
// ──────────────────────────────────────────────────────────────

/**
 * Converts a 2D constraint into a line for graphing.
 */
export function constraintToLine(
  constraint: Constraint,
  xMax: number,
  yMax: number
): ConstraintLine {
  const { coefficients: [a, b], rhs } = constraint;

  let xIntercept: number | null = null;
  let yIntercept: number | null = null;
  const points: number[][] = [];

  if (Math.abs(a) > EPS) {
    xIntercept = rhs / a;
  }
  if (Math.abs(b) > EPS) {
    yIntercept = rhs / b;
  }

  // Calculate two points to draw the line in the viewport
  if (Math.abs(a) > EPS && Math.abs(b) > EPS) {
    const candidates: number[][] = [];

    // Intersections with viewport boundaries
    const p1y = rhs / b;
    if (p1y >= 0 && p1y <= yMax * 1.2) candidates.push([0, p1y]);

    const p2x = rhs / a;
    if (p2x >= 0 && p2x <= xMax * 1.2) candidates.push([p2x, 0]);

    const yAtXMax = (rhs - a * xMax * 1.2) / b;
    if (yAtXMax >= 0 && yAtXMax <= yMax * 1.2) candidates.push([xMax * 1.2, yAtXMax]);

    const xAtYMax = (rhs - b * yMax * 1.2) / a;
    if (xAtYMax >= 0 && xAtYMax <= xMax * 1.2) candidates.push([xAtYMax, yMax * 1.2]);

    if (candidates.length >= 2) {
      candidates.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      points.push(candidates[0], candidates[candidates.length - 1]);
    } else {
      points.push([0, p1y], [p2x, 0]);
    }
  } else if (Math.abs(a) > EPS && Math.abs(b) < EPS) {
    const xv = rhs / a;
    points.push([xv, 0], [xv, yMax * 1.2]);
  } else if (Math.abs(a) < EPS && Math.abs(b) > EPS) {
    const yv = rhs / b;
    points.push([0, yv], [xMax * 1.2, yv]);
  }

  return { constraint, xIntercept, yIntercept, points };
}

/**
 * Computes ALL possible intersections between constraint pairs
 * and intersections with axes.
 */
export function computeAllIntersections(
  constraints: Constraint[],
  withAxes = true
): IntersectionPoint[] {
  const intersections: IntersectionPoint[] = [];
  const n = constraints.length;

  // Intersections between constraint pairs
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const c1 = constraints[i];
      const c2 = constraints[j];
      if (c1.coefficients.length < 2 || c2.coefficients.length < 2) continue;

      const sol = solve2x2(
        c1.coefficients[0], c1.coefficients[1], c1.rhs,
        c2.coefficients[0], c2.coefficients[1], c2.rhs
      );
      if (sol) {
        const [x, y] = sol;
        if (x >= -EPS && y >= -EPS) {
          intersections.push({
            coordinates: [round(x), round(y)],
            constraintIds: [c1.id, c2.id],
            isFeasible: false,
          });
        }
      }
    }
  }

  // Intersections with axes (x=0 and y=0)
  if (withAxes) {
    for (const c of constraints) {
      const [a, b] = c.coefficients;
      if (Math.abs(b) > EPS) {
        const y = c.rhs / b;
        if (y >= -EPS) {
          intersections.push({
            coordinates: [0, round(y)],
            constraintIds: [c.id, 'x=0'],
            isFeasible: false,
          });
        }
      }
      if (Math.abs(a) > EPS) {
        const x = c.rhs / a;
        if (x >= -EPS) {
          intersections.push({
            coordinates: [round(x), 0],
            constraintIds: [c.id, 'y=0'],
            isFeasible: false,
          });
        }
      }
    }

    intersections.push({
      coordinates: [0, 0],
      constraintIds: ['x=0', 'y=0'],
      isFeasible: false,
    });
  }

  // Remove duplicates
  const unique: IntersectionPoint[] = [];
  for (const pt of intersections) {
    const exists = unique.some(
      u => eq(u.coordinates[0], pt.coordinates[0]) && eq(u.coordinates[1], pt.coordinates[1])
    );
    if (!exists) unique.push(pt);
  }

  return unique;
}

/**
 * Computes the feasible region and admissible vertices.
 * This is the CENTRAL function of the graphical method.
 */
export function solveGraphic(problem: LPProblem): GraphicSolution {
  const { objective, constraints, numVariables } = problem;

  if (numVariables !== 2) {
    throw new Error('Graphical method requires exactly 2 variables');
  }

  // 1. Determine viewport bounds
  let xMax = 0, yMax = 0;
  for (const c of constraints) {
    if (Math.abs(c.coefficients[0]) > EPS) xMax = Math.max(xMax, c.rhs / c.coefficients[0]);
    if (Math.abs(c.coefficients[1]) > EPS) yMax = Math.max(yMax, c.rhs / c.coefficients[1]);
  }
  xMax = Math.max(xMax, 10) * 1.2;
  yMax = Math.max(yMax, 10) * 1.2;

  // 2. Convert constraints to lines
  const constraintLines = constraints.map(c => constraintToLine(c, xMax, yMax));

  // 3. Compute ALL intersections
  const intersections = computeAllIntersections(constraints);

  // 4. Check feasibility of each intersection
  for (const pt of intersections) {
    pt.isFeasible = isFeasible(pt.coordinates, constraints);
  }

  // 5. Build vertices with Z values
  const allConstraints = [
    ...constraints,
    { id: 'x=0', coefficients: [1, 0], operator: '>=' as const, rhs: 0, label: 'x1 >= 0' },
    { id: 'y=0', coefficients: [0, 1], operator: '>=' as const, rhs: 0, label: 'x2 >= 0' },
  ];

  const feasiblePoints = intersections.filter(pt => pt.isFeasible);

  const vertices: Vertex[] = feasiblePoints.map((pt) => {
    const activeConstraints: string[] = [];
    for (const c of allConstraints) {
      const lhs = c.coefficients.reduce((s, coef, i) => s + coef * pt.coordinates[i], 0);
      if (eq(lhs, c.rhs)) {
        activeConstraints.push(c.id);
      }
    }

    return {
      coordinates: pt.coordinates,
      isFeasible: true,
      zValue: evaluateZ(pt.coordinates, objective.coefficients),
      label: '',
      activeConstraints,
    };
  });

  // Sort counterclockwise around centroid
  const centerX = vertices.reduce((s, v) => s + v.coordinates[0], 0) / (vertices.length || 1);
  const centerY = vertices.reduce((s, v) => s + v.coordinates[1], 0) / (vertices.length || 1);
  vertices.sort((a, b) => {
    const angleA = Math.atan2(a.coordinates[1] - centerY, a.coordinates[0] - centerX);
    const angleB = Math.atan2(b.coordinates[1] - centerY, b.coordinates[0] - centerX);
    return angleA - angleB;
  });

  // Assign labels A, B, C, ...
  vertices.forEach((v, i) => { v.label = getVertexLabel(i); });

  // 6. Determine optimal vertex
  let optimalVertex: Vertex | null = null;
  if (vertices.length > 0) {
    if (objective.type === 'max') {
      optimalVertex = vertices.reduce((best, v) => v.zValue > best.zValue ? v : best);
    } else {
      optimalVertex = vertices.reduce((best, v) => v.zValue < best.zValue ? v : best);
    }
  }

  // 7. Build feasible region polygon
  const feasibleRegion = buildFeasiblePolygon(vertices);

  // 8. Check boundedness
  const isBounded = checkBounded(vertices);

  return {
    vertices,
    feasibleVertices: vertices,
    optimalVertex,
    feasibleRegion,
    intersections,
    constraintLines,
    isBounded,
    zValues: vertices.map(v => v.zValue),
  };
}

function buildFeasiblePolygon(vertices: Vertex[]): number[][] {
  if (vertices.length < 3) {
    return vertices.map(v => [...v.coordinates]);
  }

  const cx = vertices.reduce((s, v) => s + v.coordinates[0], 0) / vertices.length;
  const cy = vertices.reduce((s, v) => s + v.coordinates[1], 0) / vertices.length;

  const sorted = [...vertices].sort((a, b) => {
    const angleA = Math.atan2(a.coordinates[1] - cy, a.coordinates[0] - cx);
    const angleB = Math.atan2(b.coordinates[1] - cy, b.coordinates[0] - cx);
    return angleA - angleB;
  });

  const polygon = sorted.map(v => [...v.coordinates]);
  if (polygon.length > 0) {
    polygon.push([...polygon[0]]);
  }

  return polygon;
}

function checkBounded(vertices: Vertex[]): boolean {
  const maxCoord = vertices.reduce(
    (max, v) => Math.max(max, Math.abs(v.coordinates[0]), Math.abs(v.coordinates[1])),
    0
  );
  return maxCoord < 1e6;
}

// ──────────────────────────────────────────────────────────────
// SIMPLEX METHOD
// ──────────────────────────────────────────────────────────────

/**
 * Converts a problem to standard form for simplex.
 * Adds slack variables for <= constraints.
 */
export function toStandardForm(problem: LPProblem): {
  A: number[][];
  b: number[];
  c: number[];
  numSlack: number;
  variableNames: string[];
} {
  const { objective, constraints, numVariables, variableNames: vNames } = problem;

  const numSlack = constraints.filter(c => c.operator === '<=').length;

  const variableNames = [...vNames];
  let slackIdx = 1;
  for (const c of constraints) {
    if (c.operator === '<=') {
      variableNames.push(`e${slackIdx}`);
      slackIdx++;
    }
  }

  const A: number[][] = [];
  const b: number[] = [];

  let slackVarIndex = numVariables;
  for (const c of constraints) {
    const row = [...c.coefficients];
    for (let i = 0; i < numSlack; i++) row.push(0);

    if (c.operator === '<=') {
      row[slackVarIndex] = 1;
      slackVarIndex++;
    }
    A.push(row);
    b.push(c.rhs);
  }

  const c = [...objective.coefficients];
  for (let i = 0; i < numSlack; i++) c.push(0);

  return { A, b, c, numSlack, variableNames };
}

/**
 * Solves a linear programming problem using the Simplex method.
 * Returns ALL intermediate tableaux for pedagogical display.
 */
export function solveSimplex(problem: LPProblem): SimplexSolution {
  const { objective } = problem;

  const { A, b, c, variableNames } = toStandardForm(problem);
  const numConstraints = A.length;
  const totalVars = c.length;

  const basicVariables: number[] = [];
  let slackIdx = problem.numVariables;
  for (let i = 0; i < numConstraints; i++) {
    basicVariables.push(slackIdx++);
  }

  let nonBasicVariables: number[] = [];
  for (let j = 0; j < problem.numVariables; j++) {
    nonBasicVariables.push(j);
  }

  // Build initial tableau
  let tableau: number[][] = [];

  // Z row
  const zRow: number[] = [];
  for (let j = 0; j < totalVars; j++) {
    zRow.push(objective.type === 'max' ? -c[j] : c[j]);
  }
  zRow.push(0);
  tableau.push(zRow);

  // Constraint rows
  for (let i = 0; i < numConstraints; i++) {
    const row = [...A[i], b[i]];
    tableau.push(row);
  }

  const tableaux: SimplexTableau[] = [];
  let iteration = 0;

  while (true) {
    const zRowCurrent = tableau[0];

    // Check optimality
    const isOptimal = zRowCurrent.slice(0, -1).every(v => v >= -EPS);

    const solution = extractSolution(tableau, basicVariables, totalVars);
    const zValue = objective.type === 'max'
      ? tableau[0][totalVars]
      : -tableau[0][totalVars];

    // Determine entering variable
    let enteringVar: number | null = null;
    let minCoeff = 0;
    if (!isOptimal) {
      for (let j = 0; j < totalVars; j++) {
        if (zRowCurrent[j] < minCoeff - EPS) {
          minCoeff = zRowCurrent[j];
          enteringVar = j;
        }
      }
    }

    // Determine leaving variable (minimum ratio test)
    let leavingVar: number | null = null;
    let pivotRow: number | null = null;
    let minRatio = Infinity;

    if (enteringVar !== null) {
      for (let i = 1; i <= numConstraints; i++) {
        const coeff = tableau[i][enteringVar];
        if (coeff > EPS) {
          const ratio = tableau[i][totalVars] / coeff;
          if (ratio < minRatio - EPS) {
            minRatio = ratio;
            pivotRow = i;
            leavingVar = basicVariables[i - 1];
          }
        }
      }
    }

    // Build explanation
    let explanation = '';
    if (isOptimal) {
      explanation = `Optimalite atteinte. Z = ${round(zValue)}`;
    } else if (enteringVar !== null && pivotRow === null) {
      explanation = `Probleme non borne (pas de variable sortante)`;
    } else if (enteringVar !== null) {
      explanation = `Variable entrante: ${variableNames[enteringVar]} (coeff ${round(zRowCurrent[enteringVar])})`;
      if (leavingVar !== null) {
        explanation += ` | Variable sortante: ${variableNames[leavingVar]} (ratio min: ${round(minRatio)})`;
      }
    }

    // Row operations
    const rowOperations: string[] = [];
    if (pivotRow !== null && enteringVar !== null) {
      const pivotVal = tableau[pivotRow][enteringVar];
      rowOperations.push(`L${pivotRow} = L${pivotRow} / ${round(pivotVal)}`);
      for (let i = 0; i <= numConstraints; i++) {
        if (i !== pivotRow) {
          const factor = tableau[i][enteringVar];
          if (Math.abs(factor) > EPS) {
            const op = factor < 0
              ? `L${i} = L${i} - (${round(factor)})*L${pivotRow}`
              : `L${i} = L${i} - ${round(factor)}*L${pivotRow}`;
            rowOperations.push(op);
          }
        }
      }
    }

    tableaux.push({
      iteration,
      matrix: tableau.map(row => row.map(v => round(v))),
      basicVariables: [...basicVariables],
      nonBasicVariables: [...nonBasicVariables],
      enteringVariable: enteringVar,
      leavingVariable: leavingVar,
      pivotRow,
      pivotCol: enteringVar,
      pivotValue: pivotRow !== null && enteringVar !== null ? round(tableau[pivotRow][enteringVar]) : null,
      zValue: round(zValue),
      solution: solution.map(v => round(v)),
      isOptimal,
      isUnbounded: enteringVar !== null && pivotRow === null,
      explanation,
      rowOperations,
      variableNames,
    });

    // Stop conditions
    if (isOptimal) break;
    if (enteringVar !== null && pivotRow === null) {
      return {
        tableaux,
        optimalSolution: [],
        optimalValue: objective.type === 'max' ? Infinity : -Infinity,
        numIterations: iteration,
        status: 'unbounded',
      };
    }
    if (iteration > 100) {
      return {
        tableaux,
        optimalSolution: solution,
        optimalValue: zValue,
        numIterations: iteration,
        status: 'infeasible',
      };
    }

    // ─── Gauss Pivot ───
    const pivotVal = tableau[pivotRow!][enteringVar!];

    // Normalize pivot row
    for (let j = 0; j <= totalVars; j++) {
      tableau[pivotRow!][j] /= pivotVal;
    }

    // Eliminate pivot column in other rows
    for (let i = 0; i <= numConstraints; i++) {
      if (i !== pivotRow) {
        const factor = tableau[i][enteringVar!];
        if (Math.abs(factor) > EPS) {
          for (let j = 0; j <= totalVars; j++) {
            tableau[i][j] -= factor * tableau[pivotRow!][j];
          }
        }
      }
    }

    // Update basic variables
    basicVariables[pivotRow! - 1] = enteringVar!;
    nonBasicVariables = [];
    const basicSet = new Set(basicVariables);
    for (let j = 0; j < totalVars; j++) {
      if (!basicSet.has(j)) nonBasicVariables.push(j);
    }

    iteration++;
  }

  const finalSolution = extractSolution(tableau, basicVariables, totalVars);
  const finalZ = objective.type === 'max'
    ? tableau[0][totalVars]
    : -tableau[0][totalVars];

  return {
    tableaux,
    optimalSolution: finalSolution.map(v => round(v)),
    optimalValue: round(finalZ),
    numIterations: iteration,
    status: 'optimal',
  };
}

/** Extracts current solution from tableau */
function extractSolution(
  tableau: number[][],
  basicVariables: number[],
  numVars: number
): number[] {
  const solution = new Array(numVars).fill(0);
  for (let i = 0; i < basicVariables.length; i++) {
    const varIdx = basicVariables[i];
    if (varIdx < numVars) {
      solution[varIdx] = tableau[i + 1][numVars];
    }
  }
  return solution;
}

// ──────────────────────────────────────────────────────────────
// DUALITY
// ──────────────────────────────────────────────────────────────

/**
 * Builds the dual problem from the primal.
 */
export function buildDual(problem: LPProblem): DualProblem {
  const { objective, constraints, numVariables } = problem;

  const dualType: OptimizationType = objective.type === 'max' ? 'min' : 'max';

  const dualVariableNames = constraints.map((_, i) => `y${i + 1}`);

  const dualConstraints: Constraint[] = [];
  for (let j = 0; j < numVariables; j++) {
    const coefficients = constraints.map(c => c.coefficients[j]);
    const rhs = objective.coefficients[j];
    dualConstraints.push({
      id: `dual_c${j + 1}`,
      coefficients,
      operator: '>=',
      rhs,
      label: `Dual constraint ${j + 1}`,
    });
  }

  const dualObjective = {
    coefficients: constraints.map(c => c.rhs),
    type: dualType,
  };

  return {
    objective: dualObjective,
    constraints: dualConstraints,
    variableNames: dualVariableNames,
  };
}

/**
 * Complete duality analysis.
 */
export function analyzeDuality(
  problem: LPProblem,
  simplexSolution: SimplexSolution
): DualityAnalysis {
  const dual = buildDual(problem);

  const shadowPrices: number[] = [];
  const lastTableau = simplexSolution.tableaux[simplexSolution.tableaux.length - 1];

  for (let i = 0; i < problem.numConstraints; i++) {
    const slackIdx = problem.numVariables + i;
    if (slackIdx < lastTableau.matrix[0].length - 1) {
      shadowPrices.push(round(lastTableau.matrix[0][slackIdx]));
    } else {
      shadowPrices.push(0);
    }
  }

  const reducedCosts: number[] = [];
  for (let j = 0; j < problem.numVariables; j++) {
    reducedCosts.push(round(lastTableau.matrix[0][j]));
  }

  const activeConstraints: string[] = [];
  const optimalVertex = simplexSolution.optimalSolution;
  for (const c of problem.constraints) {
    const lhs = c.coefficients.reduce((s, coef, i) => s + coef * optimalVertex[i], 0);
    if (Math.abs(lhs - c.rhs) < EPS) {
      activeConstraints.push(c.id);
    }
  }

  const dualObjectiveValue = dual.objective.coefficients.reduce(
    (s, coef, i) => s + coef * Math.abs(shadowPrices[i] || 0), 0
  );
  const strongDuality = Math.abs(simplexSolution.optimalValue - dualObjectiveValue) < 1;

  const interpretation = generateInterpretation(problem, shadowPrices, activeConstraints);

  return {
    primal: problem,
    dual,
    shadowPrices,
    reducedCosts,
    activeConstraints,
    interpretation,
    weakDuality: dualObjectiveValue,
    strongDuality,
  };
}

function generateInterpretation(
  problem: LPProblem,
  shadowPrices: number[],
  activeConstraints: string[]
): string {
  const projectName = problem.projectName || 'ce probleme';
  const activeLabels = activeConstraints
    .map(id => problem.constraints.find(con => con.id === id)?.label || id)
    .filter(Boolean);
  const lines: string[] = [];
  lines.push('=== INTERPRETATION AUTOMATIQUE ===');
  lines.push('');
  lines.push(`Contexte analyse: ${projectName}.`);
  lines.push(`Objectif: ${problem.objective.type === 'max' ? 'maximisation' : 'minimisation'} de Z avec les contraintes saisies.`);
  lines.push('');

  lines.push('Prix-ombres par contrainte:');
  problem.constraints.forEach((c, i) => {
    const sp = shadowPrices[i] || 0;
    lines.push(`  ${c.label || `Constraint ${i + 1}`}: ${sp.toFixed(2)}`);
    if (Math.abs(sp) > EPS) {
      lines.push(`    -> Si la limite de cette contrainte augmente de 1 unite, la valeur de Z s'ameliore d'environ ${sp.toFixed(2)}.`);
    } else {
      lines.push(`    -> Cette contrainte n'apporte pas de gain marginal direct autour de l'optimum.`);
    }
  });
  lines.push('');

  lines.push('Contraintes actives (saturees):');
  if (activeLabels.length === 0) {
    lines.push('  Aucune contrainte active.');
  } else {
    activeLabels.forEach(label => lines.push(`  * ${label}`));
  }
  lines.push('');

  lines.push('Lecture generale:');
  lines.push(`Les contraintes actives sont les limites qui bornent directement la solution optimale.`);
  lines.push(`Les prix-ombres mesurent l'effet marginal d'un assouplissement local de chaque limite.`);
  lines.push(`Une contrainte avec prix-ombre nul peut rester importante dans le modele, mais elle n'est pas prioritaire pour ameliorer Z au voisinage de la solution actuelle.`);

  return lines.join('\n');
}

// ──────────────────────────────────────────────────────────────
// AUTOMATIC METHOD DETECTION
// ──────────────────────────────────────────────────────────────

export function detectBestMethod(problem: LPProblem): 'graphic' | 'simplex' | 'dual' {
  if (problem.numVariables === 2) {
    return 'graphic';
  }
  if (problem.objective.type === 'min') {
    return 'dual';
  }
  return 'simplex';
}

// ──────────────────────────────────────────────────────────────
// COMPLETE SOLUTION
// ──────────────────────────────────────────────────────────────

export function solveComplete(
  problem: LPProblem,
  method: 'auto' | 'graphic' | 'simplex' | 'dual' = 'auto'
): {
  problem: LPProblem;
  graphicSolution: GraphicSolution | null;
  simplexSolution: SimplexSolution | null;
  dualityAnalysis: DualityAnalysis | null;
  method: string;
  optimalSolution: number[];
  optimalValue: number;
  status: string;
} {
  const selectedMethod = method === 'auto' ? detectBestMethod(problem) : method;

  let graphicSolution: GraphicSolution | null = null;
  let simplexSolution: SimplexSolution | null = null;
  let dualityAnalysis: DualityAnalysis | null = null;

  try {
    simplexSolution = solveSimplex(problem);
  } catch (_e) {
    // Error in simplex
  }

  if (problem.numVariables === 2) {
    try {
      graphicSolution = solveGraphic(problem);
    } catch (_e) {
      // Error in graphic
    }
  }

  if (selectedMethod === 'dual' || problem.objective.type === 'min') {
    if (simplexSolution) {
      dualityAnalysis = analyzeDuality(problem, simplexSolution);
    }
  }

  if (simplexSolution && simplexSolution.status === 'optimal' && !dualityAnalysis) {
    dualityAnalysis = analyzeDuality(problem, simplexSolution);
  }

  return {
    problem,
    graphicSolution,
    simplexSolution,
    dualityAnalysis,
    method: selectedMethod,
    optimalSolution: simplexSolution?.optimalSolution || graphicSolution?.optimalVertex?.coordinates || [],
    optimalValue: simplexSolution?.optimalValue ?? graphicSolution?.optimalVertex?.zValue ?? 0,
    status: simplexSolution?.status || 'optimal',
  };
}
