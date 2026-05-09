/**
 * ═══════════════════════════════════════════════════════════════
 * GraphicView - Visualisation 2D interactive (style GeoGebra)
 * ═══════════════════════════════════════════════════════════════
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlotlyChart } from '@/components/PlotlyChart';
import type { GraphicSolution, LPProblem } from '@/types/lp';
import {
  generateGraphicTraces,
  generateGraphicLayout,
} from '@/lib/visualization';
import { TrendingUp, MapPin, Star, Layers } from 'lucide-react';

interface GraphicViewProps {
  graphic: GraphicSolution;
  problem: LPProblem;
}

export function GraphicView({ graphic, problem }: GraphicViewProps) {
  const plotData = useMemo(() => {
    return generateGraphicTraces(graphic, problem, true);
  }, [graphic, problem]);

  const plotLayout = useMemo(() => {
    return generateGraphicLayout(graphic, 'Methode Graphique - Region Realisable', problem);
  }, [graphic, problem]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique principal */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Representation Graphique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlotlyChart
              data={plotData}
              layout={plotLayout}
              config={{
                responsive: true,
                displayModeBar: true,
                scrollZoom: true,
                displaylogo: false,
              }}
              style={{ width: '100%', height: '550px' }}
              useResizeHandler={true}
            />
          </CardContent>
        </Card>

        {/* Panneau d'information */}
        <div className="space-y-4">
          {/* Solution optimale */}
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-indigo-800">
                <Star className="w-4 h-4 text-amber-500" />
                Solution Optimale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {graphic.optimalVertex ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Point</span>
                    <Badge className="bg-amber-500 text-white">
                      {graphic.optimalVertex.label}
                    </Badge>
                  </div>
                  {graphic.optimalVertex.coordinates.map((v, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">{problem.variableNames[i] || `x${i + 1}`}</span>
                      <span className="font-mono font-semibold text-indigo-800">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center border-t border-indigo-200 pt-2">
                    <span className="text-sm font-medium text-slate-700">Z*</span>
                    <span className="font-mono font-bold text-lg text-indigo-900">
                      {graphic.optimalVertex.zValue}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-500">Aucune solution optimale trouvee</p>
              )}
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sommets admissibles</span>
                <Badge variant="outline">{graphic.feasibleVertices.length}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Contraintes</span>
                <Badge variant="outline">{problem.constraints.length}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Region bornee</span>
                <Badge variant={graphic.isBounded ? 'default' : 'destructive'}>
                  {graphic.isBounded ? 'Oui' : 'Non'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Contraintes actives */}
          {graphic.optimalVertex && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Contraintes actives a l&apos;optimum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {graphic.optimalVertex.activeConstraints
                    .filter(id => !id.includes('=') || id === 'x=0' || id === 'y=0')
                    .map(id => {
                      const c = problem.constraints.find(con => con.id === id);
                      return (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="text-xs bg-red-50 text-red-700 border-red-200"
                        >
                          {c?.label || id}
                        </Badge>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tableau des sommets */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Tableau des sommets admissibles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Point</TableHead>
                {Array.from({ length: problem.numVariables }, (_, i) => (
                  <TableHead key={i} className="font-mono">{problem.variableNames[i] || `x${i + 1}`}</TableHead>
                ))}
                <TableHead className="font-mono">Z</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {graphic.feasibleVertices
                .sort((a, b) => b.zValue - a.zValue)
                .map((vertex) => (
                  <TableRow
                    key={vertex.label}
                    className={vertex.label === graphic.optimalVertex?.label ? 'bg-amber-50' : ''}
                  >
                    <TableCell className="font-semibold">{vertex.label}</TableCell>
                    {vertex.coordinates.map((v, i) => (
                      <TableCell key={i} className="font-mono">{v}</TableCell>
                    ))}
                    <TableCell className="font-mono font-semibold">{vertex.zValue}</TableCell>
                    <TableCell>
                      {vertex.label === graphic.optimalVertex?.label ? (
                        <Badge className="bg-amber-500 text-white">MAX</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">Admissible</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
