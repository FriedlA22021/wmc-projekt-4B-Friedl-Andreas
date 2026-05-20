<script lang="ts">
  import {
    Search,
    Filter,
    UserPlus,
    FileText,
    TrendingUp,
    Calendar,
    CheckCircle,
    AlertTriangle,
    XCircle,
  } from 'lucide-svelte';

  interface Person {
    id: number;
    name: string;
    role: string;
    g26Status: 'valid' | 'expiring' | 'expired';
    g26Date: string;
    lastExercise: string;
    exerciseCount: number;
  }

  const personnel: Person[] = [
    {
      id: 1,
      name: 'Max Schmidt',
      role: 'Gruppenführer',
      g26Status: 'valid',
      g26Date: '15.03.2027',
      lastExercise: '28.04.2026',
      exerciseCount: 12,
    },
    {
      id: 2,
      name: 'Klaus Weber',
      role: 'Maschinist',
      g26Status: 'expiring',
      g26Date: '20.06.2026',
      lastExercise: '15.04.2026',
      exerciseCount: 8,
    },
    {
      id: 3,
      name: 'Thomas Müller',
      role: 'Truppmann',
      g26Status: 'valid',
      g26Date: '10.11.2027',
      lastExercise: '02.05.2026',
      exerciseCount: 15,
    },
    {
      id: 4,
      name: 'Stefan Fischer',
      role: 'Truppführer',
      g26Status: 'expired',
      g26Date: '01.02.2026',
      lastExercise: '10.01.2026',
      exerciseCount: 6,
    },
    {
      id: 5,
      name: 'Jan Braun',
      role: 'Truppmann',
      g26Status: 'valid',
      g26Date: '22.08.2027',
      lastExercise: '05.05.2026',
      exerciseCount: 10,
    },
    {
      id: 6,
      name: 'Lukas Koch',
      role: 'Truppmann',
      g26Status: 'valid',
      g26Date: '30.09.2027',
      lastExercise: '01.05.2026',
      exerciseCount: 11,
    },
  ];

  let searchQuery = $state('');
  let selectedStatus = $state<'all' | 'valid' | 'expiring' | 'expired'>('all');

  const filteredPersonnel = $derived(
    personnel.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === 'all' || p.g26Status === selectedStatus;
      return matchesSearch && matchesStatus;
    }),
  );

  const statusConfig = {
    valid: {
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-success/10',
      label: 'Gültig',
    },
    expiring: {
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/10',
      label: 'Läuft ab',
    },
    expired: {
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      label: 'Abgelaufen',
    },
  };

  const validCount = personnel.filter((p) => p.g26Status === 'valid').length;
  const expiringCount = personnel.filter(
    (p) => p.g26Status === 'expiring',
  ).length;
  const expiredCount = personnel.filter(
    (p) => p.g26Status === 'expired',
  ).length;
</script>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">
        Personal & Tauglichkeit
      </h1>
      <p class="text-muted-foreground">
        Übersicht aller Atemschutzgeräteträger
      </p>
    </div>
    <button
      class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <UserPlus class="h-4 w-4" />
      Neue Person
    </button>
  </div>

  <!-- Status Overview Cards -->
  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
    <button
      onclick={() =>
        (selectedStatus = selectedStatus === 'valid' ? 'all' : 'valid')}
      class="rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-success {selectedStatus ===
      'valid'
        ? 'border-success ring-1 ring-success'
        : ''}"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-3xl font-bold text-success">{validCount}</p>
          <p class="text-sm text-muted-foreground">Gültige G26.3</p>
        </div>
        <CheckCircle class="h-8 w-8 text-success/50" />
      </div>
    </button>

    <button
      onclick={() =>
        (selectedStatus = selectedStatus === 'expiring' ? 'all' : 'expiring')}
      class="rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-warning {selectedStatus ===
      'expiring'
        ? 'border-warning ring-1 ring-warning'
        : ''}"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-3xl font-bold text-warning">{expiringCount}</p>
          <p class="text-sm text-muted-foreground">Läuft bald ab</p>
        </div>
        <AlertTriangle class="h-8 w-8 text-warning/50" />
      </div>
    </button>

    <button
      onclick={() =>
        (selectedStatus = selectedStatus === 'expired' ? 'all' : 'expired')}
      class="rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-destructive {selectedStatus ===
      'expired'
        ? 'border-destructive ring-1 ring-destructive'
        : ''}"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-3xl font-bold text-destructive">{expiredCount}</p>
          <p class="text-sm text-muted-foreground">Gesperrt</p>
        </div>
        <XCircle class="h-8 w-8 text-destructive/50" />
      </div>
    </button>
  </div>

  <!-- Search & Filter -->
  <div class="flex flex-col gap-4 sm:flex-row">
    <div class="relative flex-1">
      <Search
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        placeholder="Suche nach Name..."
        bind:value={searchQuery}
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

  <!-- Personnel Table -->
  <div class="overflow-hidden rounded-xl border border-border bg-card">
    <table class="w-full">
      <thead class="border-b border-border bg-secondary/50">
        <tr>
          <th
            class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Name
          </th>

          <th
            class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Atemschutztauglichkeit
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Gültig bis
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Übungen
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        {#each filteredPersonnel as person (person.id)}
          {@const status = statusConfig[person.g26Status]}
          {@const StatusIcon = status.icon}
          <tr class="transition-colors hover:bg-secondary/30">
            <td class="px-4 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
                >
                  {person.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <span class="font-medium text-foreground">{person.name}</span>
              </div>
            </td>

            <td class="px-4 py-4">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium {status.bg} {status.color}"
              >
                <StatusIcon class="h-3 w-3" />
                {status.label}
              </span>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-2 text-sm">
                <Calendar class="h-4 w-4 text-muted-foreground" />
                <span class="text-foreground">{person.g26Date}</span>
              </div>
            </td>
            <td class="px-4 py-4">
              <div class="flex items-center gap-2 text-sm">
                <TrendingUp class="h-4 w-4 text-muted-foreground" />
                <span class="text-foreground"
                  >{person.exerciseCount} / Jahr</span
                >
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
