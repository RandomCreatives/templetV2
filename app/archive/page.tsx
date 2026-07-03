import { AdminGate } from '@/components/AdminGate';
import { MasonryArchive } from '@/components/MasonryArchive';
import { getPhotographs } from '@/lib/data';

export const metadata = {
  title: 'Archive | Minimal Photo Archive'
};

const INITIAL_LIMIT = 12;

export default async function ArchivePage() {
  // Use pagination for initial load to sync with client component logic
  const photographs = await getPhotographs({ limit: INITIAL_LIMIT, offset: 0 });

  return (
    <main className="mx-auto max-w-[1800px] px-3 py-4 md:px-5">
      <div className="mb-4 flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
        <h1 className="text-black">ARCHIVE / GRID</h1>
        <p>EXPLORE MONOCHROME COLLECTION</p>
      </div>
      <MasonryArchive initialPhotographs={photographs} />
      <AdminGate />
    </main>
  );
}
