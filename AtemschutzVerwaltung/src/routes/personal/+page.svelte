<script lang="ts">
  import { onMount } from 'svelte';
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

  onMount(async () => {
    loadData();
  });

  async function loadData() {
    try {
      isLoading = true;
      const res = await fetch(BASE_URL);
      if (!res.ok) throw new Error('Fehler beim Abrufen der Personaldaten.');
      personnel = await res.json();
    } catch (err: any) {
      errorMessage = err.message || 'Verbindung zum Backend fehlgeschlagen.';
    } finally {
      isLoading = false;
    }
  }

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

  function openDeleteModal(id: number, name: string) {
    personToDelete = { id, name };
    isDeleteModalOpen = true;
  }

  function closeDeleteModal() {
    personToDelete = null;
    isDeleteModalOpen = false;
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

  function openModal() {
    isModalOpen = true;
  }

  async function handleSavePerson(e: Event) {
    e.preventDefault();
    if (!newName) return;

    isSaving = true;
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          radioName: newRadioName,
          g26ValidUntil: newG26,
        }),
      });

      if (res.ok) {
        const savedPerson = await res.json();
        personnel = [...personnel, savedPerson];
        isModalOpen = false;
        newName = '';
        newRadioName = '';
        newG26 = '';
      }
    } catch (err) {
      console.error(err);
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">
        Personal & Tauglichkeit
      </h1>
    </div>
    <button
      onclick={openModal}
      class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
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
      <table class="w-full text-sm">
        <thead class="border-b border-border bg-secondary/50">
          <tr>
            <th
              class="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-xs"
              >Name / Funk</th
            >
            <th
              class="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-xs"
              >Atemschutztauglichkeit</th
            >
            <th
              class="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-xs"
              >Gültig bis</th
            >
            <th
              class="px-4 py-3 text-right font-medium text-muted-foreground uppercase tracking-wider text-xs w-16"
              >Aktionen</th
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
                    class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary uppercase"
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
              <td class="px-4 py-4 font-mono text-xs">
                <div class="flex items-center gap-3">
                  <span>{formatDate(person.g26ValidUntil)}</span>
                  <button
                    onclick={() => extendG26(person.id)}
                    class="p-1 rounded bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors cursor-pointer"
                    title="Ab heute um 5 Jahre verlängern"
                  >
                    <CalendarPlus class="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
              <td class="px-4 py-4 text-right">
                <button
                  onclick={() => openDeleteModal(person.id, person.name)}
                  class="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title="{person.name} löschen"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if isModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
  >
    <div
      class="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-150"
    >
      <div
        class="flex items-center justify-between border-b border-border pb-3 mb-4"
      >
        <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          <UserPlus class="h-5 w-5 text-primary" /> Neue Einsatzkraft
        </h2>
        <button
          onclick={() => (isModalOpen = false)}
          class="text-muted-foreground hover:text-foreground rounded-lg p-1 transition-colors hover:bg-slate-100 cursor-pointer"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form onsubmit={handleSavePerson} class="space-y-4">
        <div>
          <label
            for="name"
            class="text-xs font-semibold text-slate-500 block mb-1 uppercase"
            >Name der Person *</label
          >
          <div class="relative">
            <User
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id="name"
              type="text"
              bind:value={newName}
              placeholder="z.B. Max Mustermann"
              required
              class="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label
            for="g26"
            class="text-xs font-semibold text-slate-500 block mb-1 uppercase"
            >Atemschutztauglichkeit gültig bis</label
          >
          <input
            id="g26"
            type="date"
            bind:value={newG26}
            required
            class="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div
          class="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6"
        >
          <button
            type="button"
            onclick={() => (isModalOpen = false)}
            class="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >Abbrechen</button
          >
          <button
            type="submit"
            disabled={isSaving}
            class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
  >
    <div
      class="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center gap-3 text-destructive mb-4">
        <div class="p-2 bg-destructive/10 rounded-full">
          <Trash2 class="h-6 w-6" />
        </div>
        <h2 class="text-lg font-bold text-slate-900">Einsatzkraft löschen</h2>
      </div>

      <div class="space-y-3 mb-6">
        <p class="text-sm text-slate-600">
          Bist du sicher, dass du die Person <strong class="text-slate-900"
            >"{personToDelete.name}"</strong
          > dauerhaft aus der Datenbank entfernen möchtest?
        </p>
      </div>

      <div
        class="flex items-center justify-end gap-2 border-t border-slate-100 pt-4"
      >
        <button
          type="button"
          onclick={closeDeleteModal}
          class="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onclick={confirmDeletePerson}
          class="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 cursor-pointer"
        >
          Ja
        </button>
      </div>
    </div>
  </div>
{/if}
