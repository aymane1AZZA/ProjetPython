/**
 * Composant Plotly wrapper utilisant plotly.js-dist-min directement
 * Évite les problèmes de dépendances avec react-plotly.js
 */

import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

interface PlotlyChartProps {
  data: object[];
  layout: object;
  config?: object;
  style?: React.CSSProperties;
  useResizeHandler?: boolean;
}

export function PlotlyChart({ data, layout, config, style, useResizeHandler }: PlotlyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartIdRef = useRef<string>('');

  useEffect(() => {
    if (!chartRef.current) return;

    // Generate unique ID for this chart instance
    if (!chartIdRef.current) {
      chartIdRef.current = 'plotly-' + Math.random().toString(36).substring(2, 9);
      chartRef.current.id = chartIdRef.current;
    }

    const element = document.getElementById(chartIdRef.current);
    if (!element) return;

    // Clone data and layout to avoid mutations
    const safeData = JSON.parse(JSON.stringify(data));
    const safeLayout = JSON.parse(JSON.stringify(layout));
    const safeConfig = config ? JSON.parse(JSON.stringify(config)) : {};

    Plotly.newPlot(element, safeData, safeLayout, safeConfig).catch(() => {
      // Silently handle any plotly errors
    });

    // Cleanup
    return () => {
      if (element) {
        Plotly.purge(element);
      }
    };
  }, [data, layout, config]);

  // Resize handler
  useEffect(() => {
    if (!useResizeHandler || !chartRef.current) return;

    const observer = new ResizeObserver(() => {
      const element = document.getElementById(chartIdRef.current);
      if (element) {
        Plotly.Plots.resize(element);
      }
    });

    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, [useResizeHandler]);

  return (
    <div
      ref={chartRef}
      style={style || { width: '100%', height: '500px' }}
    />
  );
}
