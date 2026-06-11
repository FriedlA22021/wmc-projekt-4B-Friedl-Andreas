<script lang="ts">
  import { useTranslator } from '$lib/shared/settings.svelte.js';
  import { Monitor, Moon, Sun, Languages, Check } from 'lucide-svelte';

  const settings = useTranslator();
</script>

<div class="max-w-3xl space-y-8 p-6">
  <div class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight text-foreground">
      {settings.t('Einstellungen').value}
    </h1>
  </div>

  <div class="border-b border-border"></div>

  <div class="grid gap-6 md:grid-cols-3">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold tracking-tight flex items-center gap-2">
        <Languages class="h-5 w-5 text-primary" />
        {settings.t('Sprache').value}
      </h2>
    </div>

    <div class="md:col-span-2 flex flex-wrap gap-3">
      <button
        type="button"
        onclick={() => settings.setLanguage('de')}
        class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all border
        {settings.lang === 'de'
          ? 'bg-primary text-primary-foreground border-transparent shadow-sm'
          : 'border-border bg-card hover:bg-secondary text-foreground'}"
      >
        Deutsch (DE)
      </button>

      <button
        type="button"
        onclick={() => settings.setLanguage('en')}
        class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all border
        {settings.lang === 'en'
          ? 'bg-primary text-primary-foreground border-transparent shadow-sm'
          : 'border-border bg-card hover:bg-secondary text-foreground'}"
      >
        English (EN)
      </button>
    </div>
  </div>
</div>
