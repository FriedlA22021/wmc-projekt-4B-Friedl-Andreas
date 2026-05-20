<script lang="ts">
  import type { Component } from 'svelte';

  interface Props {
    icon: Component;
    label: string;
    value: string;
    color?: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
  }

  let { icon: Icon, label, value, color = 'primary' }: Props = $props();

  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive'
  };
</script>

<div class="rounded-xl border border-border bg-card p-4">
  <div class="flex items-center gap-3">
    <div class="flex h-10 w-10 items-center justify-center rounded-lg {colorClasses[color]}">
      <Icon class="h-5 w-5" />
    </div>
    <div>
      <p class="text-2xl font-bold text-foreground">{value}</p>
      <p class="text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
</div>
