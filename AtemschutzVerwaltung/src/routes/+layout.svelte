<script lang="ts">
    import '../app.css';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import Header from '$lib/components/Header.svelte';

    let { children } = $props();
</script>

<div class="flex h-screen bg-background">
    <Sidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main class="flex-1 overflow-auto p-6">
            {@render children()}
        </main>
    </div>
</div>
