import type { Metadata } from 'next';
import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Login | Minimal Photo Archive',
  robots: { index: false, follow: false }
};

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-[80vh] max-w-lg place-items-center px-4 py-16">
      <section className="w-full border border-black bg-white p-5 md:p-7">
        <header className="mb-8 border-b border-black pb-4 font-mono uppercase tracking-[0.12em]">
          <p className="mb-2 text-[10px] text-gray-500">EVERYDAYTHINGS / CREATOR ACCESS</p>
          <h1 className="text-[13px] text-black">LOGIN</h1>
        </header>
        <LoginForm />
      </section>
    </main>
  );
}
