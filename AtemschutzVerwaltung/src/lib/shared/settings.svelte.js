import { setContext, getContext } from 'svelte';

// Dieser Cache speichert jetzt reaktive Svelte-Zustände
const translationStates = new Map();

async function fetchTranslation(text, targetLang) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=de|${targetLang}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.responseData?.translatedText || text;
    } catch (error) {
        console.error("Übersetzungsfehler:", error);
        return text; // Fallback auf Deutsch bei API-Fehler
    }
}

class TranslatorState {
    lang = $state('de');
    theme = $state('light');

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
    }

    setLanguage(newLang) {
        this.lang = newLang;
    }

    t(text) {
        // Wenn Deutsch gewählt ist, sofort das Original zurückgeben
        if (this.lang === 'de') return { value: text };

        const cacheKey = `${text}_${this.lang}`;

        // Wenn wir für diesen Text + Sprache noch keinen reaktiven State haben, legen wir ihn an
        if (!translationStates.has(cacheKey)) {
            // Wir erstellen ein reaktives Objekt, das mit '...' startet
            const stateObj = $state({ value: '...' });
            translationStates.set(cacheKey, stateObj);

            // API-Aufruf im Hintergrund starten
            fetchTranslation(text, this.lang).then(translated => {
                stateObj.value = translated; // Hier wird die UI reaktiv aktualisiert!
            });
        }

        // Gib das reaktive Objekt aus dem Cache zurück
        return translationStates.get(cacheKey);
    }
}

const settingsInstance = new TranslatorState();
const SETTINGS_KEY = Symbol('settings');

export function setSettingsContext() {
    setContext(SETTINGS_KEY, settingsInstance);
    return settingsInstance;
}

export function useTranslator() {
    try {
        return getContext(SETTINGS_KEY) || settingsInstance;
    } catch {
        return settingsInstance;
    }
}

export function useSettings() {
    return useTranslator();
}