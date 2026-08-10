import { AppShell } from "@/components/AppShell";
import { ReadingManager } from "@/components/ReadingManager";
import { SectionHeader } from "@/components/SectionHeader";

export default function ReadingsPage() {
  return <AppShell><SectionHeader eyebrow="Sensor Data" title="Reading management" description="Tambah dan tinjau data suhu, kelembapan, curah hujan, serta kecepatan angin per station." /><ReadingManager /></AppShell>;
}
