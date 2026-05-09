/**
 * Hook personnalisé pour gérer le solveur de programmation linéaire
 * ULPSS - Universal Linear Programming Smart Solver
 */

import { useState, useCallback, useMemo } from 'react';
import type { LPProblem, LPSolution, OptimizationType, Constraint } from '@/types/lp';
import { solveComplete, detectBestMethod } from '@/lib/lpsolver';
import { solveWithPython } from '@/lib/pythonSolver';

// Problème par défaut du rapport: Optimisation du trafic (Chapitre 1)
export const DEFAULT_TRAFFIC_PROBLEM: LPProblem = {
  projectName: 'Probleme de programmation lineaire',
  objective: {
    coefficients: [5, 4],
    type: 'max',
  },
  constraints: [
    { id: 'c1', coefficients: [2, 1], operator: '<=', rhs: 800, label: 'Contrainte 1' },
    { id: 'c2', coefficients: [1, 3], operator: '<=', rhs: 900, label: 'Contrainte 2' },
    { id: 'c3', coefficients: [1, 1], operator: '<=', rhs: 470, label: 'Contrainte 3' },
    { id: 'c4', coefficients: [1, 0], operator: '<=', rhs: 350, label: 'Contrainte 4' },
  ],
  variableNames: ['x1', 'x2'],
  numVariables: 2,
  numConstraints: 4,
};

// Problème simplexe 4 variables (Chapitre 2 - exemple général)
export const DEFAULT_4VAR_PROBLEM: LPProblem = {
  projectName: 'Probleme general a 4 variables',
  objective: {
    coefficients: [12, 10, 6, 8],
    type: 'max',
  },
  constraints: [
    { id: 'c1', coefficients: [3, 4, 2, 5], operator: '<=', rhs: 100, label: 'Ressource 1' },
    { id: 'c2', coefficients: [2, 5, 4, 3], operator: '<=', rhs: 90, label: 'Ressource 2' },
    { id: 'c3', coefficients: [4, 3, 2, 5], operator: '<=', rhs: 120, label: 'Ressource 3' },
    { id: 'c4', coefficients: [1, 2, 5, 1], operator: '<=', rhs: 80, label: 'Ressource 4' },
    { id: 'c5', coefficients: [2, 1, 6, 3], operator: '<=', rhs: 70, label: 'Ressource 5' },
    { id: 'c6', coefficients: [3, 2, 4, 2], operator: '<=', rhs: 60, label: 'Ressource 6' },
  ],
  variableNames: ['x1', 'x2', 'x3', 'x4'],
  numVariables: 4,
  numConstraints: 6,
};

let constraintIdCounter = 100;

export function useLPSolver() {
  const [projectName, setProjectName] = useState(DEFAULT_TRAFFIC_PROBLEM.projectName || '');
  const [numVariables, setNumVariables] = useState(2);
  const [objectiveType, setObjectiveType] = useState<OptimizationType>('max');
  const [objectiveCoeffs, setObjectiveCoeffs] = useState<number[]>([5, 4]);
  const [variableNames, setVariableNames] = useState<string[]>(DEFAULT_TRAFFIC_PROBLEM.variableNames);
  const [constraints, setConstraints] = useState<Constraint[]>(DEFAULT_TRAFFIC_PROBLEM.constraints);
  const [solution, setSolution] = useState<LPSolution | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'auto' | 'graphic' | 'simplex' | 'dual'>('auto');
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSimplexStep, setCurrentSimplexStep] = useState(0);

  const normalizedVariableNames = useMemo(() => {
    return Array.from({ length: numVariables }, (_, i) => {
      const value = variableNames[i]?.trim();
      return value || `x${i + 1}`;
    });
  }, [numVariables, variableNames]);

  const buildProblem = useCallback((): LPProblem => {
    return {
      projectName: projectName.trim() || 'Probleme de programmation lineaire',
      objective: {
        coefficients: objectiveCoeffs.slice(0, numVariables),
        type: objectiveType,
      },
      constraints: constraints.filter(c => c.coefficients.length > 0),
      variableNames: normalizedVariableNames,
      numVariables,
      numConstraints: constraints.length,
    };
  }, [projectName, objectiveCoeffs, objectiveType, constraints, numVariables, normalizedVariableNames]);

  const solve = useCallback(async (): Promise<LPSolution | null> => {
    setIsSolving(true);
    setError(null);
    setCurrentSimplexStep(0);

    try {
      const problem = buildProblem();
      const startedAt = performance.now();
      let result;

      try {
        result = await solveWithPython(problem, selectedMethod);
      } catch (_pythonError) {
        result = solveComplete(problem, selectedMethod);
      }

      // Convertir au format LPSolution
      const lpSolution: LPSolution = {
        problem,
        graphicSolution: result.graphicSolution,
        simplexSolution: result.simplexSolution,
        dualityAnalysis: result.dualityAnalysis,
        method: selectedMethod === 'auto' ? detectBestMethod(problem) : selectedMethod,
        optimalSolution: result.optimalSolution,
        optimalValue: result.optimalValue,
        status: result.status as 'optimal' | 'unbounded' | 'infeasible' | 'multiple',
        computationTime: result.computationTime ?? performance.now() - startedAt,
      };

      setSolution(lpSolution);
      return lpSolution;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de résolution');
      setSolution(null);
      return null;
    } finally {
      setIsSolving(false);
    }
  }, [buildProblem, selectedMethod]);

  const updateObjectiveCoeff = useCallback((index: number, value: number) => {
    setObjectiveCoeffs(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const updateVariableName = useCallback((index: number, value: string) => {
    setVariableNames(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const updateConstraint = useCallback((id: string, updates: Partial<Constraint>) => {
    setConstraints(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const updateConstraintCoeff = useCallback((id: string, varIndex: number, value: number) => {
    setConstraints(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        const newCoeffs = [...c.coefficients];
        newCoeffs[varIndex] = value;
        return { ...c, coefficients: newCoeffs };
      })
    );
  }, []);

  const addConstraint = useCallback(() => {
    constraintIdCounter++;
    const newConstraint: Constraint = {
      id: `c${constraintIdCounter}`,
      coefficients: new Array(numVariables).fill(0),
      operator: '<=',
      rhs: 100,
      label: `Contrainte ${constraints.length + 1}`,
    };
    setConstraints(prev => [...prev, newConstraint]);
  }, [numVariables, constraints.length]);

  const removeConstraint = useCallback((id: string) => {
    setConstraints(prev => prev.filter(c => c.id !== id));
  }, []);

  const loadPreset = useCallback((preset: 'traffic' | '4var') => {
    if (preset === 'traffic') {
      setProjectName(DEFAULT_TRAFFIC_PROBLEM.projectName || '');
      setNumVariables(2);
      setObjectiveCoeffs([5, 4]);
      setObjectiveType('max');
      setVariableNames(DEFAULT_TRAFFIC_PROBLEM.variableNames);
      setConstraints(DEFAULT_TRAFFIC_PROBLEM.constraints);
    } else {
      setProjectName(DEFAULT_4VAR_PROBLEM.projectName || '');
      setNumVariables(4);
      setObjectiveCoeffs([12, 10, 6, 8]);
      setObjectiveType('max');
      setVariableNames(DEFAULT_4VAR_PROBLEM.variableNames);
      setConstraints(DEFAULT_4VAR_PROBLEM.constraints);
    }
    setSolution(null);
    setCurrentSimplexStep(0);
  }, []);

  const adjustNumVariables = useCallback((n: number) => {
    setNumVariables(n);
    setVariableNames(prev => {
      const next = new Array(n).fill('');
      for (let i = 0; i < n; i++) {
        next[i] = prev[i] || `x${i + 1}`;
      }
      return next;
    });
    setObjectiveCoeffs(prev => {
      const next = new Array(n).fill(0);
      for (let i = 0; i < Math.min(prev.length, n); i++) next[i] = prev[i];
      if (prev.length < n) next[0] = next[0] || 1;
      return next;
    });
    setConstraints(prev =>
      prev.map(c => {
        const newCoeffs = new Array(n).fill(0);
        for (let i = 0; i < Math.min(c.coefficients.length, n); i++) {
          newCoeffs[i] = c.coefficients[i];
        }
        return { ...c, coefficients: newCoeffs };
      })
    );
    setSolution(null);
  }, []);

  return {
    // State
    numVariables,
    projectName,
    objectiveType,
    objectiveCoeffs,
    constraints,
    solution,
    selectedMethod,
    isSolving,
    error,
    currentSimplexStep,
    variableNames: normalizedVariableNames,

    // Actions
    setProjectName,
    setNumVariables: adjustNumVariables,
    setObjectiveType,
    updateObjectiveCoeff,
    updateVariableName,
    updateConstraint,
    updateConstraintCoeff,
    addConstraint,
    removeConstraint,
    setSelectedMethod,
    setCurrentSimplexStep,
    solve,
    loadPreset,
  };
}
