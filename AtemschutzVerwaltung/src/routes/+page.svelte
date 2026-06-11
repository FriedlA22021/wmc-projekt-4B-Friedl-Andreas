<script lang="ts">
    import TruppCard from '$lib/components/TruppCard.svelte';
    import { useTranslator } from '$lib/shared/settings.svelte.js';
    import {
        Users,
        Timer,
        Gauge,
        AlertTriangle,
        Plus,
        Check,
        X,
    } from 'lucide-svelte';
    import { onMount } from 'svelte';

    const settings = useTranslator();

    interface Trupp {
        id: number;
        name: string;
        members: string[];
        startPressure: number;
        currentPressure: number;
        startTime: number;
        lastCheckTime: number;
        status: 'active' | 'warning' | 'reserve';
    }

    interface BackendPerson {
        id: number;
        name: string;
        radioName: string;
        g26ValidUntil: string;
        active: boolean;
    }

    const CHECK_INTERVAL = 5 * 60 * 1000;
    const TRUPPS_URL = 'http://localhost:3000/api/live/trupps';
    const PERSONAL_URL = 'http://localhost:3000/api/personal';
    const WS_URL = 'ws://localhost:3000/live';

    // Svelte 5 Runes für State
    let trupps = $state<Trupp[]>([]);
    let backendPersonnel = $state<BackendPerson[]>([]);

    let showForm = $state(false);
    let selectedIdForPressure = $state<number | null>(null);
    let tempPressureInput = $state<number>(300);

    let traeger1 = $state('');
    let traeger2 = $state('');
    let traeger3 = $state('');
    let newStartPressure = $state(300);
    let formError = $state('');

    let socket: WebSocket | null = null;

    // WebSocket Connect mit Auto-Reconnect
    function connectWebSocket() {
        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            console.log('WebSocket-Verbindung erfolgreich aufgebaut.');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'TRUPPS_UPDATE' && data.payload) {
                    trupps = data.payload;
                } else if (Array.isArray(data)) {
                    trupps = data;
                }
            } catch (err) {
                console.error(
                    'Fehler beim Verarbeiten der WebSocket-Nachricht:',
                    err,
                );
            }
        };

        socket.onclose = () => {
            console.warn('WebSocket geschlossen. Reconnect in 5s...');
            setTimeout(() => {
                connectWebSocket();
            }, 5000);
        };

        socket.onerror = (error) => {
            console.error('WebSocket-Fehler:', error);
            socket?.close();
        };
    }

    onMount(() => {
        loadData();
        connectWebSocket();

        // Intervall für die Überfällig-Warnung (Lokaler Check alle 5 Sek)
        const interval = setInterval(() => {
            const now = Date.now();
            trupps.forEach((trupp) => {
                if (
                    now - trupp.lastCheckTime > CHECK_INTERVAL &&
                    trupp.status === 'active'
                ) {
                    trupp.status = 'warning';
                }
            });
        }, 5000);

        return () => {
            clearInterval(interval);
            if (socket) socket.close();
        };
    });

    async function loadData() {
        try {
            const resPers = await fetch(PERSONAL_URL);
            if (resPers.ok) {
                backendPersonnel = await resPers.json();
            }

            const resTrupps = await fetch(TRUPPS_URL);
            if (resTrupps.ok) {
                trupps = await resTrupps.json();
            }
        } catch (err) {
            console.error('Fehler beim Laden der Live-Daten:', err);
        }
    }

    // Berechnete Werte via $derived Rune
    let verfuegbareTraeger = $derived(
        (() => {
            const now = new Date();
            const besetztePersonen = trupps.flatMap((t) => t.members);

            return backendPersonnel
                .filter((p) => {
                    if (!p.g26ValidUntil) return false;
                    const validDate = new Date(p.g26ValidUntil);
                    if (validDate < now) return false;
                    if (besetztePersonen.includes(p.name)) return false;
                    if (!p.active) return false;
                    return true;
                })
                .map((p) => p.name);
        })(),
    );

    let activeTruppCount = $derived(trupps.length);
    let warningCount = $derived(
        trupps.filter((t) => t.status === 'warning').length,
    );
    let nextTruppId = $derived(
        trupps.length > 0 ? Math.max(...trupps.map((t) => t.id)) + 1 : 1,
    );

    function handleCardClick(id: number, currentPressure: number) {
        if (selectedIdForPressure === id) {
            selectedIdForPressure = null;
        } else {
            selectedIdForPressure = id;
            tempPressureInput = currentPressure;
        }
    }

    async function savePressure(id: number) {
        try {
            const res = await fetch(`${TRUPPS_URL}/${id}/druck`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPressure: tempPressureInput }),
            });

            if (res.ok) {
                selectedIdForPressure = null;
            }
        } catch (err) {
            console.error('Fehler beim Speichern des Drucks:', err);
        }
    }

    async function addTrupp() {
        formError = '';
        if (!traeger1 || !traeger2) {
            formError = 'Ein Trupp muss aus mindestens 2 Personen bestehen.';
            return;
        }

        const ausgewaehlteNamen = [traeger1, traeger2, traeger3].filter(
            (t) => t !== '',
        );
        const memberIds = ausgewaehlteNamen
            .map((name) => {
                const p = backendPersonnel.find((pers) => pers.name === name);
                return p ? p.id : 0;
            })
            .filter((id) => id !== 0);

        try {
            const res = await fetch(TRUPPS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Trupp ${nextTruppId}`,
                    members: memberIds,
                    startPressure: newStartPressure,
                }),
            });

            if (res.ok) {
                traeger1 = '';
                traeger2 = '';
                traeger3 = '';
                newStartPressure = 300;
                showForm = false;
            } else {
                const errData = await res.json();
                formError =
                    errData.error || 'Fehler beim Erstellen des Trupps.';
            }
        } catch (err) {
            formError = 'Verbindung zum Server fehlgeschlagen.';
        }
    }

    async function deleteTrupp(id: number) {
        if (
            !confirm(
                'Möchtest du diesen Trupp wirklich löschen / Einsatz beenden?',
            )
        ) {
            return;
        }

        try {
            const res = await fetch(`${TRUPPS_URL}/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                if (selectedIdForPressure === id) selectedIdForPressure = null;
            } else {
                alert('Fehler beim Löschen des Trupps.');
            }
        } catch (err) {
            console.error(err);
            alert('Server nicht erreichbar.');
        }
    }
</script>

<div class="space-y-6 p-4 md:p-6 max-w-7xl mx-auto font-sans">
    <div
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-muted"
    >
        <div>
            <h1
                class="text-2xl font-black tracking-tight text-foreground md:text-3xl uppercase"
            >
                {settings.t('Live-Einsatz-Cockpit').value}
            </h1>
        </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <div
            class="flex items-center justify-between p-4 bg-card rounded-xl border border-muted shadow-sm hover:shadow-md transition-shadow"
        >
            <div class="space-y-1">
                <p
                    class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                    {settings.t('Aktive Trupps').value}
                </p>
                <p class="text-3xl font-black font-mono text-primary">
                    {activeTruppCount.toString()}
                </p>
            </div>
            <div class="p-3 rounded-lg bg-primary/10 text-primary">
                <Users size={24} />
            </div>
        </div>

        <div
            class="flex items-center justify-between p-4 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow
            {warningCount > 0
                ? 'border-destructive bg-destructive/5 animate-pulse'
                : 'border-muted'}"
        >
            <div class="space-y-1">
                <p
                    class="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                    {settings.t('Warnungen / Überfällig').value}
                </p>
                <p
                    class="text-3xl font-black font-mono {warningCount > 0
                        ? 'text-destructive'
                        : 'text-emerald-500'}"
                >
                    {warningCount.toString()}
                </p>
            </div>
            <div
                class="p-3 rounded-lg {warningCount > 0
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-emerald-500/10 text-emerald-500'}"
            >
                <AlertTriangle size={24} />
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-4 lg:col-span-3">
            <h2
                class="text-lg font-bold uppercase tracking-wide text-foreground flex items-center gap-2"
            >
                <span class="h-4 w-1 bg-primary rounded"></span>
                {settings.t('Aktive Truppüberwachung').value}
            </h2>

            <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {#each trupps as trupp (trupp.id)}
                    <div
                        class="flex flex-col justify-between bg-card rounded-xl border border-muted p-1 shadow-sm hover:border-primary/40 transition-colors"
                    >
                        <div
                            role="button"
                            tabindex="0"
                            onclick={() =>
                                handleCardClick(
                                    trupp.id,
                                    trupp.currentPressure,
                                )}
                            onkeydown={(e) =>
                                e.key === 'Enter' &&
                                handleCardClick(
                                    trupp.id,
                                    trupp.currentPressure,
                                )}
                            class="clickable-card cursor-pointer w-full text-left focus:outline-none"
                        >
                            <TruppCard
                                {trupp}
                                allMembers={backendPersonnel}
                                onDelete={deleteTrupp}
                            />
                        </div>

                        <div
                            class="mt-auto p-2 border-t border-muted/50 bg-muted/10 rounded-b-lg"
                        >
                            {#if selectedIdForPressure === trupp.id}
                                <div
                                    class="flex items-center justify-between gap-2 bg-background p-1.5 rounded-lg border border-primary/30"
                                >
                                    <div class="flex items-center gap-1.5">
                                        <span
                                            class="text-[11px] font-bold text-primary uppercase"
                                            >Druck:</span
                                        >
                                        <input
                                            type="number"
                                            min="0"
                                            max="350"
                                            bind:value={tempPressureInput}
                                            class="w-16 rounded border bg-muted px-1.5 py-0.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <span
                                            class="text-[10px] text-muted-foreground font-semibold"
                                            >bar</span
                                        >
                                    </div>
                                    <div class="flex gap-1">
                                        <button
                                            onclick={(e) => {
                                                e.stopPropagation();
                                                savePressure(trupp.id);
                                            }}
                                            class="rounded bg-emerald-500 p-1 text-white hover:bg-emerald-600 cursor-pointer transition-colors"
                                            title="Speichern"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onclick={(e) => {
                                                e.stopPropagation();
                                                selectedIdForPressure = null;
                                            }}
                                            class="rounded bg-muted p-1 text-muted-foreground hover:bg-muted-foreground/20 cursor-pointer transition-colors"
                                            title="Abbrechen"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            {:else}
                                <div
                                    class="flex items-center justify-between text-[11px] text-muted-foreground px-1"
                                >
                                    <span
                                        class="flex items-center gap-1 opacity-70"
                                    >
                                        <Gauge size={12} />
                                        {settings.t('Klicken zum Ändern').value}
                                    </span>
                                    {#if Date.now() - trupp.lastCheckTime > CHECK_INTERVAL && trupp.status === 'active'}
                                        <span
                                            class="flex items-center gap-1 font-bold text-destructive animate-pulse bg-destructive/10 px-1.5 py-0.5 rounded"
                                        >
                                            <Timer size={12} />
                                            {settings.t('Überfällig!').value}
                                        </span>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/each}

                {#if !showForm}
                    <button
                        onclick={() => {
                            showForm = true;
                            formError = '';
                        }}
                        class="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                    >
                        <div
                            class="flex h-12 w-12 items-center justify-center rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                            <Plus size={24} strokeWidth={2.5} />
                        </div>
                        <div class="flex flex-col items-center">
                            <span
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary"
                            >
                                {settings.t('Neuer Trupp').value}
                            </span>
                            <span
                                class="text-[11px] text-muted-foreground/60 mt-0.5"
                            >
                                {settings.t('Registrieren als Trupp').value}
                                {nextTruppId}
                            </span>
                        </div>
                    </button>
                {:else}
                    <div
                        class="flex flex-col gap-3 rounded-xl border-2 border-primary/40 bg-card p-4 shadow-md transition-all"
                    >
                        <div
                            class="flex items-center justify-between border-b pb-2 border-muted"
                        >
                            <h3
                                class="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5"
                            >
                                <span class="h-2 w-2 rounded-full bg-primary"
                                ></span>
                                {settings.t('Trupp').value}
                                {nextTruppId}
                                {settings.t('anlegen').value}
                            </h3>
                            <button
                                onclick={() => (showForm = false)}
                                class="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {#if formError}
                            <div
                                class="text-[11px] text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 font-semibold"
                            >
                                {settings.t(formError).value}
                            </div>
                        {/if}

                        <div class="space-y-1">
                            <label
                                class="block text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                            >
                                {settings.t('Atemschutzträger 1').value} *
                            </label>
                            <select
                                bind:value={traeger1}
                                class="w-full rounded-md border border-muted bg-background px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value=""
                                    >-- {settings.t('Bitte wählen').value} --</option
                                >
                                {#each verfuegbareTraeger as träger}
                                    <option
                                        value={träger}
                                        disabled={träger === traeger2 ||
                                            träger === traeger3}
                                    >
                                        {träger}
                                    </option>
                                {/each}
                            </select>
                        </div>

                        <div class="space-y-1">
                            <label
                                class="block text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                            >
                                {settings.t('Atemschutzträger 2').value} *
                            </label>
                            <select
                                bind:value={traeger2}
                                class="w-full rounded-md border border-muted bg-background px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value=""
                                    >-- {settings.t('Bitte wählen').value} --</option
                                >
                                {#each verfuegbareTraeger as träger}
                                    <option
                                        value={träger}
                                        disabled={träger === traeger1 ||
                                            träger === traeger3}
                                    >
                                        {träger}
                                    </option>
                                {/each}
                            </select>
                        </div>

                        <div class="space-y-1">
                            <label
                                class="block text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                            >
                                {settings.t('Atemschutzträger 3 (Optional)')
                                    .value}
                            </label>
                            <select
                                bind:value={traeger3}
                                class="w-full rounded-md border border-muted bg-background px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value=""
                                    >-- {settings.t('Keine Auswahl').value} --</option
                                >
                                {#each verfuegbareTraeger as träger}
                                    <option
                                        value={träger}
                                        disabled={träger === traeger1 ||
                                            träger === traeger2}
                                    >
                                        {träger}
                                    </option>
                                {/each}
                            </select>
                        </div>

                        <div class="space-y-1">
                            <label
                                class="block text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                            >
                                {settings.t('Niedrigster Druck (bar)').value}
                            </label>
                            <input
                                type="number"
                                bind:value={newStartPressure}
                                min="0"
                                max="350"
                                class="w-full rounded-md border border-muted bg-background px-2.5 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>

                        <div class="mt-2 flex gap-2">
                            <button
                                onclick={addTrupp}
                                class="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors uppercase tracking-wider"
                            >
                                <Check size={14} />
                                {settings.t('Aktivieren').value}
                            </button>
                            <button
                                onclick={() => (showForm = false)}
                                class="rounded-md border border-muted bg-background px-3 py-2 text-xs font-medium hover:bg-muted cursor-pointer transition-colors"
                            >
                                {settings.t('Abbrechen').value}
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    /* Saubere HTL-Style-Overrides für bessere Klick-Effekte */
    .clickable-card:focus-visible {
        outline: 2px solid var(--primary);
        border-radius: 0.75rem;
    }
</style>
