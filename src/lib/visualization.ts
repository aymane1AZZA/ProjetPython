/**
 * ═══════════════════════════════════════════════════════════════
 * ULPSS - Visualization Module
 * Interactive 2D graphics with Plotly
 * ═══════════════════════════════════════════════════════════════
 */

import type { GraphicSolution, LPProblem } from '@/types/lp';

// ──────────────────────────────────────────────────────────────
// COLOR CONFIGURATION
// ──────────────────────────────────────────────────────────────

const COLORS = {
  feasibleRegion: 'rgba(76, 175, 80, 0.25)',
  feasibleRegionBorder: 'rgba(76, 175, 80, 0.8)',
  constraintLines: [
    '#E53935', '#1E88E5', '#FB8C00', '#8E24AA',
    '#00897B', '#FDD835', '#546E77', '#D81B60',
  ],
  vertex: '#2E7D32',
  optimal: '#FF6F00',
  objectiveLine: '#1565C0',
  grid: 'rgba(0,0,0,0.08)',
  text: '#37474F',
};

// ──────────────────────────────────────────────────────────────
// 2D GRAPH - GRAPHICAL METHOD
// ──────────────────────────────────────────────────────────────

/**
 * Generates Plotly traces for the graphical method.
 * Faithfully reproduces GeoGebra style.
 */
export function generateGraphicTraces(
  graphic: GraphicSolution,
  problem: LPProblem,
  showObjectiveLine = true,
): object[] {
  const traces: object[] = [];
  const variableNames = problem.variableNames?.length ? problem.variableNames : ['x1', 'x2'];

  // 1. Feasible region (filled polygon)
  if (graphic.feasibleRegion.length >= 3) {
    const x = graphic.feasibleRegion.map(p => p[0]);
    const y = graphic.feasibleRegion.map(p => p[1]);

    traces.push({
      type: 'scatter',
      mode: 'lines',
      x,
      y,
      fill: 'toself',
      fillcolor: COLORS.feasibleRegion,
      line: { color: COLORS.feasibleRegionBorder, width: 2, dash: 'solid' },
      name: 'Region realisable',
      hoverinfo: 'skip',
      legendgroup: 'region',
    });
  }

  // 2. Constraint lines
  graphic.constraintLines.forEach((line, idx) => {
    const color = COLORS.constraintLines[idx % COLORS.constraintLines.length];
    const points = line.points;
    if (points.length >= 2) {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: [points[0][0], points[1][0]],
        y: [points[0][1], points[1][1]],
        line: { color, width: 2 },
        name: line.constraint.label || `Constraint ${idx + 1}`,
        hovertemplate: `${line.constraint.label || `C${idx + 1}`}: ${formatConstraint(line.constraint, variableNames)}<extra></extra>`,
        legendgroup: `constraint_${idx}`,
      });

      // Direction indicator for feasible side
      if (line.constraint.operator === '<=') {
        const midX = (points[0][0] + points[1][0]) / 2;
        const midY = (points[0][1] + points[1][1]) / 2;
        const a = line.constraint.coefficients[0];
        const b = line.constraint.coefficients[1];
        const norm = Math.sqrt(a * a + b * b);
        if (norm > 1e-9) {
          const dirX = -a / norm * 3;
          const dirY = -b / norm * 3;
          traces.push({
            type: 'scatter',
            mode: 'lines+markers',
            x: [midX, midX + dirX],
            y: [midY, midY + dirY],
            line: { color, width: 1, dash: 'dot' },
            marker: { size: 6, color },
            name: `Direction C${idx + 1}`,
            showlegend: false,
            hoverinfo: 'skip',
            legendgroup: `constraint_${idx}`,
          });
        }
      }
    }
  });

  // 3. Axes x=0 and y=0 (positivity constraints)
  const maxX = Math.max(...graphic.vertices.map(v => v.coordinates[0]), 10) * 1.3;
  const maxY = Math.max(...graphic.vertices.map(v => v.coordinates[1]), 10) * 1.3;

  traces.push({
    type: 'scatter',
    mode: 'lines',
    x: [0, 0],
    y: [0, maxY],
    line: { color: '#37474F', width: 2 },
    name: `${variableNames[0] || 'x1'} = 0`,
    hoverinfo: 'skip',
    showlegend: false,
  });
  traces.push({
    type: 'scatter',
    mode: 'lines',
    x: [0, maxX],
    y: [0, 0],
    line: { color: '#37474F', width: 2 },
    name: `${variableNames[1] || 'x2'} = 0`,
    hoverinfo: 'skip',
    showlegend: false,
  });

  // 4. Vertices (points)
  if (graphic.feasibleVertices.length > 0) {
    traces.push({
      type: 'scatter',
      mode: 'markers+text',
      x: graphic.feasibleVertices.map(v => v.coordinates[0]),
      y: graphic.feasibleVertices.map(v => v.coordinates[1]),
      text: graphic.feasibleVertices.map(v => `${v.label}<br>Z=${v.zValue}`),
      textposition: 'top center',
      textfont: { size: 11, color: COLORS.text },
      marker: {
        size: 14,
        color: COLORS.vertex,
        symbol: 'circle',
        line: { color: 'white', width: 2 },
      },
      name: 'Sommets admissibles',
      hovertemplate: '%{text}<extra></extra>',
      legendgroup: 'vertices',
    });
  }

  // 5. Optimal point (highlighted)
  if (graphic.optimalVertex) {
    traces.push({
      type: 'scatter',
      mode: 'markers+text',
      x: [graphic.optimalVertex.coordinates[0]],
      y: [graphic.optimalVertex.coordinates[1]],
      text: [`OPTIMAL<br>${graphic.optimalVertex.label}<br>Z* = ${graphic.optimalVertex.zValue}`],
      textposition: 'bottom center',
      textfont: { size: 13, color: COLORS.optimal },
      marker: {
        size: 22,
        color: COLORS.optimal,
        symbol: 'star',
        line: { color: 'white', width: 3 },
      },
      name: 'Solution optimale',
      hovertemplate: `OPTIMAL<br>${variableNames[0] || 'x1'} = ${graphic.optimalVertex.coordinates[0]}<br>${variableNames[1] || 'x2'} = ${graphic.optimalVertex.coordinates[1]}<br>Z* = ${graphic.optimalVertex.zValue}<extra></extra>`,
      legendgroup: 'optimal',
    });
  }

  // 6. Objective isovalue line
  if (showObjectiveLine && graphic.optimalVertex) {
    const [c1, c2] = problem.objective.coefficients;
    const zVal = graphic.optimalVertex.zValue;

    if (Math.abs(c1) > 1e-9 && Math.abs(c2) > 1e-9) {
      const xStart = 0;
      const yStart = zVal / c2;
      const xEnd = maxX;
      const yEnd = (zVal - c1 * maxX) / c2;

      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: [xStart, xEnd],
        y: [Math.max(0, yStart), Math.max(0, yEnd)],
        line: { color: COLORS.objectiveLine, width: 3, dash: 'dash' },
        name: `Z = ${zVal}`,
        hovertemplate: `Objectif: Z = ${c1}${variableNames[0] || 'x1'} + ${c2}${variableNames[1] || 'x2'} = ${zVal}<extra></extra>`,
        legendgroup: 'objective',
      });

      // Optimization direction arrow
      const gradX = c1;
      const gradY = c2;
      const gradNorm = Math.sqrt(gradX * gradX + gradY * gradY);
      const arrowLen = 8;
      const optX = graphic.optimalVertex.coordinates[0];
      const optY = graphic.optimalVertex.coordinates[1];

      traces.push({
        type: 'scatter',
        mode: 'lines+markers',
        x: [optX, optX + gradX / gradNorm * arrowLen],
        y: [optY, optY + gradY / gradNorm * arrowLen],
        line: { color: COLORS.objectiveLine, width: 2 },
        marker: { size: 8, symbol: 'arrow', color: COLORS.objectiveLine },
        name: 'Direction d\'optimisation',
        showlegend: false,
        hoverinfo: 'skip',
        legendgroup: 'objective',
      });
    }
  }

  return traces;
}

/**
 * Generates Plotly layout for the 2D graph.
 */
export function generateGraphicLayout(
  graphic: GraphicSolution,
  title = 'Graphical Method - Feasible Region',
  problem?: LPProblem,
): object {
  const variableNames = problem?.variableNames?.length ? problem.variableNames : ['x1', 'x2'];
  const maxX = Math.max(
    ...graphic.vertices.map(v => v.coordinates[0]),
    ...graphic.constraintLines.flatMap(l => l.points.map(p => p[0])),
    10
  ) * 1.2;
  const maxY = Math.max(
    ...graphic.vertices.map(v => v.coordinates[1]),
    ...graphic.constraintLines.flatMap(l => l.points.map(p => p[1])),
    10
  ) * 1.2;

  return {
    title: {
      text: title,
      font: { size: 18, color: '#263238' },
    },
    xaxis: {
      title: variableNames[0] || 'x1',
      range: [-maxX * 0.05, maxX],
      gridcolor: COLORS.grid,
      zerolinecolor: '#37474F',
      zerolinewidth: 2,
      showgrid: true,
    },
    yaxis: {
      title: variableNames[1] || 'x2',
      range: [-maxY * 0.05, maxY],
      gridcolor: COLORS.grid,
      zerolinecolor: '#37474F',
      zerolinewidth: 2,
      showgrid: true,
      scaleanchor: 'x',
      scaleratio: 1,
    },
    showlegend: true,
    legend: {
      x: 1.02,
      y: 1,
      bgcolor: 'rgba(255,255,255,0.9)',
      bordercolor: '#B0BEC5',
      borderwidth: 1,
    },
    plot_bgcolor: '#FAFAFA',
    paper_bgcolor: 'white',
    margin: { l: 60, r: 150, t: 60, b: 60 },
    hovermode: 'closest',
    dragmode: 'pan',
  };
}

// ──────────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────────

function formatConstraint(
  c: { coefficients: number[]; operator: string; rhs: number },
  variableNames: string[] = [],
): string {
  const terms: string[] = [];
  c.coefficients.forEach((coef, i) => {
    if (Math.abs(coef) > 1e-9) {
      terms.push(`${coef}${variableNames[i] || `x${i + 1}`}`);
    }
  });
  return `${terms.join(' + ')} ${c.operator} ${c.rhs}`;
}

/**
 * Generates data for simplex progression chart.
 */
export function generateSimplexProgressTraces(tableaux: { iteration: number; zValue: number }[]): object[] {
  return [{
    type: 'scatter',
    mode: 'lines+markers',
    x: tableaux.map(t => t.iteration),
    y: tableaux.map(t => t.zValue),
    line: { color: '#1565C0', width: 3 },
    marker: { size: 10, color: '#1565C0' },
    name: 'Valeur de Z',
    hovertemplate: 'Iteration %{x}<br>Z = %{y}<extra></extra>',
  }];
}

export function generateSimplexProgressLayout(): object {
  return {
    title: { text: 'Progression du Simplexe', font: { size: 16 } },
    xaxis: { title: 'Iteration', dtick: 1 },
    yaxis: { title: 'Valeur de Z' },
    plot_bgcolor: '#FAFAFA',
    paper_bgcolor: 'white',
    margin: { l: 60, r: 40, t: 50, b: 60 },
  };
}
