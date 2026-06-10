import { loadPreferences, savePreferences } from './idb';

function createPreferences() {
	let darkMode = $state(false);
	let hardMode = $state(false);
	let animationsEnabled = $state(true);
	let highContrast = $state(false);
	let loaded = $state(false);

	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	function scheduleSave() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			savePreferences({
				darkMode,
				hardMode,
				animationsEnabled,
				highContrast
			});
		}, 500);
	}

	async function load() {
		const stored = await loadPreferences();
		if (stored) {
			darkMode = stored.darkMode;
			hardMode = stored.hardMode;
			animationsEnabled = stored.animationsEnabled;
			highContrast = stored.highContrast;
		}
		document.documentElement.classList.toggle('dark', darkMode);
		loaded = true;
	}

	$effect(() => {
		// Watch state and auto-save on changes
		const _d = darkMode;
		const _h = hardMode;
		const _a = animationsEnabled;
		const _c = highContrast;
		if (loaded) {
			scheduleSave();
		}
	});

	return {
		get darkMode() { return darkMode; },
		set darkMode(v: boolean) {
			darkMode = v;
			document.documentElement.classList.toggle('dark', v);
		},
		get hardMode() { return hardMode; },
		set hardMode(v: boolean) { hardMode = v; },
		get animationsEnabled() { return animationsEnabled; },
		set animationsEnabled(v: boolean) { animationsEnabled = v; },
		get highContrast() { return highContrast; },
		set highContrast(v: boolean) { highContrast = v; },
		get loaded() { return loaded; },
		load
	};
}

export const preferences = createPreferences();
