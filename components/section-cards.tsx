"use client";

import React from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";

type Analytics = {
  totalTodos?: number;
  totalUsers?: number;
  totalPositions?: number;
  totalData?: number;
};

export function SectionCards() {
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const token =
          typeof window !== "undefined"
            ? sessionStorage.getItem("token")
            : null;
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const res = await api.get("/analytics", { headers });
        if (cancelled) return;

        const data = res?.data ?? {};
        const payload: Analytics = {
          totalTodos: data.todos,
          totalUsers: data.users,
          totalPositions: data.positions,
          totalData: data.total,
        };

        setAnalytics(payload);
      } catch (err) {
        // keep it non-blocking; surface a minimal error message
        console.error("Failed to fetch analytics:", err);
        if (!cancelled) setError("Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const show = (value: number | undefined | null, fallback: string) =>
    typeof value === "number" ? value.toLocaleString() : fallback;

  const describe = (
    key: "todos" | "users" | "positions" | "data",
    value: number | undefined | null
  ) => {
    if (value == null) return "No data";

    switch (key) {
      case "todos":
        if (value > 10000) return "Very high activity";
        if (value > 1000) return "High activity";
        if (value > 100) return "Moderate activity";
        return "Low activity";
      case "users":
        if (value > 100000) return "Large userbase";
        if (value > 10000) return "Growing userbase";
        if (value > 1000) return "Active users";
        return "Small userbase";
      case "positions":
        if (value > 10000) return "Many positions";
        if (value > 1000) return "Healthy positions";
        return "Few positions";
      case "data":
        if (value > 1000) return "High data volume";
        if (value > 100) return "Moderate data";
        return "Low data";
      default:
        return "";
    }
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>
            {describe("todos", analytics?.totalTodos)}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading && !analytics
              ? "Loading…"
              : show(analytics?.totalTodos, "—")}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">
            Total: {show(analytics?.totalTodos, "—")}
          </div>
          <div className="text-muted-foreground">Source: analytics API</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>
            {describe("users", analytics?.totalUsers)}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading && !analytics
              ? "Loading…"
              : show(analytics?.totalUsers, "—")}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">
            Total: {show(analytics?.totalUsers, "—")}
          </div>
          <div className="text-muted-foreground">Source: analytics API</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>
            {describe("positions", analytics?.totalPositions)}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading && !analytics
              ? "Loading…"
              : show(analytics?.totalPositions, "—")}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">
            Total: {show(analytics?.totalPositions, "—")}
          </div>
          <div className="text-muted-foreground">Source: analytics API</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>
            {describe("data", analytics?.totalData)}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {loading && !analytics
              ? "Loading…"
              : show(analytics?.totalData, "—")}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">
            Total: {show(analytics?.totalData, "—")}
          </div>
          <div className="text-muted-foreground">Source: analytics API</div>
        </CardFooter>
      </Card>
      {error ? (
        <div className="col-span-full text-sm text-red-500 px-4">{error}</div>
      ) : null}
    </div>
  );
}
