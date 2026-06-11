<script lang="ts">
  import { Bell, Globe, User } from 'lucide-svelte';

  let currentTime = $state(new Date());
  let language = $state<'de' | 'en'>('de');

  $effect(() => {
    const interval = setInterval(() => {
      currentTime = new Date();
    }, 1000);
    return () => clearInterval(interval);
  });

  function formatTime(date: Date) {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
</script>

<header
  class="flex h-16 items-center justify-between border-b border-border bg-card px-6"
>
  <div class="flex items-center gap-4">
    <div class="font-mono text-2xl font-bold text-primary tabular-nums">
      {formatTime(currentTime)}
    </div>
    <div class="text-sm text-muted-foreground">
      {formatDate(currentTime)}
    </div>
  </div>

  <div class="flex items-center gap-2">
    <button
      class="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-foreground transition-colors hover:bg-muted"
    >
      <User class="h-4 w-4" />
      <span class="text-sm">Atemschutzwart</span>
    </button>
  </div>
</header>
