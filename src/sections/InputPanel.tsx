/**
 * ═══════════════════════════════════════════════════════════════
 * InputPanel - Panneau de saisie du problème de PL
 * ═══════════════════════════════════════════════════════════════
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { useLPSolver } from '@/hooks/useLPSolver';
import {
  Plus,
  Trash2,
  Play,
  TrafficCone,
  Variable,
  ArrowDownAZ,
  ArrowUpAZ,
} from 'lucide-react';

interface InputPanelProps {
  solver: ReturnType<typeof useLPSolver>;
}

export function InputPanel({ solver }: InputPanelProps) {
  return (
    <div className="space-y-6">
      {/* Configuration rapide */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Variable className="w-4 h-4 text-indigo-600" />
            Configuration du problème
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Nom du projet / contexte</Label>
            <Input
              value={solver.projectName}
              onChange={(e) => solver.setProjectName(e.target.value)}
              placeholder="Ex: plan de production, budget, transport, affectation..."
              className="max-w-xl"
            />
          </div>

          {/* Nombre de variables */}
          <div className="space-y-2">
            <Label>Nombre de variables de décision</Label>
            <div className="flex gap-2">
              {[2, 3, 4].map(n => (
                <Button
                  key={n}
                  variant={solver.numVariables === n ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => solver.setNumVariables(n)}
                  className={solver.numVariables === n ? 'bg-indigo-600' : ''}
                >
                  {n} variables
                </Button>
              ))}
            </div>
          </div>

          {/* Type d'optimisation */}
          <div className="space-y-2">
            <Label>Type d'optimisation</Label>
            <div className="flex gap-2">
              <Button
                variant={solver.objectiveType === 'max' ? 'default' : 'outline'}
                size="sm"
                onClick={() => solver.setObjectiveType('max')}
                className={solver.objectiveType === 'max' ? 'bg-indigo-600' : ''}
              >
                <ArrowUpAZ className="w-4 h-4 mr-1.5" />
                Maximisation
              </Button>
              <Button
                variant={solver.objectiveType === 'min' ? 'default' : 'outline'}
                size="sm"
                onClick={() => solver.setObjectiveType('min')}
                className={solver.objectiveType === 'min' ? 'bg-indigo-600' : ''}
              >
                <ArrowDownAZ className="w-4 h-4 mr-1.5" />
                Minimisation
              </Button>
            </div>
          </div>

          {/* Méthode de résolution */}
          <div className="space-y-2">
            <Label>Méthode de résolution</Label>
            <Select
              value={solver.selectedMethod}
              onValueChange={(v) => solver.setSelectedMethod(v as 'auto' | 'graphic' | 'simplex' | 'dual')}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-détection (recommandé)</SelectItem>
                {solver.numVariables === 2 && <SelectItem value="graphic">Méthode Graphique</SelectItem>}
                <SelectItem value="simplex">Méthode du Simplexe</SelectItem>
                <SelectItem value="dual">Analyse de Dualité</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fonction objectif */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpAZ className="w-4 h-4 text-emerald-600" />
            Fonction Objectif
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: solver.numVariables }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <Label className="text-xs text-slate-500">Nom variable {i + 1}</Label>
                <Input
                  value={solver.variableNames[i]}
                  onChange={(e) => solver.updateVariableName(i, e.target.value)}
                  className="font-mono"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="text-sm font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
              {solver.objectiveType === 'max' ? 'Max' : 'Min'} Z =
            </Badge>
            {Array.from({ length: solver.numVariables }, (_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={solver.objectiveCoeffs[i] || 0}
                  onChange={(e) => solver.updateObjectiveCoeff(i, parseFloat(e.target.value) || 0)}
                  className="w-20 text-center font-mono"
                  step="any"
                />
                <span className="text-sm font-medium text-slate-600">
                  {solver.variableNames[i]}
                </span>
                {i < solver.numVariables - 1 && (
                  <span className="text-slate-400">+</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contraintes */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrafficCone className="w-4 h-4 text-amber-600" />
            Contraintes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {solver.constraints.map((constraint, idx) => (
            <div
              key={constraint.id}
              className="flex items-center gap-2 p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <Badge variant="secondary" className="text-xs min-w-[28px] text-center">
                {idx + 1}
              </Badge>

              <div className="flex items-center gap-2 flex-1 flex-wrap">
                <Input
                  value={constraint.label || ''}
                  onChange={(e) => solver.updateConstraint(constraint.id, { label: e.target.value })}
                  className="w-40 text-sm"
                  placeholder={`Contrainte ${idx + 1}`}
                />

                {Array.from({ length: solver.numVariables }, (_, vi) => (
                  <div key={vi} className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={constraint.coefficients[vi] || 0}
                      onChange={(e) => solver.updateConstraintCoeff(constraint.id, vi, parseFloat(e.target.value) || 0)}
                      className="w-16 text-center font-mono text-sm"
                      step="any"
                    />
                    <span className="text-xs text-slate-500">{solver.variableNames[vi]}</span>
                    {vi < solver.numVariables - 1 && <span className="text-slate-300">+</span>}
                  </div>
                ))}

                <Select
                  value={constraint.operator}
                  onValueChange={(v) => solver.updateConstraint(constraint.id, { operator: v as '<=' | '>=' | '=' })}
                >
                  <SelectTrigger className="w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<=">&le;</SelectItem>
                    <SelectItem value=">=">&ge;</SelectItem>
                    <SelectItem value="=">=</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={constraint.rhs}
                  onChange={(e) => solver.updateConstraint(constraint.id, { rhs: parseFloat(e.target.value) || 0 })}
                  className="w-20 text-center font-mono text-sm"
                  step="any"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => solver.removeConstraint(constraint.id)}
                disabled={solver.constraints.length <= 2}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={solver.addConstraint}
            className="w-full border-dashed border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/50"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ajouter une contrainte
          </Button>
        </CardContent>
      </Card>

      {/* Bouton de résolution */}
      <div className="flex justify-center py-4">
        <Button
          onClick={solver.solve}
          disabled={solver.isSolving}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-xl shadow-indigo-200 px-8"
        >
          <Play className="w-5 h-5 mr-2" />
          {solver.isSolving ? 'Résolution en cours...' : 'Résoudre le problème'}
        </Button>
      </div>
    </div>
  );
}
