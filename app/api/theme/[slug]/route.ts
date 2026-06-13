import { NextResponse } from "next/server";
import { buildDashboard } from "@/lib/dashboard/service";

// The data-service endpoint: composes Polymarket Gamma odds + the analyst-band percentile +
// the Uniswap /quote asset-leg oracle into the AI Sentiment Gap, with graceful seed fallbacks.
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const view = await buildDashboard(params.slug);
    return NextResponse.json(view);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}
