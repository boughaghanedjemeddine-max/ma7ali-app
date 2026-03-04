/**
 * LazyCharts — dynamic import wrapper for recharts
 *
 * Instead of importing recharts at the module level (which can trigger
 * TDZ errors due to circular dependencies in d3), this component
 * dynamically loads recharts at runtime and provides the components
 * via a render-prop / children pattern.
 *
 * Usage:
 *   <LazyCharts fallback={<Skeleton />}>
 *     {(RC) => (
 *       <RC.ResponsiveContainer width="100%" height={200}>
 *         <RC.BarChart data={data}>
 *           <RC.Bar dataKey="value" />
 *         </RC.BarChart>
 *       </RC.ResponsiveContainer>
 *     )}
 *   </LazyCharts>
 */

import { useState, useEffect, ReactNode } from "react";

// The full set of recharts exports we use in the app
export interface RechartsLib {
  BarChart: typeof import("recharts").BarChart;
  Bar: typeof import("recharts").Bar;
  XAxis: typeof import("recharts").XAxis;
  YAxis: typeof import("recharts").YAxis;
  Tooltip: typeof import("recharts").Tooltip;
  ResponsiveContainer: typeof import("recharts").ResponsiveContainer;
  PieChart: typeof import("recharts").PieChart;
  Pie: typeof import("recharts").Pie;
  Cell: typeof import("recharts").Cell;
  LineChart: typeof import("recharts").LineChart;
  Line: typeof import("recharts").Line;
  AreaChart: typeof import("recharts").AreaChart;
  Area: typeof import("recharts").Area;
  Legend: typeof import("recharts").Legend;
  CartesianGrid: typeof import("recharts").CartesianGrid;
}

// Module-level cache — load once, reuse everywhere
let cachedLib: RechartsLib | null = null;
let loadPromise: Promise<RechartsLib> | null = null;

function loadRecharts(): Promise<RechartsLib> {
  if (cachedLib) return Promise.resolve(cachedLib);
  if (loadPromise) return loadPromise;

  loadPromise = import("recharts").then((mod) => {
    cachedLib = {
      BarChart: mod.BarChart,
      Bar: mod.Bar,
      XAxis: mod.XAxis,
      YAxis: mod.YAxis,
      Tooltip: mod.Tooltip,
      ResponsiveContainer: mod.ResponsiveContainer,
      PieChart: mod.PieChart,
      Pie: mod.Pie,
      Cell: mod.Cell,
      LineChart: mod.LineChart,
      Line: mod.Line,
      AreaChart: mod.AreaChart,
      Area: mod.Area,
      Legend: mod.Legend,
      CartesianGrid: mod.CartesianGrid,
    };
    return cachedLib;
  });

  return loadPromise;
}

interface LazyChartsProps {
  children: (lib: RechartsLib) => ReactNode;
  fallback?: ReactNode;
}

export function LazyCharts({ children, fallback }: LazyChartsProps) {
  const [lib, setLib] = useState<RechartsLib | null>(cachedLib);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (lib) return;
    let cancelled = false;

    loadRecharts()
      .then((rc) => { if (!cancelled) setLib(rc); })
      .catch((err) => { if (!cancelled) setError(err); });

    return () => { cancelled = true; };
  }, [lib]);

  if (error) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        تعذّر تحميل الرسوم البيانية
      </div>
    );
  }

  if (!lib) {
    return <>{fallback ?? <div className="h-[200px] animate-pulse bg-muted/30 rounded-lg" />}</>;
  }

  return <>{children(lib)}</>;
}

// Hook variant for components that prefer hooks
export function useRecharts(): RechartsLib | null {
  const [lib, setLib] = useState<RechartsLib | null>(cachedLib);

  useEffect(() => {
    if (lib) return;
    loadRecharts().then(setLib).catch(() => {});
  }, [lib]);

  return lib;
}
