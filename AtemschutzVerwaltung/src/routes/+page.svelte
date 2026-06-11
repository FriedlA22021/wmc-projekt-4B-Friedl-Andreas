<script lang="ts">
    import TruppCard from '$lib/components/TruppCard.svelte';
    import StatCard from '$lib/components/StatCard.svelte';
    import AlertPanel from '$lib/components/AlertPanel.svelte';
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

    interface Trupp {
        id: number;
        name: string;
        members: string[]; // Wird im Frontend als Namen-Array gebraucht
        startPressure: number;
        currentPressure: number;
        startTime: number; // Als Timestamp für Berechnungen
        lastCheckTime: number; // Als Timestamp für Berechnungen
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

    onMount(() => {
        loadData();

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

        return () => clearInterval(interval);
    });

    async function loadData() {
        try {
            // 1. Zuerst Personalstamm laden, damit wir IDs in Namen auflösen können
            const resPers = await fetch(PERSONAL_URL);
            let personnelData: BackendPerson[] = [];
            if (resPers.ok) {
                personnelData = await resPers.json();
                backendPersonnel = personnelData;
            }

            // 2. Jetzt Trupps laden
            const resTrupps = await fetch(TRUPPS_URL);
            if (resTrupps.ok) {
                const rawTeams = await resTrupps.json();

                // MAPPER: Wir passen die Backend-Struktur an das Svelte-Frontend an
                trupps = rawTeams.map((team: any) => {
                    // Falls memberIds existieren, mappen wir sie zu echten Namen
                    let mappedMembers: string[] = [];
                    if (team.memberIds && Array.isArray(team.memberIds)) {
                        mappedMembers = team.memberIds.map((id: number) => {
                            const p = personnelData.find(
                                (pers) => pers.id === id,
                            );
                            return p ? p.name : `Unbekannt (${id})`;
                        });
                    } else if (team.members) {
                        mappedMembers = team.members;
                    }

                    return {
                        id: team.id,
                        name: team.name,
                        members: mappedMembers,
                        startPressure: team.startPressure || 300,
                        currentPressure: team.currentPressure || 300,
                        // Konvertiert ISO-String (Backend) oder fallbacksicher zu Timestamp
                        startTime: team.startedAt
                            ? new Date(team.startedAt).getTime()
                            : team.startTime || Date.now(),
                        lastCheckTime: team.lastCheckTime
                            ? team.lastCheckTime
                            : Date.now(),
                        status: team.status || 'active',
                    };
                });
            }
        } catch (err) {
            console.error('Fehler beim Laden der Live-Daten:', err);
        }
    }

    // Filter für das Formular: Nur einsatzbereite Atemschutzträger
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
                // Nach dem Update laden wir die Daten frisch, damit der Mapper greift
                await loadData();
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

        // Für das Backend mappen wir die Namen zurück in IDs
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
                    members: memberIds, // Das Backend erwartet IDs im POST
                    startPressure: newStartPressure,
                }),
            });

            if (res.ok) {
                await loadData();
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
        )
            return;

        try {
            const res = await fetch(`${TRUPPS_URL}/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                trupps = trupps.filter((t) => t.id !== id);
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

<div class="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-foreground md:text-3xl">
            Live-Einsatz-Cockpit
        </h1>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <StatCard
            icon={Users}
            label="Aktive Trupps"
            value={activeTruppCount.toString()}
            color="primary"
        />
        <StatCard
            icon={AlertTriangle}
            label="Warnungen / Überfällig"
            value={warningCount.toString()}
            color={warningCount > 0 ? 'warning' : 'success'}
        />
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div class="space-y-4 lg:col-span-2">
            <h2 class="text-lg font-semibold text-foreground">
                Aktive Truppüberwachung
            </h2>

            <div class="grid gap-4 sm:grid-cols-2">
                {#each trupps as trupp (trupp.id)}
                    <div class="flex flex-col gap-2">
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
                            <TruppCard {trupp} onDelete={deleteTrupp} />
                        </div>

                        <div class="mt-1 px-1">
                            {#if selectedIdForPressure === trupp.id}
                                <div
                                    class="flex items-center justify-between gap-2 bg-muted/50 p-2 rounded-lg"
                                >
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="text-xs font-semibold text-primary"
                                            >Aktueller Druck:</span
                                        >
                                        <input
                                            type="number"
                                            min="0"
                                            max="350"
                                            bind:value={tempPressureInput}
                                            class="w-20 rounded-md border bg-background px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >bar</span
                                        >
                                    </div>
                                    <div class="flex gap-1">
                                        <button
                                            onclick={(e) => {
                                                e.stopPropagation();
                                                savePressure(trupp.id);
                                            }}
                                            class="rounded-md bg-primary p-1.5 text-primary-foreground hover:bg-primary/90 cursor-pointer"
                                            ><Check size={16} /></button
                                        >
                                        <button
                                            onclick={(e) => {
                                                e.stopPropagation();
                                                selectedIdForPressure = null;
                                            }}
                                            class="rounded-md bg-muted p-1.5 text-muted-foreground hover:bg-muted-foreground/20 cursor-pointer"
                                            ><X size={16} /></button
                                        >
                                    </div>
                                </div>
                            {:else}
                                <div
                                    class="flex items-center justify-between text-xs text-muted-foreground"
                                >
                                    <span class="flex items-center gap-1"
                                        ><Gauge size={14} /> Karte anklicken zum
                                        Ändern</span
                                    >
                                    {#if Date.now() - trupp.lastCheckTime > CHECK_INTERVAL && trupp.status === 'active'}
                                        <span
                                            class="flex items-center gap-1 font-semibold text-destructive animate-pulse"
                                            ><Timer size={12} /> Abfrage überfällig!</span
                                        >
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
                        class="group relative flex h-full min-h-[180px] flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/5 transition-all hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                    >
                        <div
                            class="relative flex h-12 w-12 items-center justify-center rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground"
                        >
                            <Plus size={28} strokeWidth={2.5} />
                        </div>
                        <div class="relative flex flex-col items-center">
                            <span
                                class="text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary"
                                >Neuer Trupp</span
                            >
                            <span class="text-xs text-muted-foreground/60"
                                >Registrieren als Trupp {nextTruppId}</span
                            >
                        </div>
                    </button>
                {:else}
                    <div
                        class="flex flex-col gap-3 rounded-xl border-2 border-primary/40 bg-card p-4 shadow-md"
                    >
                        <div
                            class="flex items-center justify-between border-b pb-2"
                        >
                            <h3
                                class="text-sm font-bold uppercase tracking-wider text-primary"
                            >
                                Trupp {nextTruppId} anlegen
                            </h3>
                            <button
                                onclick={() => (showForm = false)}
                                class="text-muted-foreground hover:text-foreground cursor-pointer"
                                ><X size={16} /></button
                            >
                        </div>

                        {#if formError}
                            <div
                                class="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 font-medium"
                            >
                                {formError}
                            </div>
                        {/if}

                        <div class="space-y-1">
                            <label
                                class="block text-xs font-medium text-muted-foreground"
                                >Atemschutzträger 1</label
                            >
                            <select
                                bind:value={traeger1}
                                class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                            >
                                <option value="">-- Bitte wählen --</option>
                                {#each verfuegbareTraeger as träger}
                                    <option
                                        value={träger}
                                        disabled={träger === traeger2 ||
                                            träger === traeger3}
                                        >{träger}</option
                                    >
                                {/each}
                            </select>
                        </div>

                        <div class="space-y-1">
                            <label
                                class="block text-xs font-medium text-muted-foreground"
                                >Atemschutzträger 2</label
                            >
                            <select
                                bind:value={traeger2}
                                class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                            >
                                <option value="">-- Bitte wählen --</option>
                                {#each verfuegbareTraeger as träger}
                                    <option
                                        value={träger}
                                        disabled={träger === traeger1 ||
                                            träger === traeger3}
                                        >{träger}</option
                                    >
                                {/each}
                            </select>
                        </div>

                        <div class="space-y-1">
                            <label
                                class="block text-xs font-medium text-muted-foreground"
                                >Atemschutzträger 3 (Optional)</label
                            >
                            <select
                                bind:value={traeger3}
                                class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                            >
                                <option value="">-- Keine Auswahl --</option>
                                {#each verfuegbareTraeger as träger}
                                    <option
                                        value={träger}
                                        disabled={träger === traeger1 ||
                                            träger === traeger2}
                                        >{träger}</option
                                    >
                                {/each}
                            </select>
                        </div>

                        <div class="space-y-1">
                            <label
                                class="block text-xs font-medium text-muted-foreground"
                                >Niedrigster Druck (bar)</label
                            >
                            <input
                                type="number"
                                bind:value={newStartPressure}
                                min="0"
                                max="350"
                                class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                            />
                        </div>

                        <div class="mt-2 flex gap-2">
                            <button
                                onclick={addTrupp}
                                class="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer"
                                ><Check size={14} /> Aktivieren</button
                            >
                            <button
                                onclick={() => (showForm = false)}
                                class="rounded-md border bg-background px-3 py-2 text-xs font-medium hover:bg-muted cursor-pointer"
                                >Abbrechen</button
                            >
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <div class="space-y-4">
            <h2 class="text-lg font-semibold text-foreground">
                Warnungen & Ereignisse
            </h2>
            <AlertPanel />
        </div>
    </div>
</div>

<style>
    .clickable-card {
        transition: opacity 0.2s ease;
    }
    .clickable-card:hover {
        opacity: 0.9;
    }
</style>
