/**
 * ═══════════════════════════════════════════════════════════════
 * ResultsPanel - Panneau de synthèse des résultats
 * ═══════════════════════════════════════════════════════════════
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { LPSolution } from '@/types/lp';
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ResultsPanelProps {
  solution: LPSolution;
}

export function ResultsPanel({ solution }: ResultsPanelProps) {
  const isOptimal = solution.status === 'optimal';
  const variableName = (index: number) =>
    solution.problem.variableNames[index] || `e${index - solution.problem.numVariables + 1}`;

  return (
    <div className="space-y-6">
      {/* Bannière de statut */}
      <Card className={`shadow-sm ${isOptimal ? 'border-emerald-200' : 'border-red-200'}`}>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-4">
            {isOptimal ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            ) : (
              <AlertCircle className="w-10 h-10 text-red-500" />
            )}
            <div className="text-center">
              <p className={`text-2xl font-bold ${isOptimal ? 'text-emerald-800' : 'text-red-800'}`}>
                {isOptimal ? 'Solution optimale trouvée' : solution.status}
              </p>
              {isOptimal && (
                <p className="text-lg text-emerald-600 mt-1">
                  Z* = <span className="font-mono font-bold">{solution.optimalValue}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Solution optimale */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Solution Optimale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Variable</TableHead>
                  <TableHead className="w-32 text-right">Valeur</TableHead>
                  <TableHead>Interprétation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {solution.optimalSolution.map((val, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono font-semibold">
                      {variableName(i)}
                    </TableCell>
                    <TableCell className="text-right font-mono">{val.toFixed(4)}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {val > 0
                        ? `Variable de base (valeur optimale)`
                        : `Variable hors base (nulle)`}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-amber-50">
                  <TableCell className="font-bold">Z*</TableCell>
                  <TableCell className="text-right font-mono font-bold text-amber-800">
                    {solution.optimalValue.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-amber-700">
                    Valeur optimale de la fonction objectif
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Méthodes utilisées */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Méthodes appliquées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {solution.graphicSolution && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                <Badge className="bg-indigo-600">Graphique</Badge>
                <span className="text-sm text-indigo-800">
                  {solution.graphicSolution.feasibleVertices.length} sommets analysés
                </span>
              </div>
            )}
            {solution.simplexSolution && (
              <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg">
                <Badge className="bg-violet-600">Simplexe</Badge>
                <span className="text-sm text-violet-800">
                  {solution.simplexSolution.numIterations} itérations
                </span>
              </div>
            )}
            {solution.dualityAnalysis && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                <Badge className="bg-emerald-600">Dualité</Badge>
                <span className="text-sm text-emerald-800">
                  {solution.dualityAnalysis.strongDuality ? 'Dualité forte vérifiée' : 'Analyse complète'}
                </span>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Variables</span>
                <Badge variant="outline">{solution.problem.numVariables}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Contraintes</span>
                <Badge variant="outline">{solution.problem.numConstraints}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Type</span>
                <Badge variant="outline">
                  {solution.problem.objective.type === 'max' ? 'Maximisation' : 'Minimisation'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détail de la fonction objectif */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Fonction objectif et contraintes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg p-4">
            <p className="text-lg font-semibold text-indigo-900">
              {solution.problem.objective.type === 'max' ? 'Max' : 'Min'} Z ={' '}
              {solution.problem.objective.coefficients.map((c, i) => (
                <span key={i}>
                  {(c >= 0 && i > 0) ? ' + ' : (c < 0 ? ' - ' : '')}
                  {Math.abs(c)}{variableName(i)}
                </span>
              ))}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Contrainte</TableHead>
                <TableHead className="w-24 text-center">Type</TableHead>
                <TableHead className="w-20 text-right">RHS</TableHead>
                <TableHead className="w-24 text-center">Écart</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solution.problem.constraints.map((c, i) => {
                // Calculer l'écart
                let slack = 0;
                if (solution.simplexSolution && i < solution.simplexSolution.optimalSolution.length - solution.problem.numVariables) {
                  const slackVarIdx = solution.problem.numVariables + i;
                  slack = solution.simplexSolution.optimalSolution[slackVarIdx] || 0;
                }
                const isActive = Math.abs(slack) < 0.001;

                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono">{i + 1}</TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {c.coefficients.map((coef, j) => (
                          <span key={j}>
                            {(coef >= 0 && j > 0) ? ' + ' : (coef < 0 ? ' - ' : '')}
                            {Math.abs(coef)}{variableName(j)}
                          </span>
                        ))}
                        <span className="text-slate-500"> {c.operator} {c.rhs}</span>
                      </div>
                      {c.label && <p className="text-xs text-slate-500">{c.label}</p>}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono text-xs">
                        {c.operator}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{c.rhs}</TableCell>
                    <TableCell className="text-center">
                      {isActive ? (
                        <Badge className="bg-red-500 text-white text-xs">Saturée</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-600 text-xs">
                          Écart: {slack.toFixed(2)}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Validation simplexe */}
      {solution.simplexSolution && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              Déroulement du Simplexe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {solution.simplexSolution.tableaux.map((t, i) => (
                <div key={i} className="flex items-center">
                  <div className={`px-4 py-3 rounded-lg text-center min-w-[80px] border ${
                    i === solution.simplexSolution!.tableaux.length - 1
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="text-xs opacity-75">
                      {i === 0 ? 'Initial' : `Itération ${i}`}
                    </div>
                    <div className="font-mono font-bold">{t.zValue}</div>
                  </div>
                  {i < solution.simplexSolution!.tableaux.length - 1 && (
                    <ArrowRight className="w-4 h-4 mx-1 text-slate-400" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600 mt-4">
              L'algorithme du simplexe a convergé en{' '}
              <strong>{solution.simplexSolution.numIterations} itération(s)</strong>,
              {' '}passant de Z = {solution.simplexSolution.tableaux[0]?.zValue ?? 0} à{' '}
              <strong>Z* = {solution.simplexSolution.optimalValue}</strong>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
