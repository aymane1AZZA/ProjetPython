/**
 * ═══════════════════════════════════════════════════════════════
 * DualityPanel - Duality Analysis
 * Shadow prices, active constraints, interpretation
 * ═══════════════════════════════════════════════════════════════
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { DualityAnalysis } from '@/types/lp';
import {
  ArrowLeftRight,
  Lock,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface DualityPanelProps {
  analysis: DualityAnalysis;
}

export function DualityPanel({ analysis }: DualityPanelProps) {
  const { primal, dual, shadowPrices, activeConstraints, interpretation, strongDuality } = analysis;
  const variableName = (index: number) => primal.variableNames[index] || `x${index + 1}`;
  const dualName = (index: number) => dual.variableNames[index] || `y${index + 1}`;
  const activeItems = primal.constraints.filter(c => activeConstraints.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Strong duality */}
      <Card className={`shadow-sm ${strongDuality ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            {strongDuality ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            )}
            <div>
              <p className={`font-semibold ${strongDuality ? 'text-emerald-800' : 'text-amber-800'}`}>
                Theoreme de la dualite forte
              </p>
              <p className={`text-sm ${strongDuality ? 'text-emerald-700' : 'text-amber-700'}`}>
                {strongDuality
                  ? 'Les valeurs optimales du primal et du dual sont egales. Verification confirmee.'
                  : 'Verification de la dualite forte en cours...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primal Problem */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
              Probleme Primal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="font-semibold text-indigo-900">
                {primal.objective.type === 'max' ? 'Max' : 'Min'} Z ={' '}
                {primal.objective.coefficients.map((c, i) => (
                  <span key={i}>
                    {c > 0 && i > 0 ? ' + ' : ''}{c}{variableName(i)}
                  </span>
                ))}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Contraintes</p>
              {primal.constraints.map((c) => (
                <div key={c.id} className="text-sm font-mono text-slate-700">
                  {c.coefficients.map((coef, j) => (
                    <span key={j}>
                      {coef > 0 && j > 0 ? ' + ' : ''}{coef}{variableName(j)}
                    </span>
                  ))} {c.operator} {c.rhs}
                  {c.label && <span className="text-slate-400 ml-2">// {c.label}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dual Problem */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-violet-600" />
              Probleme Dual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-violet-50 rounded-lg p-3">
              <p className="font-semibold text-violet-900">
                {dual.objective.type === 'max' ? 'Max' : 'Min'} W ={' '}
                {dual.objective.coefficients.map((c, i) => (
                  <span key={i}>
                    {c > 0 && i > 0 ? ' + ' : ''}{c}{dualName(i)}
                  </span>
                ))}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Contraintes duales</p>
              {dual.constraints.map((c) => (
                <div key={c.id} className="text-sm font-mono text-slate-700">
                  {c.coefficients.map((coef, j) => (
                    <span key={j}>
                      {coef > 0 && j > 0 ? ' + ' : ''}{coef}{dualName(j)}
                    </span>
                  ))} {c.operator} {c.rhs}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shadow Prices */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Shadow Prices (Prix-ombres)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrainte</TableHead>
                <TableHead className="text-right">Shadow Price</TableHead>
                <TableHead>Interpretation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {primal.constraints.map((c, i) => {
                const sp = shadowPrices[i] || 0;
                const isActive = activeConstraints.includes(c.id);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isActive && <Lock className="w-3 h-3 text-red-500" />}
                        <span className="text-sm">{c.label || `Contrainte ${i + 1}`}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <Badge
                        variant={Math.abs(sp) > 0.001 ? 'default' : 'outline'}
                        className={Math.abs(sp) > 0.001 ? 'bg-emerald-600' : ''}
                      >
                        {sp.toFixed(4)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {Math.abs(sp) > 0.001
                        ? `Augmenter la limite de "${c.label || `Contrainte ${i + 1}`}" de 1 unite ameliore Z de ${sp.toFixed(4)}`
                        : 'Cette limite n ameliore pas Z si elle augmente seule'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Active constraints */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-500" />
            Contraintes actives a l&apos;optimum
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {activeConstraints.length === 0 && (
              <p className="text-sm text-slate-500">Aucune contrainte active a l&apos;optimum.</p>
            )}
            {activeItems.map(c => {
              return (
                <Badge
                  key={c.id}
                  variant="default"
                  className="bg-red-500 text-white"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  {c.label || c.id}
                </Badge>
              );
            })}
          </div>
          <p className="text-sm text-slate-600 mt-3">
            Les contraintes actives (saturees) sont celles qui sont atteintes a l&apos;egalite a la solution optimale.
            Elles representent les limites critiques du modele pour le contexte saisi.
          </p>
        </CardContent>
      </Card>

      {/* Economic interpretation */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Interpretation economique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 p-4 rounded-lg">
            {interpretation}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
