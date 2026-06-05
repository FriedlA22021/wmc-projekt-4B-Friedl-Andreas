<script lang="ts">
  import { page } from '$app/state';
  import {
    Activity,
    Users,
    Package,
    Settings,
    Shield,
    Flame,
  } from 'lucide-svelte';

  const navItems = [
    {
      href: '/',
      icon: Activity,
      label: 'Live-Cockpit',
      description: 'Echtzeit-Überwachung',
    },
    {
      href: '/personal',
      icon: Users,
      label: 'Personal',
      description: 'Atemschutzträger',
    },
    {
      href: '/geraete',
      icon: Package,
      label: 'Geräte',
      description: 'Inventar & Logistik',
    },
  ];
</script>

<aside class="flex w-64 flex-col border-r border-border bg-card">
  <!-- Logo -->
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

  <!-- Navigation -->
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
