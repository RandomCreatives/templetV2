import { AdminGate } from '@/components/AdminGate';
import { MasonryArchive } from '@/components/MasonryArchive';
import { getPhotographs } from '@/lib/data';

export const metadata = {
  title: 'Archive | Minimal Photo Archive'
};

export default async function ArchivePage() {
  const photographs = await getPhotographs();

  return (
    <main className="mx-auto max-w-[1800px] px-3 py-4 md:px-5">
      <div className="mb-4 flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">
        <h1 className="text-black">ARCHIVE</h1>
        <p>{photographs.length} IMAGES</p>
      </div>
      <MasonryArchive photographs={photographs} />
      <AdminGate />
    </main>
  );
}
