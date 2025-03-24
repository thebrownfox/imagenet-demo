import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "./client/src"),
			// "@/components/ui": resolve(__dirname, "./src/client/components/ui")
		},
	},
	build: {
		outDir: "./public",
		emptyOutDir: true,
	},
	root: resolve(__dirname, "./client"),
	publicDir: "public",
	// Add this to ensure proper asset paths when served by Nitro
	base: "/",
});
