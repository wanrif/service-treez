declare module "bun" {
	interface Env {
		NODE_ENV: "development" | "production" | "test";
		SERVICE_PORT: number;
		ENCRYPTION_PASSWORD: string;
		ENCRYPTION_ALGORITHM: string;
	}
}
