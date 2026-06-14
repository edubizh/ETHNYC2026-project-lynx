import { Browse } from "@/components/Browse";
import { buildMindshareWindows } from "@/lib/mindshare-live";

// Live Polymarket volume each load; degrades to verified seeds inside buildMindshareWindows.
export const dynamic = "force-dynamic";

export default async function Home() {
  const windows = await buildMindshareWindows();
  return <Browse windows={windows} />;
}
