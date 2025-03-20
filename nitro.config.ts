//https://nitro.unjs.io/config
export default defineNitroConfig({
	srcDir: "server",

	publicAssets: [
		{
			dir: "public",
			baseURL: "/",
		},
	],
	routeRules: {
		"/api/**": {
			cors: true,
			headers: {
				"access-control-allow-methods":
					"GET,HEAD,PUT,PATCH,POST,DELETE",
				"access-control-allow-origin": "*",
			},
		},
	},

	compatibilityDate: "2025-03-19",
});
