/// <reference types="@sveltejs/kit" />
/// <reference types="lucia" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="@vite-pwa/sveltekit" />

declare global {
	namespace App {
		interface Locals {
			user: import('lucia').User | null;
			session: import('lucia').Session | null;
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
