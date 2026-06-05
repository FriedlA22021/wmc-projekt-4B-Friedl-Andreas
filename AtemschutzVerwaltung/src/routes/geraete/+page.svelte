<script lang="ts">
  import { onMount } from 'svelte';
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
    CalendarCheck,
    Wrench,
    Sparkles,
    X,
  } from 'lucide-svelte';

  type TabType = 'flaschen' | 'masken' | 'geraete';

  let activeTab = $state<TabType>('flaschen');
  let searchQuery = $state('');

  let allEquipment = $state<any[]>([]);
  let isLoading = $state(true);

  // --- State für das "Neues Gerät"-Modal ---
  let isModalOpen = $state(false);
  let newDeviceCategory = $state<'cylinder' | 'mask' | 'breathing_apparatus'>(
    'cylinder',
  );
  let newDeviceInventoryNumber = $state('');
  let newDeviceType = $state('');
  let newDevicePressure = $state<number | null>(300);
  let newDeviceStatus = $state('ready');

  // Daten vom Backend laden
  async function loadData() {
    try {
      const res = await fetch('http://localhost:3000/api/gerate');
      if (res.ok) allEquipment = await res.json();
    } catch (error) {
      console.error('Fehler beim Laden:', error);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadData();
  });

  // Hilfsfunktion: Schickt die Updates an das Express-Backend (PUT)
  async function updateEquipment(id: number, updatedFields: object) {
    try {
      const res = await fetch(`http://localhost:3000/api/gerate/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const updatedItem = await res.json();
        allEquipment = allEquipment.map((e) => (e.id === id ? updatedItem : e));
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Geräts:', error);
    }
  }

  // Neues Gerät an das Backend senden (POST)
  async function handleCreateDevice(e: Event) {
    e.preventDefault();
    if (!newDeviceInventoryNumber.trim()) {
      alert('Bitte eine Inventarnummer eingeben.');
      return;
    }

    const payload = {
      inventoryNumber: newDeviceInventoryNumber,
      category: newDeviceCategory,
      type: newDeviceType,
      pressure: newDeviceCategory === 'cylinder' ? newDevicePressure : null,
      status: newDeviceStatus,
    };

    try {
      const res = await fetch('http://localhost:3000/api/gerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const createdItem = await res.json();
        allEquipment = [...allEquipment, createdItem];

        // Modal zurücksetzen und schließen
        isModalOpen = false;
        newDeviceInventoryNumber = '';
        newDeviceType = '';
        newDevicePressure = 300;
        newDeviceStatus = 'ready';

        // Tab automatisch wechseln, um das neue Gerät zu sehen
        if (newDeviceCategory === 'cylinder') activeTab = 'flaschen';
        if (newDeviceCategory === 'mask') activeTab = 'masken';
        if (newDeviceCategory === 'breathing_apparatus') activeTab = 'geraete';
      } else {
        const errData = await res.json();
        alert(`Fehler: ${errData.error}`);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Geräts:', error);
    }
  }

  // Hilfsfunktion für das heutige Datum im Format YYYY-MM-DD
  function getTodayString(offsetYears = 0): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + offsetYears);
    return d.toISOString().split('T')[0];
  }

  // Hilfsfunktion zur Anzeige (YYYY-MM-DD -> DD.MM.YYYY)
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  // --- Spezifische Button-Aktionen ---
  function toggleFlascheStatus(flasche: any) {
    const nextStatus = flasche.status === 'full' ? 'empty' : 'full';
    const nextPressure = nextStatus === 'full' ? 300 : 0;
    updateEquipment(flasche.id, { status: nextStatus, pressure: nextPressure });
  }

  function handleFlaschePruefung(id: number) {
    updateEquipment(id, {
      lastCheck: getTodayString(),
      nextCheck: getTodayString(5),
    });
  }

  function toggleMaskeStatus(maske: any) {
    const nextStatus = maske.status === 'ready' ? 'repair' : 'ready';
    updateEquipment(maske.id, { status: nextStatus });
  }

  function handleMaskeReinigung(id: number) {
    updateEquipment(id, { lastCleaning: getTodayString() });
  }

  function toggleGeraetStatus(geraet: any) {
    const nextStatus = geraet.status === 'ready' ? 'service' : 'ready';
    updateEquipment(geraet.id, { status: nextStatus });
  }

  function handleGeraetWartung(id: number) {
    updateEquipment(id, {
      lastService: getTodayString(),
      nextService: getTodayString(1),
    });
  }

  // --- Filterung ($derived) ---
  const filteredFlaschen = $derived(
    allEquipment.filter(
      (e) =>
        e.category === 'cylinder' &&
        (e.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.type.toLowerCase().includes(searchQuery.toLowerCase())),
    ),
  );
  const filteredMasken = $derived(
    allEquipment.filter(
      (e) =>
        e.category === 'mask' &&
        (e.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.type.toLowerCase().includes(searchQuery.toLowerCase())),
    ),
  );
  const filteredGeraete = $derived(
    allEquipment.filter(
      (e) =>
        e.category === 'breathing_apparatus' &&
        (e.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.type.toLowerCase().includes(searchQuery.toLowerCase())),
    ),
  );

  const tabs = $derived([
    {
      id: 'flaschen' as const,
      label: 'Atemluftflaschen',
      icon: Cylinder,
      count: allEquipment.filter((e) => e.category === 'cylinder').length,
    },
    {
      id: 'masken' as const,
      label: 'Masken',
      icon: Shield,
      count: allEquipment.filter((e) => e.category === 'mask').length,
    },
    {
      id: 'geraete' as const,
      label: 'Pressluftatmer',
      icon: Droplets,
      count: allEquipment.filter((e) => e.category === 'breathing_apparatus')
        .length,
    },
  ]);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Geräte-Management</h1>
    </div>
    <div class="flex items-center gap-2">
      <button
        onclick={() => (isModalOpen = true)}
        class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
      >
        + Neues Gerät
      </button>
    </div>
  </div>

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

  <div class="flex gap-4">
    <div class="relative flex-1">
      <Search
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Suche nach Inventarnummer..."
        class="h-10 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  </div>

  {#if isLoading}
    <div class="flex h-32 items-center justify-center text-muted-foreground">
      <p>Lade Gerätedaten aus dem Backend...</p>
    </div>
  {:else if activeTab === 'flaschen'}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredFlaschen as flasche}
        <div
          class="rounded-xl border border-border bg-card p-4 flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Cylinder class="h-5 w-5 text-primary" />
                <span class="font-mono font-bold text-foreground"
                  >{flasche.inventoryNumber}</span
                >
              </div>
              <button
                onclick={() => toggleFlascheStatus(flasche)}
                class="rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-transform active:scale-95 {flasche.status ===
                  'full' || flasche.status === 'ready'
                  ? 'bg-success/10 text-success border border-success/20'
                  : 'bg-muted text-muted-foreground border border-transparent'}"
              >
                {flasche.status === 'full' || flasche.status === 'ready'
                  ? '🟢 Einsatzbereit'
                  : '🔴 Außer Dienst'}
              </button>
            </div>

            <div class="mb-4">
              <div
                class="mb-1 flex justify-between text-xs text-muted-foreground"
              >
                <span>Druck</span>
                <span>{flasche.pressure ?? 0} / 300 bar</span>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-secondary">
                <div
                  class="h-full rounded-full transition-all {(flasche.pressure ??
                    0) > 200
                    ? 'bg-success'
                    : (flasche.pressure ?? 0) > 100
                      ? 'bg-warning'
                      : 'bg-destructive'}"
                  style="width: {((flasche.pressure ?? 0) / 300) * 100}%"
                ></div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs mb-4">
              <div class="rounded-lg bg-secondary p-2">
                <p class="text-muted-foreground">Letzte Prüfung</p>
                <p class="font-medium text-foreground">
                  {formatDate(flasche.lastCheck)}
                </p>
              </div>
              <div class="rounded-lg bg-secondary p-2">
                <p class="text-muted-foreground">Nächste Prüfung</p>
                <p class="font-medium text-foreground">
                  {formatDate(flasche.nextCheck)}
                </p>
              </div>
            </div>
          </div>

          <button
            onclick={() => handleFlaschePruefung(flasche.id)}
            class="w-full flex items-center justify-center gap-2 rounded-lg bg-secondary border border-border py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <CalendarCheck class="h-3.5 w-3.5 text-success" />
            Prüfung durchgeführt (5 J.)
          </button>
        </div>
      {/each}
    </div>
  {:else if activeTab === 'masken'}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredMasken as maske}
        <div
          class="rounded-xl border border-border bg-card p-4 flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Shield class="h-5 w-5 text-primary" />
                <span class="font-mono font-bold text-foreground"
                  >{maske.inventoryNumber}</span
                >
              </div>
              <button
                onclick={() => toggleMaskeStatus(maske)}
                class="rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-transform active:scale-95 {maske.status ===
                'ready'
                  ? 'bg-success/10 text-success border border-success/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'}"
              >
                {maske.status === 'ready'
                  ? '🟢 Einsatzbereit'
                  : '🔴 Außer Dienst'}
              </button>
            </div>

            <p class="mb-4 text-sm text-muted-foreground">
              {maske.type || 'Standardmaske'}
            </p>

            <div
              class="mb-4 flex items-center gap-2 text-sm bg-secondary p-2 rounded-lg"
            >
              <Droplets class="h-4 w-4 text-primary" />
              <span class="text-foreground text-xs"
                >Gereinigt am: <strong class="text-foreground"
                  >{formatDate(maske.lastCleaning)}</strong
                ></span
              >
            </div>
          </div>

          <button
            onclick={() => handleMaskeReinigung(maske.id)}
            class="w-full flex items-center justify-center gap-2 rounded-lg bg-secondary border border-border py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Sparkles class="h-3.5 w-3.5 text-primary" />
            Neu gereinigt
          </button>
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredGeraete as geraet}
        <div
          class="rounded-xl border border-border bg-card p-4 flex flex-col justify-between min-h-[220px]"
        >
          <div>
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Droplets class="h-5 w-5 text-primary" />
                <span class="font-mono font-bold text-foreground"
                  >{geraet.inventoryNumber}</span
                >
              </div>
              <button
                onclick={() => toggleGeraetStatus(geraet)}
                class="rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-transform active:scale-95 {geraet.status ===
                'ready'
                  ? 'bg-success/10 text-success border border-success/20'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'}"
              >
                {geraet.status === 'ready'
                  ? '🟢 Einsatzbereit'
                  : '🔴 Außer Dienst'}
              </button>
            </div>

            <p class="mb-4 text-sm text-muted-foreground">
              {geraet.type || 'Pressluftatmer'}
            </p>

            <div class="grid grid-cols-2 gap-2 text-xs mb-4">
              <div class="rounded-lg bg-secondary p-2">
                <p class="text-muted-foreground">Letzte Wartung</p>
                <p class="font-medium text-foreground">
                  {formatDate(geraet.lastService)}
                </p>
              </div>
              <div class="rounded-lg bg-secondary p-2">
                <p class="text-muted-foreground">Nächste Wartung</p>
                <p class="font-medium text-foreground">
                  {formatDate(geraet.nextService)}
                </p>
              </div>
            </div>
          </div>

          <button
            onclick={() => handleGeraetWartung(geraet.id)}
            class="w-full flex items-center justify-center gap-2 rounded-lg bg-secondary border border-border py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Wrench class="h-3.5 w-3.5 text-warning" />
            Jetzt gewartet (1 J.)
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if isModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
  >
    <div
      class="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-150"
    >
      <div
        class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4"
      >
        <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
          Neues Gerät erfassen
        </h2>
        <button
          onclick={() => (isModalOpen = false)}
          class="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors hover:bg-slate-100 cursor-pointer"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <form onsubmit={handleCreateDevice} class="space-y-4">
        <div>
          <label
            class="text-[10px] font-bold text-slate-500 block mb-2 uppercase tracking-wider"
            >Gerätetyp wählen</label
          >
          <div class="grid grid-cols-3 gap-2">
            <label
              class="flex flex-col items-center gap-2 p-3 rounded-lg border text-center cursor-pointer transition-all text-xs font-semibold {newDeviceCategory ===
              'cylinder'
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500'}"
            >
              <input
                type="radio"
                name="category"
                value="cylinder"
                bind:group={newDeviceCategory}
                class="sr-only"
              />
              <Cylinder class="h-5 w-5" />
              Flasche
            </label>
            <label
              class="flex flex-col items-center gap-2 p-3 rounded-lg border text-center cursor-pointer transition-all text-xs font-semibold {newDeviceCategory ===
              'mask'
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500'}"
            >
              <input
                type="radio"
                name="category"
                value="mask"
                bind:group={newDeviceCategory}
                class="sr-only"
              />
              <Shield class="h-5 w-5" />
              Maske
            </label>
            <label
              class="flex flex-col items-center gap-2 p-3 rounded-lg border text-center cursor-pointer transition-all text-xs font-semibold {newDeviceCategory ===
              'breathing_apparatus'
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500'}"
            >
              <input
                type="radio"
                name="category"
                value="breathing_apparatus"
                bind:group={newDeviceCategory}
                class="sr-only"
              />
              <Droplets class="h-5 w-5" />
              PA-Gerät
            </label>
          </div>
        </div>

        <div>
          <label
            for="invNum"
            class="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider"
            >Inventarnummer *</label
          >
          <input
            id="invNum"
            type="text"
            bind:value={newDeviceInventoryNumber}
            placeholder="z.B. AS-FL-2024"
            required
            class="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div>
          <label
            for="devType"
            class="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider"
            >Typ / Modell</label
          >
          <input
            id="devType"
            type="text"
            bind:value={newDeviceType}
            placeholder={newDeviceCategory === 'cylinder'
              ? 'z.B. 6L Stahl'
              : newDeviceCategory === 'mask'
                ? 'z.B. FPS 7000'
                : 'z.B. PSS 4000'}
            class="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {#if newDeviceCategory === 'cylinder'}
          <div class="animate-in slide-in-from-top-2 duration-200">
            <label
              for="pressure"
              class="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider"
              >Fülldruck (Bar)</label
            >
            <input
              id="pressure"
              type="number"
              min="0"
              max="350"
              bind:value={newDevicePressure}
              class="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        {/if}

        <div>
          <label
            for="status"
            class="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider"
            >Zustand</label
          >
          <select
            id="status"
            bind:value={newDeviceStatus}
            class="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="ready">🟢 Einsatzbereit</option>
            <option value="service">🔴 Außer Dienst</option>
          </select>
        </div>

        <div
          class="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-6"
        >
          <button
            type="button"
            onclick={() => (isModalOpen = false)}
            class="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-95 cursor-pointer"
          >
            Gerät speichern
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
