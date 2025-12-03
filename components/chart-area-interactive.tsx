"use client";

import * as React from "react";
// axios types not required in this file after switching to local fetch fallback
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "@/lib/api";

export const description = "An interactive area chart";

// (kept a small default set above as `DEFAULT_CHART_DATA`)

// chartConfig removed — chart series are derived from backend data dynamically

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("90d");
  const [chartData, setChartData] = React.useState<
    Array<Record<string, string | number>>
  >(() => []);
  const [loadingChart, setLoadingChart] = React.useState(false);
  const [chartError, setChartError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchChart() {
      setLoadingChart(true);
      setChartError(null);

      try {
        const token =
          typeof window !== "undefined"
            ? sessionStorage.getItem("token")
            : null;
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        // First try a local API route (app/api/analytics)
        let payload: unknown = null;
        try {
          const localRes = await fetch("/api/analytics", {
            headers: headers as Record<string, string> | undefined,
          });
          if (localRes.ok) {
            const json = await localRes.json();
            payload = json?.timeseries ?? json ?? null;
          }
        } catch {
          // ignore and fallback
        }

        // Fallback to configured backend API (via lib/api)
        if (!payload) {
          try {
            const r = await api.get("/analytics", { headers });
            payload = r?.data ?? null;
          } catch {
            // fallback end
          }
        }

        if (!payload) throw new Error("No chart data");

        // Normalize common wrappers to an array of objects
        if (Array.isArray(payload)) {
          // use as-is
        } else if (
          Array.isArray((payload as Record<string, unknown>)["chart"])
        ) {
          payload = (payload as Record<string, unknown>)["chart"] as unknown;
        } else if (
          Array.isArray((payload as Record<string, unknown>)["data"])
        ) {
          payload = (payload as Record<string, unknown>)["data"] as unknown;
        } else if (
          Array.isArray((payload as Record<string, unknown>)["analytics"])
        ) {
          payload = (payload as Record<string, unknown>)[
            "analytics"
          ] as unknown;
        } else if (
          Array.isArray((payload as Record<string, unknown>)["timeseries"])
        ) {
          payload = (payload as Record<string, unknown>)[
            "timeseries"
          ] as unknown;
        } else {
          // Possibly an object keyed by date: { "2025-01-01": { a:1, b:2, ... }, ... }
          const entries = Object.entries(
            (payload as Record<string, unknown>) || {}
          );
          if (entries.length > 0 && typeof entries[0][1] === "object") {
            payload = entries.map(([date, val]) => ({
              date,
              ...(val as Record<string, unknown>),
            }));
          } else {
            payload = [];
          }
        }

        const arr = (payload as Record<string, unknown>[]).map((obj) => {
          const normalized: Record<string, string | number> = {};
          const date = String(obj.date ?? obj["date"] ?? "");
          normalized.date = date;
          // For every other key in the object, coerce to number when possible
          for (const [k, v] of Object.entries(obj)) {
            if (k === "date") continue;
            const n = Number(v as unknown);
            normalized[k] = Number.isNaN(n) ? (v as string) ?? "" : n;
          }
          return normalized;
        });

        if (!cancelled) setChartData(arr);
      } catch (err) {
        console.error("Failed to fetch chart data:", err);
        if (!cancelled) setChartError("Failed to load chart data");
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    }

    fetchChart();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const referenceDate = new Date(
    chartData[chartData.length - 1]?.date ?? Date.now()
  );
  const filteredData = chartData.filter(
    (item: Record<string, string | number>) => {
      const date = new Date(String(item.date));
      let daysToSubtract = 90;
      if (timeRange === "30d") {
        daysToSubtract = 30;
      } else if (timeRange === "7d") {
        daysToSubtract = 7;
      }
      const startDate = new Date(referenceDate);
      startDate.setDate(startDate.getDate() - daysToSubtract);
      return date >= startDate;
    }
  );

  const seriesKeys = React.useMemo(() => {
    if (!chartData.length) return [] as string[];
    return Object.keys(chartData[0]).filter((k) => k !== "date");
  }, [chartData]);

  const colorPalette = React.useMemo(
    () => ["#60A5FA", "#34D399", "#F59E0B", "#F87171", "#A78BFA", "#38BDF8"],
    []
  );
  const visibleSeries = React.useMemo(
    () => seriesKeys.slice(0, 4),
    [seriesKeys]
  );

  const dynamicConfig: ChartConfig = React.useMemo(() => {
    const cfg: Record<string, { label?: React.ReactNode; color?: string }> = {};
    visibleSeries.forEach((k, i) => {
      cfg[k] = {
        label: k
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, (c) => String(c).toUpperCase()),
        color: colorPalette[i % colorPalette.length],
      };
    });
    return cfg as unknown as ChartConfig;
  }, [visibleSeries, colorPalette]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Visitors</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {chartData.length === 0 ? (
          <div className="text-sm text-muted-foreground px-4">
            No chart data
          </div>
        ) : (
          <ChartContainer
            config={dynamicConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                {visibleSeries.map((k, i) => (
                  <linearGradient
                    key={k}
                    id={`fill-${k}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={colorPalette[i % colorPalette.length]}
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="95%"
                      stopColor={colorPalette[i % colorPalette.length]}
                      stopOpacity={0.08}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(String(value));
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(String(value)).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        }
                      );
                    }}
                    indicator="dot"
                  />
                }
              />
              {visibleSeries.map((k, i) => (
                <Area
                  key={k}
                  dataKey={k}
                  type="natural"
                  fill={`url(#fill-${k})`}
                  stroke={colorPalette[i % colorPalette.length]}
                  stackId={"a"}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
        {loadingChart ? (
          <div className="text-sm text-muted-foreground px-4">
            Loading chart…
          </div>
        ) : null}
        {chartError ? (
          <div className="text-sm text-red-500 px-4">{chartError}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
