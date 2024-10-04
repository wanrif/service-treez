import {
	randomBytes,
	createCipheriv,
	createDecipheriv,
	scryptSync,
	type CipherGCM,
	type DecipherGCM
} from "crypto";

class CryptoHelper {
	private algorithm: string;
	private key: Buffer;
	private ivLength: number;

	constructor(password: string, algorithm?: string) {
		this.algorithm =
			algorithm || process.env.ENCRYPTION_ALGORITHM || "aes-256-gcm";
		const keyLength = this.getKeyLength(this.algorithm);
		this.key = scryptSync(password, "salt", keyLength); // Derive key based on algorithm
		this.ivLength = this.getIvLength(this.algorithm);
	}

	private getKeyLength(algorithm: string): number {
		switch (algorithm) {
			case "aes-128-gcm":
			case "aes-128-cbc":
				return 16; // 128 bits = 16 bytes
			case "aes-192-gcm":
			case "aes-192-cbc":
				return 24; // 192 bits = 24 bytes
			case "aes-256-gcm":
			case "aes-256-cbc":
				return 32; // 256 bits = 32 bytes
			default:
				throw new Error(`Unsupported algorithm: ${algorithm}`);
		}
	}

	private getIvLength(algorithm: string): number {
		// IV length varies between AES modes (GCM = 12 bytes, CBC = 16 bytes)
		switch (algorithm) {
			case "aes-128-gcm":
			case "aes-192-gcm":
			case "aes-256-gcm":
				return 12; // Recommended IV length for GCM mode
			case "aes-128-cbc":
			case "aes-192-cbc":
			case "aes-256-cbc":
				return 16; // Standard IV length for CBC mode
			default:
				throw new Error(`Unsupported algorithm: ${algorithm}`);
		}
	}

	encrypt(payload: string, outputFormat: "hex" | "base64" = "hex"): string {
		const iv = randomBytes(this.ivLength); // Generate IV based on algorithm's required length
		const cipher = createCipheriv(this.algorithm, this.key, iv);

		let encrypted = cipher.update(payload, "utf8", outputFormat);
		encrypted += cipher.final(outputFormat);

		if (this.algorithm.includes("gcm")) {
			const authTag = (cipher as CipherGCM).getAuthTag().toString(outputFormat); // Get GCM authentication tag
			return `${iv.toString("hex")}:${authTag}:${encrypted}`;
		}

		return `${iv.toString("hex")}:${encrypted}`;
	}

	decrypt(
		encryptedPayload: string,
		inputFormat: "hex" | "base64" = "hex"
	): string {
		const [ivHex, authTagOrEncrypted, encrypted] = encryptedPayload.split(":");
		const iv = Buffer.from(ivHex, "hex");

		const decipher = createDecipheriv(this.algorithm, this.key, iv);

		if (this.algorithm.includes("gcm")) {
			const authTag = Buffer.from(authTagOrEncrypted, inputFormat); // Auth tag for GCM
			(decipher as DecipherGCM).setAuthTag(authTag);
		}

		let decrypted: string;
		if (this.algorithm.includes("gcm")) {
			decrypted = decipher.update(encrypted, inputFormat, "utf8");
		} else {
			decrypted = decipher.update(authTagOrEncrypted, inputFormat, "utf8");
		}

		decrypted += decipher.final("utf8");
		return decrypted;
	}
}

const password = process.env.ENCRYPTION_PASSWORD;
const encryptHelper = new CryptoHelper(password, "aes-256-gcm");
const encryptHelper128 = new CryptoHelper(password, "aes-128-cbc");
const encryptHelper192 = new CryptoHelper(password, "aes-192-gcm");

export { encryptHelper, encryptHelper128, encryptHelper192 };
