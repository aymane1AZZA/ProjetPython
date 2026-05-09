/**
 * Types fondamentaux pour la Programmation Linéaire
 * ULPSS - Universal Linear Programming Smart Solver
 */

export type OptimizationType = 'max' | 'min';

export type ConstraintOperator = '<=' | '>=' | '=';

export interface Constraint {
  id: string;
  coefficients: number[];
  operator: ConstraintOperator;
  rhs: number; // right-hand side
  label?: string;
}

export interface LPProblem {
  projectName?: string;
  objective: {
    coefficients: number[];
    type: OptimizationType;
  };
  constraints: Constraint[];
  variableNames: string[];
  numVariables: number;
  numConstraints: number;
}

export interface Vertex {
  coordinates: number[];
  isFeasible: boolean;
  zValue: number;
  label: string;
  activeConstraints: string[]; // ids of constraints active at this vertex
}

export interface IntersectionPoint {
  coordinates: number[];
  constraintIds: string[];
  isFeasible: boolean;
}

export interface GraphicSolution {
  vertices: Vertex[];
  feasibleVertices: Vertex[];
  optimalVertex: Vertex | null;
  feasibleRegion: number[][]; // polygon points for plotting
  intersections: IntersectionPoint[];
  constraintLines: ConstraintLine[];
  isBounded: boolean;
  zValues: number[];
}

export interface ConstraintLine {
  constraint: Constraint;
  xIntercept: number | null;
  yIntercept: number | null;
  points: number[][]; // [[x1,y1], [x2,y2]] for plotting
}

// Simplex types
export interface SimplexTableau {
  iteration: number;
  matrix: number[][]; // tableau including RHS
  basicVariables: number[]; // indices of basic variables (-1 for Z row)
  nonBasicVariables: number[]; // indices of non-basic variables
  enteringVariable: number | null;
  leavingVariable: number | null;
  pivotRow: number | null;
  pivotCol: number | null;
  pivotValue: number | null;
  zValue: number;
  solution: number[];
  isOptimal: boolean;
  isUnbounded: boolean;
  explanation: string;
  rowOperations: string[];
  variableNames: string[];
}

export interface SimplexSolution {
  tableaux: SimplexTableau[];
  optimalSolution: number[];
  optimalValue: number;
  numIterations: number;
  status: 'optimal' | 'unbounded' | 'infeasible';
}

// Duality types
export interface DualProblem {
  objective: {
    coefficients: number[];
    type: OptimizationType;
  };
  constraints: Constraint[];
  variableNames: string[];
}

export interface DualityAnalysis {
  primal: LPProblem;
  dual: DualProblem;
  shadowPrices: number[];
  reducedCosts: number[];
  activeConstraints: string[];
  interpretation: string;
  weakDuality: number;
  strongDuality: boolean;
}

// Solution complete
export interface LPSolution {
  problem: LPProblem;
  graphicSolution: GraphicSolution | null;
  simplexSolution: SimplexSolution | null;
  dualityAnalysis: DualityAnalysis | null;
  method: 'graphic' | 'simplex' | 'dual' | 'auto';
  optimalSolution: number[];
  optimalValue: number;
  status: 'optimal' | 'unbounded' | 'infeasible' | 'multiple';
  computationTime: number;
}

// Application state
export interface AppState {
  problem: LPProblem;
  solution: LPSolution | null;
  selectedMethod: 'auto' | 'graphic' | 'simplex' | 'dual';
  activeTab: string;
  currentSimplexStep: number;
  showAnimation: boolean;
}
