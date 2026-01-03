'use client';

import dynamic from 'next/dynamic';

const VoiceChat = dynamic(() => import('@/app/components/VoiceChat'), {
  ssr: false,
  loading: () => (
    <div className="flex h-32 w-32 items-center justify-center">
      <div className="text-zinc-500">Loading...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col items-center justify-center gap-8 px-8 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Coffee Shop AI Assistant
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Talk to our AI assistant to order coffee
          </p>
        </div>

        <div className="mt-8">
          <VoiceChat />
        </div>
      </main>
    </div>
  );
}
