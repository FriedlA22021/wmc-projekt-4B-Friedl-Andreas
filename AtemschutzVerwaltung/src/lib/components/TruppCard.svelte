<script lang="ts">
  import { Radio, User, Trash2 } from 'lucide-svelte';
  import { useTranslator } from '$lib/shared/settings.svelte.js';

  const settings = useTranslator(); 

  interface Trupp {
    id: number;
    name: string;
    members: (string | number)[];
    startPressure: number;
    currentPressure: number;
    startTime: number;
    status: 'active' | 'warning' | 'critical' | 'reserve';
  }

  interface MemberUser {
    id: number;
    name: string;
    g26ValidUntil?: string;
    lastExerciseAt?: string;
    exerciseCount?: number;
    active?: boolean;
  }

  let {
    trupp,
    allMembers = [],
    onDelete = () => {},
  }: {
    trupp: Trupp;
    allMembers: MemberUser[];
    onDelete?: (id: number) => void;
  } = $props();

  let elapsedTime = $state(0);

  $effect(() => {
    const interval = setInterval(() => {
      elapsedTime = Math.floor((Date.now() - trupp.startTime) / 1000);
    }, 1000);
    return () => clearInterval(interval);
  });

  function formatElapsed(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const statusColors = {
    active: 'border-success bg-card text-card-foreground',
    warning: 'border-warning bg-warning/5 text-foreground animate-pulse',
    critical: 'border-destructive bg-destructive/5 text-foreground',
    reserve: 'border-muted text-muted-foreground',
  };
</script>

<div
  class="rounded-xl border-2 p-4 transition-all hover:shadow-md {statusColors[
    trupp.status
  ]}"
>
  <div class="mb-4 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg {trupp.status ===
        'warning'
          ? 'bg-warning/20 text-warning'
          : trupp.status === 'critical'
            ? 'bg-destructive/20 text-destructive'
            : 'bg-success/20 text-success'}"
      >
        <Radio class="h-4 w-4" />
      </div>
      <h3 class="text-lg font-bold">
        {trupp.name.startsWith('Trupp')
          ? `${settings.t('Trupp').value} ${trupp.name.split(' ')[1] || ''}`
          : settings.t(trupp.name).value}
      </h3>
    </div>

    <div class="flex items-center gap-4">
      <div class="text-right">
        <p class="font-mono text-2xl font-bold">{trupp.currentPressure}</p>
        <p class="text-xs text-muted-foreground">bar</p>
      </div>

      <button
        type="button"
        class="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors cursor-pointer"
        onclick={(e) => {
          e.stopPropagation();
          onDelete(trupp.id);
        }}
        title={settings.t('Einsatz beenden').value}
      >
        <Trash2 class="h-4 w-4" />
      </button>
    </div>
  </div>

  <div class="mb-4 grid grid-cols-2 gap-3">
    <div class="rounded-lg bg-muted p-2">
      <p class="text-xs text-muted-foreground">
        {settings.t('Einsatzzeit').value}
      </p>
      <p class="font-mono text-lg font-semibold">
        {formatElapsed(elapsedTime)}
      </p>
    </div>

    {#if trupp.status === 'warning'}
      <div
        class="rounded-lg bg-warning/20 p-2 flex flex-col justify-center border border-warning/50"
      >
        <p
          class="text-[10px] font-bold text-warning uppercase tracking-wider text-center"
        >
          {settings.t('Druck prüfen!').value}
        </p>
      </div>
    {/if}
  </div>

  <div class="flex items-center gap-2 text-sm text-muted-foreground">
    <User class="h-4 w-4" />
    <span>
      {trupp.members?.length
        ? trupp.members
            .map((idOrName) => {
              if (isNaN(Number(idOrName))) {
                return idOrName;
              }
              const user = allMembers.find(
                (u) => Number(u.id) === Number(idOrName),
              );
              return user ? user.name : settings.t('Unbekannt').value;
            })
            .join(' & ')
        : settings.t('Keine Mitglieder').value}
    </span>
  </div>
</div>
