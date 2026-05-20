<script lang="ts">
  import { AlertTriangle, CheckCircle, Info, Clock } from 'lucide-svelte';

  const alerts = [
    {
      id: 1,
      type: 'warning' as const,
      message: 'Trupp 2 erreicht Rückzugsschwelle in 5 min',
      time: '14:32:15'
    },
    {
      id: 2,
      type: 'info' as const,
      message: 'Trupp 3 eingesetzt',
      time: '14:28:00'
    },
    {
      id: 3,
      type: 'success' as const,
      message: 'Trupp 1 Druckcheck bestätigt',
      time: '14:25:30'
    },
    {
      id: 4,
      type: 'info' as const,
      message: 'Einsatz gestartet',
      time: '14:17:00'
    }
  ];

  const iconMap = {
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle
  };

  const colorMap = {
    warning: 'border-warning bg-warning/10 text-warning',
    info: 'border-muted bg-muted/10 text-muted-foreground',
    success: 'border-success bg-success/10 text-success'
  };
</script>

<div class="space-y-3">
  {#each alerts as alert (alert.id)}
    {@const Icon = iconMap[alert.type]}
    <div class="rounded-lg border-l-4 bg-card p-3 {colorMap[alert.type]}">
      <div class="flex items-start gap-3">
        <Icon class="mt-0.5 h-4 w-4 flex-shrink-0" />
        <div class="flex-1">
          <p class="text-sm text-foreground">{alert.message}</p>
          <div class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock class="h-3 w-3" />
            <span>{alert.time}</span>
          </div>
        </div>
      </div>
    </div>
  {/each}
</div>
