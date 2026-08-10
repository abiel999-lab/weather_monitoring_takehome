import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/SectionHeader";
import { StationManager } from "@/components/StationManager";

export default function StationsPage() {
  return <AppShell><SectionHeader eyebrow="Configuration" title="Station management" description="CRUD station dengan validasi koordinat, code unik, dan cascade delete terhadap reading terkait." /><StationManager /></AppShell>;
}
