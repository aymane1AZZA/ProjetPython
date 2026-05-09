/**
 * ═══════════════════════════════════════════════════════════════
 * ULPSS - Universal Linear Programming Smart Solver
 * Composant principal de l'application
 * ═══════════════════════════════════════════════════════════════
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputPanel } from '@/sections/InputPanel';
import { GraphicView } from '@/sections/GraphicView';
import { SimplexViewer } from '@/sections/SimplexViewer';
import { DualityPanel } from '@/sections/DualityPanel';
import { ResultsPanel } from '@/sections/ResultsPanel';
import { useLPSolver } from '@/hooks/useLPSolver';
import {
  GitGraph,
  TableProperties,
  ArrowLeftRight,
  Play,
  RotateCcw,
  Lightbulb,
  Calculator,
} from 'lucide-react';

function App() {
  const solver = useLPSolver();
  const [activeTab, setActiveTab] = useState('input');

  const handleSolve = async () => {
    const solution = await solver.solve();
    if (solution) {
      // Déterminer l'onglet actif en fonction de la méthode
      if (solution.graphicSolution) {
        setActiveTab('graphic');
      } else if (solution.simplexSolution) {
        setActiveTab('simplex');
      }
    }
  };

  const hasGraphic = solver.solution?.graphicSolution !== null;
  const hasSimplex = solver.solution?.simplexSolution !== null;
  const hasDual = solver.solution?.dualityAnalysis !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent">
                ULPSS
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">
                Universal Linear Programming Smart Solver
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {solver.solution && (
              <Badge
                variant={solver.solution.status === 'optimal' ? 'default' : 'destructive'}
                className="px-3 py-1"
              >
                {solver.solution.status === 'optimal'
                  ? `Z* = ${solver.solution.optimalValue}`
                  : solver.solution.status}
              </Badge>
            )}
            <Button
              onClick={handleSolve}
              disabled={solver.isSolving}
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200"
            >
              <Play className="w-4 h-4 mr-1.5" />
              {solver.isSolving ? 'Résolution...' : 'Résoudre'}
            </Button>
            <Button
              onClick={() => { solver.loadPreset('traffic'); setActiveTab('input'); }}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between">
            <TabsList className="bg-white/70 backdrop-blur-sm border border-slate-200 p-1 h-auto gap-1">
              <TabsTrigger value="input" className="px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                <GitGraph className="w-4 h-4 mr-2" />
                Problème
              </TabsTrigger>
              <TabsTrigger
                value="graphic"
                disabled={!hasGraphic}
                className="px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white disabled:opacity-40"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Méthode Graphique
              </TabsTrigger>
              <TabsTrigger
                value="simplex"
                disabled={!hasSimplex}
                className="px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white disabled:opacity-40"
              >
                <TableProperties className="w-4 h-4 mr-2" />
                Simplexe
              </TabsTrigger>
              <TabsTrigger
                value="dual"
                disabled={!hasDual}
                className="px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white disabled:opacity-40"
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Dualité
              </TabsTrigger>
              <TabsTrigger
                value="results"
                disabled={!solver.solution}
                className="px-4 py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white disabled:opacity-40"
              >
                <Play className="w-4 h-4 mr-2" />
                Résultats
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="input" className="mt-0">
            <InputPanel solver={solver} />
          </TabsContent>

          <TabsContent value="graphic" className="mt-0">
            {solver.solution?.graphicSolution && (
              <GraphicView
                graphic={solver.solution.graphicSolution}
                problem={solver.solution.problem}
              />
            )}
          </TabsContent>

          <TabsContent value="simplex" className="mt-0">
            {solver.solution?.simplexSolution && (
              <SimplexViewer
                simplex={solver.solution.simplexSolution}
                currentStep={solver.currentSimplexStep}
                onStepChange={solver.setCurrentSimplexStep}
              />
            )}
          </TabsContent>

          <TabsContent value="dual" className="mt-0">
            {solver.solution?.dualityAnalysis && (
              <DualityPanel analysis={solver.solution.dualityAnalysis} />
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            {solver.solution && (
              <ResultsPanel solution={solver.solution} />
            )}
          </TabsContent>
        </Tabs>

        {solver.error && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-700 text-sm">Erreur</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 text-sm">{solver.error}</p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 mt-12">
        <div className="max-w-[1600px] mx-auto px-4 py-4 text-center text-xs text-slate-400">
          ULPSS — Universal Linear Programming Smart Solver • Moteur mathématique de recherche opérationnelle
        </div>
      </footer>
    </div>
  );
}

export default App;
