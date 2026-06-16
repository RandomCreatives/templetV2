import { CreatorRegistrationForm } from '@/components/register/CreatorRegistrationForm';

export const metadata = {
  title: 'Creator Registration | EverydayThings',
  robots: { index: false, follow: false }
};

export default function RegisterPage() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-4xl place-items-center px-3 py-10 md:px-5">
      <section className="w-full max-w-2xl border border-black bg-white p-4 md:p-6">
        <header className="mb-8 border-b border-black pb-4 font-mono uppercase tracking-[0.12em]">
          <p className="mb-2 text-[10px] text-gray-500">EVERYDAYTHINGS / TIER-1 ACCESS</p>
          <h1 className="text-[14px] text-black">CREATOR REGISTRATION</h1>
        </header>
        <CreatorRegistrationForm />
      </section>
    </main>
  );
}
