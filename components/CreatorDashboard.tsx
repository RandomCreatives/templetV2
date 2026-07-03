'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type CreatorProfile = {
  fullName: string;
  email: string;
  creatorCode: string;
  contentHub: string;
  tier: string;
  status: string;
  createdAt: string;
};

export function CreatorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace('/login');
          return;
        }

        // Fetch creator record by email
        const { data: creator, error: creatorError } = await supabase
          .from('creators')
          .select('full_name, contact_email, creator_code, primary_content_hub, tier, status, created_at')
          .eq('contact_email', user.email!)
          .maybeSingle();

        if (creatorError || !creator) {
          setError('Could not load creator profile.');
          setLoading(false);
          return;
        }

        setProfile({
          fullName: creator.full_name,
          email: creator.contact_email,
          creatorCode: creator.creator_code,
          contentHub: creator.primary_content_hub,
          tier: creator.tier,
          status: creator.status,
          createdAt: new Date(creator.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          })
        });
      } catch {
        // Supabase not configured — dev mode
        setProfile({
          fullName: 'LOCAL DEV USER',
          email: 'dev@localhost',
          creatorCode: 'ETMM-DEVX-DEVX-DEVX',
          contentHub: 'LOCAL',
          tier: 'tier_1',
          status: 'active',
          createdAt: new Date().toLocaleDateString()
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router]);

  async function signOut() {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch { /* dev mode */ }
    router.push('/login');
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">[ LOADING ]</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-700">[ ERROR ] {error}</p>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 md:px-5">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between border-b border-black pb-5">
        <div>
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">CREATOR DASHBOARD</p>
          <h1 className="font-mono text-[14px] uppercase tracking-[0.16em] text-black">{profile.fullName}</h1>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500 hover:text-black"
        >
          [ SIGN OUT ]
        </button>
      </div>

      {/* Profile card */}
      <section className="mb-8 border border-black p-5">
        <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">PROFILE</p>
        <dl className="grid grid-cols-[140px_1fr] gap-y-3 font-mono text-[11px] uppercase tracking-[0.08em]">
          <dt className="text-gray-500">CREATOR CODE</dt>
          <dd className="font-mono tracking-[0.16em] text-black">{profile.creatorCode}</dd>
          <dt className="text-gray-500">EMAIL</dt>
          <dd className="text-black">{profile.email}</dd>
          <dt className="text-gray-500">HUB</dt>
          <dd className="text-black">{profile.contentHub}</dd>
          <dt className="text-gray-500">TIER</dt>
          <dd className="text-black">{profile.tier.replace('_', ' ').toUpperCase()}</dd>
          <dt className="text-gray-500">STATUS</dt>
          <dd className={profile.status === 'active' ? 'text-black' : 'text-gray-400'}>
            {profile.status.replace('_', ' ').toUpperCase()}
          </dd>
          <dt className="text-gray-500">MEMBER SINCE</dt>
          <dd className="text-black">{profile.createdAt}</dd>
        </dl>
      </section>

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/archive"
          className="border border-black px-4 py-4 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white transition-colors"
        >
          [ VIEW ARCHIVE ]
        </Link>
        <Link
          href="/projects"
          className="border border-black px-4 py-4 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white transition-colors"
        >
          [ VIEW PROJECTS ]
        </Link>
      </section>
    </main>
  );
}
