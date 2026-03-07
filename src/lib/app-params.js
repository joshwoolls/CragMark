// Simplified app params for local development
// Removed all Base44-specific parameter handling

export const appParams = {
	appId: 'local-app',
	token: null,
	fromUrl: window.location.href,
	functionsVersion: '1.0',
	appBaseUrl: 'http://localhost:3000',
}
