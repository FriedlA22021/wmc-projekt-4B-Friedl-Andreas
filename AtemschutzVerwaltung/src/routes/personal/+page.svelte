<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Search,
    Filter,
    UserPlus,
    TrendingUp,
    Calendar,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Loader2,
  } from 'lucide-svelte';

  interface BackendPerson {
    id: number;
    name: string;
    g26ValidUntil: string;
    lastExerciseAt: string | null;
    exerciseCount: number;
    active: boolean;
  }

  const BASE_URL = 'http://localhost:3000/api/personal';

  let personnel = $state<BackendPerson[]>([]);
  let isLoading = $state(true);
  let errorMessage = $state('');
  let searchQuery = $state('');
  let selectedStatus = $state<'all' | 'valid' | 'expiring' | 'expired'>('all');

  onMount(async () => {
    try {
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error('Fehler beim Abrufen der Personaldaten.');
      personnel = await res.json();
    } catch (err: any) {
      errorMessage = err.message || 'Verbindung zum Backend fehlgeschlagen.';
    } finally {
      isLoading = false;
    }
  });

  function getG26Status(
    validUntilStr: string,
  ): 'valid' | 'expiring' | 'expired' {
    if (!validUntilStr) return 'expired';

    const validUntil = new Date(validUntilStr);
    const now = new Date();
    const threeMonthsInMs = 3 * 30 * 24 * 60 * 60 * 1000;

    if (validUntil < now) {
      return 'expired';
    } else if (validUntil.getTime() - now.getTime() < threeMonthsInMs) {
      return 'expiring';
    }
    return 'valid';
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return 'Kein Datum';
    try {
      return new Date(dateStr).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  const filteredPersonnel = $derived(
    personnel.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const status = getG26Status(p.g26ValidUntil);
      const matchesStatus =
        selectedStatus === 'all' || status === selectedStatus;
      return matchesSearch && matchesStatus;
    }),
  );

  const validCount = $derived(
    personnel.filter((p) => getG26Status(p.g26ValidUntil) === 'valid').length,
  );
  const expiringCount = $derived(
    personnel.filter((p) => getG26Status(p.g26ValidUntil) === 'expiring')
      .length,
  );
  const expiredCount = $derived(
    personnel.filter((p) => getG26Status(p.g26ValidUntil) === 'expired').length,
  );

  const statusConfig = {
    valid: {
      icon: CheckCircle,
      color: 'green',
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

  async function handleAddPerson() {}
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">
        Personal & Tauglichkeit
      </h1>
      <p class="text-muted-foreground">
        Übersicht aller Atemschutzgeräteträger (Live-Daten)
      </p>
    </div>
    <button
      onclick={handleAddPerson}
      class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      <UserPlus class="h-4 w-4" />
      Neue Person
    </button>
  </div>

  {#if isLoading}
    <div
      class="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2"
    >
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <p>Lade Daten aus der Datenbank...</p>
    </div>
  {:else if errorMessage}
    <div
      class="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-destructive"
    >
      <p class="font-medium">Fehler bei der Datenbank-Verbindung</p>
      <p class="text-sm opacity-90">{errorMessage}</p>
    </div>
  {:else}
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
            <p class="text-sm text-muted-foreground">Gesperrt / Abgelaufen</p>
          </div>
          <XCircle class="h-8 w-8 text-destructive/50" />
        </div>
      </button>
    </div>

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
    </div>

    <div class="overflow-hidden rounded-xl border border-border bg-card">
      <table class="w-full">
        <thead class="border-b border-border bg-secondary/50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >Name</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >Atemschutztauglichkeit</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >Gültig bis</th
            >
            <th
              class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >Übungen</th
            >
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each filteredPersonnel as person (person.id)}
            {@const currentStatus = getG26Status(person.g26ValidUntil)}
            {@const statusUi = statusConfig[currentStatus]}
            {@const StatusIcon = statusUi.icon}
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
                  <div>
                    <span class="block font-medium text-foreground"
                      >{person.name}</span
                    >
                    <span class="text-xs text-muted-foreground"
                      >{person.role}</span
                    >
                  </div>
                </div>
              </td>

              <td class="px-4 py-4">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium {statusUi.bg} {statusUi.color}"
                >
                  <StatusIcon class="h-3 w-3" />
                  {statusUi.label}
                </span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-foreground"
                    >{formatDate(person.g26ValidUntil)}</span
                  >
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2 text-sm">
                  <span class="text-foreground"
                    >{person.exerciseCount} / Jahr</span
                  >
                </div>
              </td>
            </tr>
          {/each}
          {#if filteredPersonnel.length === 0}
            <tr>
              <td
                colspan="4"
                class="px-4 py-8 text-center text-sm text-muted-foreground"
              >
                Keine Einsatzkräfte gefunden.
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>
  {/if}
</div>
