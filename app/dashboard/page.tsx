import type { Metadata } from 'next';
import { CreatorDashboard } from '@/components/CreatorDashboard';

export const metadata: Metadata = {
  title: 'Dashboard | Minimal Photo Archive',
  robots: { index: false, follow: false }
};

export default function DashboardPage() {
  return <CreatorDashboard />;
}
