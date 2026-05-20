<script lang="ts">
  import {
    Search,
    Plus,
    Cylinder,
    Shield,
    Droplets,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Clock,
    Filter,
  } from 'lucide-svelte';

  type TabType = 'flaschen' | 'masken' | 'geraete';

  let activeTab = $state<TabType>('flaschen');

  // Flaschen (Air Cylinders)
  const flaschen = [
    {
      id: 'FL-001',
      pressure: 300,
      lastCheck: '15.03.2026',
      nextCheck: '15.03.2028',
      status: 'full' as const,
    },
    {
      id: 'FL-002',
      pressure: 280,
      lastCheck: '20.01.2026',
      nextCheck: '20.01.2028',
      status: 'full' as const,
    },
    {
      id: 'FL-003',
      pressure: 50,
      lastCheck: '10.04.2026',
      nextCheck: '10.04.2028',
      status: 'empty' as const,
    },
    {
      id: 'FL-004',
      pressure: 300,
      lastCheck: '05.02.2026',
      nextCheck: '05.02.2028',
      status: 'full' as const,
    },
    {
      id: 'FL-005',
      pressure: 0,
      lastCheck: '01.05.2024',
      nextCheck: '01.05.2026',
      status: 'maintenance' as const,
    },
    {
      id: 'FL-006',
      pressure: 150,
      lastCheck: '22.03.2026',
      nextCheck: '22.03.2028',
      status: 'partial' as const,
    },
  ];

  // Masken
  const masken = [
    {
      id: 'MA-001',
      type: 'Dräger FPS 7000',
      lastCleaning: '05.05.2026',
      assignedTo: 'Max Schmidt',
      status: 'ready' as const,
    },
    {
      id: 'MA-002',
      type: 'Dräger FPS 7000',
      lastCleaning: '05.05.2026',
      assignedTo: 'Klaus Weber',
      status: 'ready' as const,
    },
    {
      id: 'MA-003',
      type: 'Dräger FPS 7000',
      lastCleaning: '03.05.2026',
      assignedTo: 'Thomas Müller',
      status: 'ready' as const,
    },
    {
      id: 'MA-004',
      type: 'Dräger FPS 7000',
      lastCleaning: '01.05.2026',
      assignedTo: null,
      status: 'cleaning' as const,
    },
    {
      id: 'MA-005',
      type: 'MSA G1',
      lastCleaning: '28.04.2026',
      assignedTo: 'Jan Braun',
      status: 'ready' as const,
    },
    {
      id: 'MA-006',
      type: 'MSA G1',
      lastCleaning: '25.04.2026',
      assignedTo: null,
      status: 'repair' as const,
    },
  ];

  // Geräte (PA devices)
  const geraete = [
    {
      id: 'PA-001',
      type: 'Dräger PSS 7000',
      lastService: '10.01.2026',
      nextService: '10.01.2027',
      status: 'ready' as const,
    },
    {
      id: 'PA-002',
      type: 'Dräger PSS 7000',
      lastService: '15.02.2026',
      nextService: '15.02.2027',
      status: 'ready' as const,
    },
    {
      id: 'PA-003',
      type: 'Dräger PSS 5000',
      lastService: '20.03.2026',
      nextService: '20.03.2027',
      status: 'ready' as const,
    },
    {
      id: 'PA-004',
      type: 'MSA AirGo Pro',
      lastService: '01.04.2026',
      nextService: '01.04.2027',
      status: 'in-use' as const,
    },
    {
      id: 'PA-005',
      type: 'MSA AirGo Pro',
      lastService: '05.04.2026',
      nextService: '05.04.2027',
      status: 'ready' as const,
    },
    {
      id: 'PA-006',
      type: 'Dräger PSS 7000',
      lastService: '10.12.2025',
      nextService: '10.12.2026',
      status: 'service' as const,
    },
  ];

  const flaschenStatusConfig = {
    full: { color: 'text-success', bg: 'bg-success/10', label: 'Voll' },
    partial: { color: 'text-warning', bg: 'bg-warning/10', label: 'Teilweise' },
    empty: { color: 'text-muted-foreground', bg: 'bg-muted/10', label: 'Leer' },
    maintenance: {
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      label: 'Wartung',
    },
  };

  const maskenStatusConfig = {
    ready: {
      color: 'text-success',
      bg: 'bg-success/10',
      label: 'Einsatzbereit',
    },
    cleaning: {
      color: 'text-warning',
      bg: 'bg-warning/10',
      label: 'Reinigung',
    },
    repair: {
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      label: 'Reparatur',
    },
  };

  const geraeteStatusConfig = {
    ready: {
      color: 'text-success',
      bg: 'bg-success/10',
      label: 'Einsatzbereit',
    },
    'in-use': {
      color: 'text-primary',
      bg: 'bg-primary/10',
      label: 'Im Einsatz',
    },
    service: {
      color: 'text-warning',
      bg: 'bg-warning/10',
      label: 'Wartung fällig',
    },
  };

  const tabs = [
    {
      id: 'flaschen' as const,
      label: 'Atemluftflaschen',
      icon: Cylinder,
      count: flaschen.length,
    },
    {
      id: 'masken' as const,
      label: 'Masken',
      icon: Shield,
      count: masken.length,
    },
    {
      id: 'geraete' as const,
      label: 'Pressluftatmer',
      icon: Droplets,
      count: geraete.length,
    },
  ];
</script>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Geräte-Management</h1>
      <p class="text-muted-foreground">
        Inventar und Logistik für Atemschutzausrüstung
      </p>
    </div>
    <div class="flex items-center gap-2">
      <button
        class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus class="h-4 w-4" />
        Neues Gerät
      </button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex gap-2 border-b border-border">
    {#each tabs as tab}
      {@const Icon = tab.icon}
      <button
        onclick={() => (activeTab = tab.id)}
        class="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors {activeTab ===
        tab.id
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'}"
      >
        <Icon class="h-4 w-4" />
        {tab.label}
        <span class="rounded-full bg-secondary px-2 py-0.5 text-xs"
          >{tab.count}</span
        >
      </button>
    {/each}
  </div>

  <!-- Search Bar -->
  <div class="flex gap-4">
    <div class="relative flex-1">
      <Search
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        placeholder="Suche nach ID oder Typ..."
        class="h-10 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
    <button
      class="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
    >
      <Filter class="h-4 w-4" />
      Filter
    </button>
  </div>

  <!-- Content -->
  {#if activeTab === 'flaschen'}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each flaschen as flasche}
        {@const status = flaschenStatusConfig[flasche.status]}
        <div class="rounded-xl border border-border bg-card p-4">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Cylinder class="h-5 w-5 text-primary" />
              <span class="font-mono font-bold text-foreground"
                >{flasche.id}</span
              >
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-medium {status.bg} {status.color}"
            >
              {status.label}
            </span>
          </div>

          <div class="mb-4">
            <div
              class="mb-1 flex justify-between text-xs text-muted-foreground"
            >
              <span>Druck</span>
              <span>{flasche.pressure} / 300 bar</span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-secondary">
              <div
                class="h-full rounded-full transition-all {flasche.pressure >
                200
                  ? 'bg-success'
                  : flasche.pressure > 100
                    ? 'bg-warning'
                    : 'bg-destructive'}"
                style="width: {(flasche.pressure / 300) * 100}%"
              ></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-lg bg-secondary p-2">
              <p class="text-muted-foreground">Letzte Prüfung</p>
              <p class="font-medium text-foreground">{flasche.lastCheck}</p>
            </div>
            <div class="rounded-lg bg-secondary p-2">
              <p class="text-muted-foreground">Nächste Prüfung</p>
              <p class="font-medium text-foreground">{flasche.nextCheck}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else if activeTab === 'masken'}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each masken as maske}
        {@const status = maskenStatusConfig[maske.status]}
        <div class="rounded-xl border border-border bg-card p-4">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Shield class="h-5 w-5 text-primary" />
              <span class="font-mono font-bold text-foreground">{maske.id}</span
              >
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-medium {status.bg} {status.color}"
            >
              {status.label}
            </span>
          </div>

          <p class="mb-2 text-sm text-muted-foreground">{maske.type}</p>

          <div class="mb-4 flex items-center gap-2 text-sm">
            <Droplets class="h-4 w-4 text-muted-foreground" />
            <span class="text-foreground">Gereinigt: {maske.lastCleaning}</span>
          </div>

          <div class="rounded-lg bg-secondary p-2">
            <p class="text-xs text-muted-foreground">Zugewiesen an</p>
            <p class="font-medium text-foreground">
              {maske.assignedTo || '— Nicht zugewiesen —'}
            </p>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each geraete as geraet}
        {@const status = geraeteStatusConfig[geraet.status]}
        <div class="rounded-xl border border-border bg-card p-4">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Droplets class="h-5 w-5 text-primary" />
              <span class="font-mono font-bold text-foreground"
                >{geraet.id}</span
              >
            </div>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-medium {status.bg} {status.color}"
            >
              {status.label}
            </span>
          </div>

          <p class="mb-4 text-sm text-muted-foreground">{geraet.type}</p>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-lg bg-secondary p-2">
              <p class="text-muted-foreground">Letzte Wartung</p>
              <p class="font-medium text-foreground">{geraet.lastService}</p>
            </div>
            <div class="rounded-lg bg-secondary p-2">
              <p class="text-muted-foreground">Nächste Wartung</p>
              <p class="font-medium text-foreground">{geraet.nextService}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
