<script lang="ts">
  import { useTranslator } from '$lib/shared/settings.svelte.js';

  const settings = useTranslator();
  import { page } from '$app/state';
  import {
    Activity,
    Users,
    Package,
    Settings,
    Flame,
  } from 'lucide-svelte';

  const navItems = [
    {
      href: '/',
      icon: Activity,
      label: settings.t('Startseite').value,
      description: 'Echtzeit-Überwachung',
    },
    {
      href: '/personal',
      icon: Users,
      label: settings.t('Personal').value,
      description: 'Atemschutzträger',
    },
    {
      href: '/geraete',
      icon: Package,
      label: settings.t('Geräte').value,
      description: 'Inventar & Logistik',
    },
    {
      href: '/settings',
      icon: Settings,
      label: settings.t('Einstellungen').value,
      description: 'Einstellungen',
    },
  ];
</script>

<aside class="flex w-64 flex-col border-r border-border bg-card">
  <div class="flex items-center gap-3 border-b border-border p-4">
    <div
      class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"
    >
      <Flame class="h-6 w-6 text-primary-foreground" />
    </div>
    <div>
      <h1 class="text-sm font-bold text-foreground">SafeBreath</h1>
    </div>
  </div>

  <nav class="flex-1 space-y-1 p-3">
    {#each navItems as item}
      {@const isActive = page.url.pathname === item.href}
      <a
        href={item.href}
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all {isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}"
      >
        <item.icon class="h-5 w-5" />
        <div>
          <p class="text-sm font-medium">{item.label}</p>
        </div>
      </a>
    {/each}
  </nav>
</aside>
