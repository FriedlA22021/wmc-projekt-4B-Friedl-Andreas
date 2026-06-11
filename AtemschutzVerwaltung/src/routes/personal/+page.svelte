<script lang="ts">
  import { onMount } from 'svelte';
  import { useTranslator } from '$lib/shared/settings.svelte.js';

  const settings = useTranslator();
  import {
    Search,
    UserPlus,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Loader2,
    X,
    User,
    Trash2,
    CalendarPlus,
  } from 'lucide-svelte';

  interface BackendPerson {
    id: number;
    name: string;
    radioName: string;
    g26ValidUntil: string;
    lastExerciseAt: string | null;
    exerciseCount: number;
    active: boolean;
  }

  const BASE_URL = 'http://localhost:3000/api/personal';

  // --- States ---
  let personnel = $state<BackendPerson[]>([]);
  let isLoading = $state(true);
  let isSaving = $state(false);
  let errorMessage = $state('');
  let searchQuery = $state('');
  let selectedStatus = $state<'all' | 'valid' | 'expiring' | 'expired'>('all');

  let isModalOpen = $state(false);
  let newName = $state('');
  let newRadioName = $state('');
  let newG26 = $state('');

  let isDeleteModalOpen = $state(false);
  let personToDelete = $state<{ id: number; name: string } | null>(null);

  // --- Lifecycle ---
  onMount(() => {
    loadData();
  });

  // --- API Functions ---
  async function loadData() {
    try {
      isLoading = true;
      errorMessage = '';
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error('Fehler beim Abrufen der Personaldaten.');
      personnel = await res.json();
    } catch (err: any) {
      errorMessage = err.message || 'Verbindung zum Backend fehlgeschlagen.';
    } finally {
      isLoading = false;
    }
  }

  async function handleSavePerson(e: Event) {
    e.preventDefault();
    if (!newName.trim()) return;

    isSaving = true;
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          radioName: newRadioName.trim(),
          g26ValidUntil: newG26,
        }),
      });

      if (res.ok) {
        const savedPerson = await res.json();
        personnel = [...personnel, savedPerson];
        closeAddModal();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Fehler beim Speichern der Person.');
      }
    } catch (err) {
      console.error(err);
      alert('Verbindung zum Server fehlgeschlagen.');
    } finally {
      isSaving = false;
    }
  }

  async function extendG26(id: number) {
    const person = personnel.find((p) => p.id === id);
    if (!person) return;

    const newDate = new Date();
    newDate.setFullYear(newDate.getFullYear() + 5);
    const formattedIsoDate = newDate.toISOString().split('T')[0];

    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ g26ValidUntil: formattedIsoDate }),
      });

      if (res.ok) {
        const updatedPerson = await res.json();
        personnel = personnel.map((p) => (p.id === id ? updatedPerson : p));
      } else {
        alert('Fehler beim Aktualisieren der Tauglichkeit.');
      }
    } catch (err) {
      console.error(err);
      alert('Verbindung zum Server fehlgeschlagen.');
    }
  }

  async function confirmDeletePerson() {
    if (!personToDelete) return;

    try {
      const res = await fetch(`${BASE_URL}/${personToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        personnel = personnel.filter((p) => p.id !== personToDelete!.id);
        closeDeleteModal();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Fehler beim Löschen im Backend.');
      }
    } catch (err) {
      console.error(err);
      alert('Verbindung zum Server fehlgeschlagen.');
    }
  }

  // --- Helper Functions ---
  function getG26Status(
    validUntilStr: string,
  ): 'valid' | 'expiring' | 'expired' {
    if (!validUntilStr) return 'expired';
    const validUntil = new Date(validUntilStr);
    const now = new Date();
    const threeMonthsInMs = 3 * 30 * 24 * 60 * 60 * 1000;

    if (validUntil < now) return 'expired';
    if (validUntil.getTime() - now.getTime() < threeMonthsInMs)
      return 'expiring';
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

  function getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0].toUpperCase())
      .slice(0, 3)
      .join('');
  }

  // --- Modal Handlers ---
  function openAddModal() {
    isModalOpen = true;
  }

  function closeAddModal() {
    isModalOpen = false;
    newName = '';
    newRadioName = '';
    newG26 = '';
  }

  function openDeleteModal(id: number, name: string) {
    personToDelete = { id, name };
    isDeleteModalOpen = true;
  }

  function closeDeleteModal() {
    personToDelete = null;
    isDeleteModalOpen = false;
  }

  // --- Derived States (Svelte 5) ---
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

  // --- Configs ---
  const statusConfig = {
    valid: {
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-success/10 border-success/20',
      label: 'Gültig',
    },
    expiring: {
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/10 border-warning/20',
      label: 'Läuft ab',
    },
    expired: {
      icon: XCircle,
      color: 'text-destructive',
      bg: 'bg-destructive/10 border-destructive/20',
      label: 'Abgelaufen',
    },
  };
</script>

<div class="space-y-6">
  <div
    class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-foreground">
        Personal & Tauglichkeit
      </h1>
    </div>
    <button
      onclick={openAddModal}
      class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
    >
      <UserPlus class="h-4 w-4" />
      Neue Person
    </button>
  </div>

  {#if isLoading}
    <div
      class="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3"
    >
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <p class="text-sm font-medium">Lade Daten aus der Datenbank...</p>
    </div>
  {:else if errorMessage}
    <div
      class="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive flex gap-3 items-start"
    >
      <AlertTriangle class="h-5 w-5 shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-sm">Fehler bei der Datenbank-Verbindung</p>
        <p class="text-xs opacity-90 mt-0.5">{errorMessage}</p>
      </div>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <button
        onclick={() =>
          (selectedStatus = selectedStatus === 'valid' ? 'all' : 'valid')}
        class="rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-success/50 hover:shadow-sm {selectedStatus ===
        'valid'
          ? 'border-success ring-2 ring-success/20 bg-success/5'
          : ''}"
      >
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p
              class="text-sm font-medium text-muted-foreground tracking-wide uppercase"
            >
              Gültige G26.3
            </p>
            <p class="text-3xl font-bold text-success tracking-tight">
              {validCount}
            </p>
          </div>
          <div class="p-2 rounded-lg bg-success/10 text-success">
            <CheckCircle class="h-6 w-6" />
          </div>
        </div>
      </button>

      <button
        onclick={() =>
          (selectedStatus = selectedStatus === 'expiring' ? 'all' : 'expiring')}
        class="rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-warning/50 hover:shadow-sm {selectedStatus ===
        'expiring'
          ? 'border-warning ring-2 ring-warning/20 bg-warning/5'
          : ''}"
      >
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p
              class="text-sm font-medium text-muted-foreground tracking-wide uppercase"
            >
              Läuft bald ab
            </p>
            <p class="text-3xl font-bold text-warning tracking-tight">
              {expiringCount}
            </p>
          </div>
          <div class="p-2 rounded-lg bg-warning/10 text-warning">
            <AlertTriangle class="h-6 w-6" />
          </div>
        </div>
      </button>

      <button
        onclick={() =>
          (selectedStatus = selectedStatus === 'expired' ? 'all' : 'expired')}
        class="rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-destructive/50 hover:shadow-sm {selectedStatus ===
        'expired'
          ? 'border-destructive ring-2 ring-destructive/20 bg-destructive/5'
          : ''}"
      >
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p
              class="text-sm font-medium text-muted-foreground tracking-wide uppercase"
            >
              Gesperrt / Abgelaufen
            </p>
            <p class="text-3xl font-bold text-destructive tracking-tight">
              {expiredCount}
            </p>
          </div>
          <div class="p-2 rounded-lg bg-destructive/10 text-destructive">
            <XCircle class="h-6 w-6" />
          </div>
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
          class="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>

    <div
      class="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left border-collapse">
          <thead>
            <tr class="border-b border-border bg-muted/40">
              <th
                class="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs"
              >
                {settings.t('Name').value}
              </th>
              <th
                class="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs"
              >
                {settings.t('Atemschutztauglichkeit').value}
              </th>
              <th
                class="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs"
              >
                {settings.t('Gültig bis').value}
              </th>
              <th
                class="px-5 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs text-right w-20"
              >
                {settings.t('Aktionen').value}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            {#each filteredPersonnel as { id, name, g26ValidUntil } (id)}
              {@const currentStatus = getG26Status(g26ValidUntil)}
              {@const statusUi = statusConfig[currentStatus]}
              {@const StatusIcon = statusUi.icon}
              <tr class="transition-colors hover:bg-muted/30">
                <td class="px-5 py-3.5 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary uppercase border border-primary/10"
                    >
                      {getInitials(name)}
                    </div>
                    <span class="font-medium text-foreground">{name}</span>
                  </div>
                </td>
                <td class="px-5 py-3.5 whitespace-nowrap">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium tracking-wide {statusUi.bg} {statusUi.color}"
                  >
                    <StatusIcon class="h-3.5 w-3.5" />
                    {statusUi.label}
                  </span>
                </td>
                <td
                  class="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-foreground/80"
                >
                  <div class="flex items-center gap-2.5">
                    <span>{formatDate(g26ValidUntil)}</span>
                    <button
                      onclick={() => extendG26(id)}
                      class="p-1 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors cursor-pointer border border-border/40 shadow-sm"
                      title="Ab heute um 5 Jahre verlängern"
                    >
                      <CalendarPlus class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
                <td class="px-5 py-3.5 whitespace-nowrap text-right">
                  <button
                    onclick={() => openDeleteModal(id, name)}
                    class="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="{name} löschen"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            {/each}
            {#if filteredPersonnel.length === 0}
              <tr>
                <td
                  colspan="4"
                  class="px-5 py-10 text-center text-muted-foreground"
                >
                  Keine Personen gefunden, die den Filtern entsprechen.
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

{#if isModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-white p-4 animate-in fade-in duration-200"
  >
    <div
      class="w-full max-w-md rounded-xl border border-border bg-popover p-6 shadow-xl animate-in zoom-in-95 duration-200 text-popover-foreground"
    >
      <div
        class="flex items-center justify-between border-b border-border pb-3 mb-5"
      >
        <h2 class="text-lg font-bold tracking-tight flex items-center gap-2">
          <UserPlus class="h-5 w-5 text-primary" /> Neue Einsatzkraft
        </h2>
        <button
          onclick={closeAddModal}
          class="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors hover:bg-muted cursor-pointer"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form onsubmit={handleSavePerson} class="space-y-4">
        <div class="space-y-1.5">
          <label
            for="name"
            class="text-xs font-semibold text-muted-foreground tracking-wide uppercase"
          >
            Name der Person *
          </label>
          <div class="relative">
            <User
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="name"
              type="text"
              bind:value={newName}
              placeholder="z.B. Max Mustermann"
              required
              class="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm text-foreground transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label
            for="g26"
            class="text-xs font-semibold text-muted-foreground tracking-wide uppercase"
          >
            Atemschutztauglichkeit gültig bis
          </label>
          <input
            id="g26"
            type="date"
            bind:value={newG26}
            required
            class="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div
          class="flex items-center justify-end gap-2 border-t border-border pt-4 mt-6"
        >
          <button
            type="button"
            onclick={closeAddModal}
            class="rounded-lg bg-muted border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={isSaving}
            class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Speichere...' : 'Person speichern'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if isDeleteModalOpen && personToDelete}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
  >
    <div
      class="w-full max-w-md rounded-xl border border-border bg-popover p-6 shadow-xl animate-in zoom-in-95 duration-200 text-popover-foreground"
    >
      <div class="flex items-center gap-3 text-destructive mb-4">
        <div
          class="p-2 bg-destructive/10 rounded-full border border-destructive/10"
        >
          <Trash2 class="h-5 w-5" />
        </div>
        <h2 class="text-lg font-bold tracking-tight">Einsatzkraft löschen</h2>
      </div>

      <div class="space-y-2 mb-6">
        <p class="text-sm text-muted-foreground leading-relaxed">
          Bist du sicher, dass du die Person <strong class="text-foreground"
            >"{personToDelete.name}"</strong
          > dauerhaft aus der Datenbank entfernen möchtest?
        </p>
      </div>

      <div
        class="flex items-center justify-end gap-2 border-t border-border pt-4"
      >
        <button
          type="button"
          onclick={closeDeleteModal}
          class="rounded-lg bg-muted border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onclick={confirmDeletePerson}
          class="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 cursor-pointer"
        >
          Ja, löschen
        </button>
      </div>
    </div>
  </div>
{/if}
