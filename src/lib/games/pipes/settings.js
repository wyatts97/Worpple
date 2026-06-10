import { writable, get } from 'svelte/store';

/**
 * @typedef {'rotate_lock'|'rotate_rotate'|'orient_lock'} ControlMode
 * @typedef {'normal'|'fast'|'instant'} AnimationSpeed
 * @typedef {Object} Settings
 * @property {ControlMode} controlMode
 * @property {Boolean} invertRotationDirection
 * @property {Boolean} showTimer
 * @property {Boolean} disableZoomPan
 * @property {Boolean} assistant
 * @property {AnimationSpeed} animationSpeed
 */

const defaultSettings = {
	controlMode: 'rotate_lock',
	invertRotationDirection: false,
	showTimer: true,
	disableZoomPan: false,
	assistant: false,
	animationSpeed: 'normal'
};

/** @type {import('svelte/store').Writable<Settings>} */
const { subscribe, set, update } = writable({ ...defaultSettings });

export const settings = {
	subscribe,
	set(value) {
		set(value);
		try {
			window.localStorage.setItem('hexapipes_settings', JSON.stringify(value));
		} catch (e) {
			// ignore
		}
	},
	loadFromLocalStorage() {
		try {
			const data = window.localStorage.getItem('hexapipes_settings');
			if (data) {
				const parsed = JSON.parse(data);
				// migrate old control modes
				if (parsed.controlMode === 'click_to_rotate') parsed.controlMode = 'rotate_lock';
				if (parsed.controlMode === 'click_to_orient') parsed.controlMode = 'orient_lock';
				set({ ...defaultSettings, ...parsed });
			} else {
				set({ ...defaultSettings });
			}
		} catch (e) {
			set({ ...defaultSettings });
		}
	}
};
