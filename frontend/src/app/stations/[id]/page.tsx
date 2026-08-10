import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import { StationDetail } from "@/components/StationDetail";

export default async function StationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppShell><SectionHeader eyebrow="Station Detail" title={`Station #${id}`} description="Trend, lokasi, metadata, serta penjelasan anomali berbasis data aktual." action={<Link href="/stations" className="btn btn-secondary">← Stations</Link>} /><StationDetail id={Number(id)} /></AppShell>;
}
