<script lang="ts">
  import { Radio, User } from 'lucide-svelte';

  interface Trupp {
    id: number;
    name: string;
    members: string[];
    startPressure: number;
    currentPressure: number;
    startTime: number;
    status: 'active' | 'warning' | 'critical' | 'reserve';
  }

  let { trupp }: { trupp: Trupp } = $props();

  let elapsedTime = $state(0);
  let remainingTime = $derived(calculateRemainingTime());

  $effect(() => {
    const interval = setInterval(() => {
      elapsedTime = Math.floor((Date.now() - trupp.startTime) / 1000);
    }, 1000);
    return () => clearInterval(interval);
  });

  function calculateRemainingTime() {
    // Simplified calculation: assume ~1 bar per minute consumption
    const usedPressure = trupp.startPressure - trupp.currentPressure;
    const elapsedMinutes = Math.floor((Date.now() - trupp.startTime) / 60000);
    const consumptionRate = elapsedMinutes > 0 ? usedPressure / elapsedMinutes : 2;
    const remainingBars = trupp.currentPressure - 50; // Reserve at 50 bar
    return Math.max(0, Math.round(remainingBars / consumptionRate));
  }

  function formatElapsed(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const pressurePercent = $derived((trupp.currentPressure / trupp.startPressure) * 100);

  const statusColors = {
    active: 'border-success glow-green',
    warning: 'border-warning glow-orange',
    critical: 'border-destructive glow-red animate-pulse-alert',
    reserve: 'border-muted'
  };

  const barColors = {
    active: 'bg-success',
    warning: 'bg-warning',
    critical: 'bg-destructive',
    reserve: 'bg-muted'
  };
</script>

<div
  class="rounded-xl border-2 bg-card p-4 transition-all {statusColors[trupp.status]}"
>
  <!-- Header -->
  <div class="mb-4 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg {trupp.status === 'warning'
          ? 'bg-warning/20 text-warning'
          : trupp.status === 'critical'
            ? 'bg-destructive/20 text-destructive'
            : 'bg-success/20 text-success'}"
      >
        <Radio class="h-4 w-4" />
      </div>
      <h3 class="text-lg font-bold text-foreground">{trupp.name}</h3>
    </div>
    <div class="text-right">
      <p class="font-mono text-2xl font-bold text-foreground">{trupp.currentPressure}</p>
      <p class="text-xs text-muted-foreground">bar</p>
    </div>
  </div>

  <!-- Pressure Bar -->
  <div class="mb-4">
    <div class="mb-1 flex justify-between text-xs text-muted-foreground">
      <span>Druck</span>
      <span>{Math.round(pressurePercent)}%</span>
    </div>
    <div class="h-3 overflow-hidden rounded-full bg-secondary">
      <div
        class="h-full rounded-full transition-all duration-500 {barColors[trupp.status]}"
        style="width: {pressurePercent}%"
      ></div>
    </div>
  </div>

  <!-- Info Grid -->
  <div class="mb-4 grid grid-cols-2 gap-3">
    <div class="rounded-lg bg-secondary p-2">
      <p class="text-xs text-muted-foreground">Einsatzzeit</p>
      <p class="font-mono text-lg font-semibold text-foreground">{formatElapsed(elapsedTime)}</p>
    </div>
    <div class="rounded-lg bg-secondary p-2">
      <p class="text-xs text-muted-foreground">Restzeit ca.</p>
      <p class="font-mono text-lg font-semibold {remainingTime < 10 ? 'text-warning' : 'text-foreground'}">
        {remainingTime} min
      </p>
    </div>
  </div>

  <!-- Members -->
  <div class="flex items-center gap-2 text-sm text-muted-foreground">
    <User class="h-4 w-4" />
    <span>{trupp.members.join(' & ')}</span>
  </div>
</div>
