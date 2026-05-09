import type { LPProblem } from '@/types/lp';

type SolverMethod = 'auto' | 'graphic' | 'simplex' | 'dual';

export async function solveWithPython(problem: LPProblem, method: SolverMethod) {
  const response = await fetch('/api/solve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ problem, method }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || 'Erreur du backend Python');
  }

  return payload;
}
