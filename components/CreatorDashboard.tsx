'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export function CreatorDashboard() {
  const router = useRouter();
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace('/login');
          return;
        }

        // Fetch creator record — requires the RLS policy:
        // "Creators can read their own record" (contact_email = auth.jwt() ->> 'email')
        const { data: creator } = await supabase
          .from('creators')
          .select('full_name')
          .eq('contact_email', user.email!)
          .maybeSingle();

        setCreatorName(creator?.full_name ?? user.email ?? 'CREATOR');
      } catch {
        // Supabase not configured — dev mode
        setCreatorName('LOCAL DEV USER');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">[ LOADING ]</p>
      </main>
    );
  }

  if (!creatorName) return null;

  return <AdminDashboard creatorName={creatorName} />;
}
