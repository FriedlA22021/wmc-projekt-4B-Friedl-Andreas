<script lang="ts">
    import TruppCard from '$lib/components/TruppCard.svelte';
    import StatCard from '$lib/components/StatCard.svelte';
    import AlertPanel from '$lib/components/AlertPanel.svelte';
    import { Users, Timer, Gauge, AlertTriangle, Plus } from 'lucide-svelte';
    let trupps = $state([
        {
            id: 1,
            name: 'Trupp 1',
            members: ['M. Schmidt', 'K. Weber', 'T.Bauer'],
            startPressure: 300,
            currentPressure: 220,
            startTime: Date.now() - 15 * 60 * 1000,
            status: 'active' as const,
        },
        {
            id: 2,
            name: 'Trupp 2',
            members: ['T. Müller', 'S. Fischer', 'T.Froschauer'],
            startPressure: 300,
            currentPressure: 180,
            startTime: Date.now() - 22 * 60 * 1000,
            status: 'warning' as const,
        },
    ]);

    let activeTruppCount = $derived(
        trupps.filter((t) => t.status !== 'reserve').length,
    );
    let warningCount = $derived(
        trupps.filter((t) => t.status === 'warning').length,
    );
    let avgPressure = $derived(
        Math.round(
            trupps.reduce((acc, t) => acc + t.currentPressure, 0) /
                trupps.length,
        ),
    );
</script>

<div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-foreground">
                Live-Einsatz-Cockpit
            </h1>
            <p class="text-muted-foreground">
                Echtzeit-Überwachung aktiver Atemschutztrupps
            </p>
        </div>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
            icon={Users}
            label="Aktive Trupps"
            value={activeTruppCount.toString()}
            color="primary"
        />
        <StatCard
            icon={AlertTriangle}
            label="Warnungen"
            value={warningCount.toString()}
            color={warningCount > 0 ? 'warning' : 'success'}
        />
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Trupp Cards -->
        <div class="space-y-4 lg:col-span-2">
            <h2 class="text-lg font-semibold text-foreground">Aktive Trupps</h2>
            <div class="grid gap-4 md:grid-cols-2">
                {#each trupps as trupp (trupp.id)}
                    <TruppCard {trupp} />
                {/each}
                <button
                    onclick={addTrupp}
                    class="group relative flex h-full min-h-[160px] flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/5 transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
                >
                    <!-- Animierter Hintergrund-Glow -->
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                    ></div>

                    <div
                        class="relative flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                        <Plus size={28} strokeWidth={2.5} />
                    </div>

                    <div class="relative flex flex-col items-center">
                        <span
                            class="text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary"
                        >
                            Neuer Trupp
                        </span>
                        <span class="text-xs text-muted-foreground/60"
                            >Hinzufügen zur Überwachung</span
                        >
                    </div>
                </button>
            </div>
        </div>

        <!-- Alert Panel -->
        <div class="space-y-4">
            <h2 class="text-lg font-semibold text-foreground">
                Warnungen & Ereignisse
            </h2>
            <AlertPanel />
        </div>
    </div>
</div>
