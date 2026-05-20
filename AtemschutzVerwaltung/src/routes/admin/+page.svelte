<script lang="ts">
  import {
    BarChart3,
    Clock,
    Shield,
    Globe,
    Download,
    Settings,
    Users,
    Calendar,
    TrendingUp,
    FileText,
  } from 'lucide-svelte';

  // Stats
  const stats = {
    totalHours: 248,
    totalDeployments: 32,
    averageDuration: 28,
    personnelCount: 24,
  };

  // Monthly data for chart visualization
  const monthlyData = [
    { month: 'Jan', hours: 18, deployments: 3 },
    { month: 'Feb', hours: 24, deployments: 4 },
    { month: 'Mar', hours: 32, deployments: 5 },
    { month: 'Apr', hours: 28, deployments: 4 },
    { month: 'Mai', hours: 22, deployments: 3 },
  ];

  const maxHours = Math.max(...monthlyData.map((d) => d.hours));

  // Recent deployments
  const recentDeployments = [
    {
      id: 'E-2026-032',
      date: '05.05.2026',
      type: 'Brand',
      duration: 45,
      personnel: 4,
    },
    {
      id: 'E-2026-031',
      date: '28.04.2026',
      type: 'THL',
      duration: 32,
      personnel: 2,
    },
    {
      id: 'E-2026-030',
      date: '22.04.2026',
      type: 'Brand',
      duration: 68,
      personnel: 6,
    },
    {
      id: 'E-2026-029',
      date: '15.04.2026',
      type: 'Übung',
      duration: 90,
      personnel: 8,
    },
    {
      id: 'E-2026-028',
      date: '10.04.2026',
      type: 'Brand',
      duration: 25,
      personnel: 4,
    },
  ];

  let language = $state<'de' | 'en'>('de');
</script>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Admin-Zentrale</h1>
      <p class="text-muted-foreground">
        Statistiken, Einstellungen und Einsatz-Archiv
      </p>
    </div>
  </div>

  <!-- Stats Overview -->
  <div class="grid gap-4 md:grid-cols-4">
    <div class="rounded-xl border border-border bg-card p-4">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
        >
          <Clock class="h-5 w-5 text-primary" />
        </div>
        <div>
          <p class="text-2xl font-bold text-foreground">{stats.totalHours}h</p>
          <p class="text-sm text-muted-foreground">Einsatzstunden 2026</p>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-border bg-card p-4">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10"
        >
          <BarChart3 class="h-5 w-5 text-accent" />
        </div>
        <div>
          <p class="text-2xl font-bold text-foreground">
            {stats.totalDeployments}
          </p>
          <p class="text-sm text-muted-foreground">Einsätze gesamt</p>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-border bg-card p-4">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"
        >
          <Users class="h-5 w-5 text-warning" />
        </div>
        <div>
          <p class="text-2xl font-bold text-foreground">
            {stats.personnelCount}
          </p>
          <p class="text-sm text-muted-foreground">Atemschutzträger</p>
        </div>
      </div>
    </div>
  </div>

  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Chart Section -->
    <div class="lg:col-span-2 space-y-4">
      <div class="rounded-xl border border-border bg-card p-6">
        <h2 class="mb-4 text-lg font-semibold text-foreground">
          Einsatzstunden pro Monat
        </h2>
        <div class="flex items-end gap-4 h-48">
          {#each monthlyData as data}
            <div class="flex flex-1 flex-col items-center gap-2">
              <div class="relative w-full flex-1 flex items-end justify-center">
                <div
                  class="w-full max-w-12 rounded-t-lg bg-primary transition-all hover:bg-primary/80"
                  style="height: {(data.hours / maxHours) * 100}%"
                ></div>
              </div>
              <div class="text-center">
                <p class="text-sm font-medium text-foreground">{data.hours}h</p>
                <p class="text-xs text-muted-foreground">{data.month}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Recent Deployments -->
      <div class="rounded-xl border border-border bg-card">
        <div class="border-b border-border p-4">
          <h2 class="text-lg font-semibold text-foreground">Letzte Einsätze</h2>
        </div>
        <div class="divide-y divide-border">
          {#each recentDeployments as deployment}
            <div
              class="flex items-center justify-between p-4 transition-colors hover:bg-secondary/30"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"
                >
                  <FileText class="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p class="font-medium text-foreground">{deployment.id}</p>
                  <p class="text-sm text-muted-foreground">{deployment.type}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm text-foreground">{deployment.duration} min</p>
                <p class="text-xs text-muted-foreground">{deployment.date}</p>
              </div>
              <div
                class="flex items-center gap-1 text-sm text-muted-foreground"
              >
                <Users class="h-4 w-4" />
                {deployment.personnel}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Settings Panel -->
    <div class="space-y-4">
      <div class="rounded-xl border border-border bg-card p-4">
        <h2
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground"
        >
          <Settings class="h-5 w-5" />
          Einstellungen
        </h2>

        <div class="space-y-4">
          <!-- Language Setting -->
          <div class="rounded-lg bg-secondary p-3">
            <div class="mb-2 flex items-center gap-2">
              <Globe class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium text-foreground"
                >Sprache / Language</span
              >
            </div>
            <div class="flex gap-2">
              <button
                onclick={() => (language = 'de')}
                class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors {language ===
                'de'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'}"
              >
                Deutsch
              </button>
              <button
                onclick={() => (language = 'en')}
                class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors {language ===
                'en'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'}"
              >
                English
              </button>
            </div>
          </div>

          <!-- Organization -->
          <div class="rounded-lg bg-secondary p-3">
            <div class="mb-2 flex items-center gap-2">
              <Shield class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium text-foreground"
                >Organisation</span
              >
            </div>
            <p class="text-sm text-muted-foreground">FF Name der Feuerwehr</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
