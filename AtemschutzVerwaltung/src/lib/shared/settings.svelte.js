import { setContext, getContext } from 'svelte';

const translationStates = new Map();

async function fetchTranslation(text, targetLang) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=de|${targetLang}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.responseData?.translatedText || text;
    } catch (error) {
        console.error("Übersetzungsfehler:", error);
        return text; 
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
        if (this.lang === 'de') return { value: text };

        const cacheKey = `${text}_${this.lang}`;

        if (!translationStates.has(cacheKey)) {
            const stateObj = $state({ value: '...' });
            translationStates.set(cacheKey, stateObj);

            fetchTranslation(text, this.lang).then(translated => {
                stateObj.value = translated; 
            });
        }

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