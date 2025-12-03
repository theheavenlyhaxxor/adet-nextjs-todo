import { NextResponse } from "next/server";

// Example server-side analytics endpoint returning four series timeseries
// Each entry has: date, desktop, mobile, referral, organic
export async function GET() {
  // In a real implementation, query your DB here and return the timeseries.
  const now = new Date();
  const data = [] as Array<Record<string, number | string>>;

  // generate 60 days of sample data
  for (let i = 59; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    data.push({
      date,
      desktop: Math.floor(200 + Math.random() * 300),
      mobile: Math.floor(100 + Math.random() * 350),
      referral: Math.floor(10 + Math.random() * 80),
      organic: Math.floor(50 + Math.random() * 200),
    });
  }

  return NextResponse.json({ timeseries: data });
}
