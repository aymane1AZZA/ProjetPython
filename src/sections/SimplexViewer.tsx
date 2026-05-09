/**
 * ═══════════════════════════════════════════════════════════════
 * SimplexViewer - Simplex Tableau Viewer
 * Displays intermediate tableaux, pivots, steps
 * ═══════════════════════════════════════════════════════════════
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SimplexSolution } from '@/types/lp';
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  TableProperties,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface SimplexViewerProps {
  simplex: SimplexSolution;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function SimplexViewer({ simplex, currentStep, onStepChange }: SimplexViewerProps) {
  const tableau = simplex.tableaux[currentStep];
  const totalSteps = simplex.tableaux.length;

  const goToStep = (step: number) => {
    onStepChange(Math.max(0, Math.min(step, totalSteps - 1)));
  };

  const getCellClass = (rowIndex: number, colIndex: number): string => {
    if (!tableau) return '';
    const isPivot = tableau.pivotRow === rowIndex && tableau.pivotCol === colIndex;
    const isPivotRow = tableau.pivotRow === rowIndex;
    const isPivotCol = tableau.pivotCol === colIndex;

    if (isPivot) return 'bg-amber-300 border-amber-500 font-bold';
    if (isPivotRow) return 'bg-amber-50 border-amber-200';
    if (isPivotCol) return 'bg-blue-50 border-blue-200';
    if (rowIndex === 0 && colIndex < tableau.matrix[0].length - 1 && tableau.matrix[0][colIndex] < 0) {
      return 'bg-red-50 text-red-700';
    }
    return '';
  };

  const getRowLabel = (rowIndex: number): string => {
    if (rowIndex === 0) return 'Z';
    const varIdx = tableau.basicVariables[rowIndex - 1];
    return tableau.variableNames[varIdx] || `VB${rowIndex}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TableProperties className="w-4 h-4 text-indigo-600" />
              Tableaux du Simplexe
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                Iteration {currentStep + 1} / {totalSteps}
              </Badge>
              {tableau?.isOptimal && (
                <Badge className="bg-emerald-500 text-white">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Optimal
                </Badge>
              )}
              {tableau?.isUnbounded && (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Non borne
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Navigation controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToStep(0)}
              disabled={currentStep === 0}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1 mx-4">
              {simplex.tableaux.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i === currentStep
                      ? 'bg-indigo-600 w-6'
                      : i < currentStep
                        ? 'bg-indigo-300'
                        : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => goToStep(currentStep + 1)}
              disabled={currentStep === totalSteps - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToStep(totalSteps - 1)}
              disabled={currentStep === totalSteps - 1}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      {tableau && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Tableau {currentStep === 0 ? 'Initial' : `Iteration ${currentStep}`}
              </CardTitle>
              <Badge variant="outline" className="font-mono">
                Z = {tableau.zValue}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead className="w-16 font-bold border text-center">Base</TableHead>
                    {tableau.variableNames.map((name, i) => (
                      <TableHead
                        key={i}
                        className={`font-mono text-center border min-w-[60px] ${
                          tableau.pivotCol === i ? 'bg-blue-100 text-blue-800' : ''
                        }`}
                      >
                        {name}
                      </TableHead>
                    ))}
                    <TableHead className="font-bold text-center border bg-slate-200 min-w-[70px]">
                      RHS
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableau.matrix.map((row, ri) => (
                    <TableRow
                      key={ri}
                      className={ri === 0 ? 'bg-indigo-50/50' : ''}
                    >
                      <TableCell
                        className={`font-bold border text-center ${
                          ri === tableau.pivotRow ? 'bg-amber-100' : 'bg-slate-50'
                        }`}
                      >
                        {getRowLabel(ri)}
                      </TableCell>
                      {row.map((val, ci) => (
                        <TableCell
                          key={ci}
                          className={`font-mono text-center border text-sm ${getCellClass(ri, ci)}`}
                        >
                          {typeof val === 'number' ? val.toFixed(3) : val}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-300 border border-amber-500 rounded" />
                <span>Element pivot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-50 border border-amber-200 rounded" />
                <span>Ligne du pivot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded" />
                <span>Colonne du pivot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
                <span>Coefficient negatif</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Iteration explanation */}
      {tableau && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Explication de l&apos;iteration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-700">{tableau.explanation}</p>

            {tableau.enteringVariable !== null && (
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                  Entrante: {tableau.variableNames[tableau.enteringVariable]}
                </Badge>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                {tableau.leavingVariable !== null && (
                  <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                    Sortante: {tableau.variableNames[tableau.leavingVariable]}
                  </Badge>
                )}
              </div>
            )}

            {tableau.pivotValue !== null && (
              <div className="text-sm">
                <span className="text-slate-600">Valeur du pivot: </span>
                <span className="font-mono font-semibold">{tableau.pivotValue.toFixed(4)}</span>
              </div>
            )}

            {tableau.rowOperations.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Operations de Gauss:</p>
                <div className="space-y-1">
                  {tableau.rowOperations.map((op, i) => (
                    <div key={i} className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">
                      {op}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Basic / non-basic variables */}
      {tableau && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-emerald-700">Variables de base (VB)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tableau.basicVariables.map((vIdx, i) => (
                  <Badge key={i} variant="secondary" className="font-mono">
                    {tableau.variableNames[vIdx]} = {tableau.solution[vIdx]?.toFixed(3) ?? 0}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-700">Variables hors base (VHB)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tableau.nonBasicVariables.map((vIdx, i) => (
                  <Badge key={i} variant="outline" className="font-mono text-slate-500">
                    {tableau.variableNames[vIdx]} = 0
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress summary */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-indigo-800">Progression du Simplexe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {simplex.tableaux.map((t, i) => (
              <div key={i} className="flex items-center">
                <div className={`px-3 py-2 rounded-lg text-center min-w-[70px] ${
                  i <= currentStep
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <div className="text-xs opacity-75">{i === 0 ? 'Init' : `Iter ${i}`}</div>
                  <div className="font-mono font-bold text-sm">{t.zValue}</div>
                </div>
                {i < simplex.tableaux.length - 1 && (
                  <ArrowRight className={`w-4 h-4 mx-1 ${
                    i < currentStep ? 'text-indigo-400' : 'text-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <span className="text-sm text-indigo-700 font-medium">
              Z: {simplex.tableaux[0]?.zValue ?? 0}
              {simplex.tableaux.slice(1).map((t, i) => (
                <span key={i}> → <span className="font-bold">{t.zValue}</span></span>
              ))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
