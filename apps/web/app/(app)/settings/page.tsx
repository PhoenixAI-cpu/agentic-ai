import SettingsView from '@/components/settings/SettingsView';

export const metadata = { title: 'Settings — Antaria' };

export default function SettingsPage() {
  return (
    <SettingsView
      anthropicConfigured={!!process.env.ANTHROPIC_API_KEY}
      engineConfigured={!!process.env.ENGINE_URL}
      supabaseConfigured={!!process.env.NEXT_PUBLIC_SUPABASE_URL}
    />
  );
}
