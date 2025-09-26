import fs from "fs-extra";
import path from "path";
import os from "os";
import crypto from "crypto";

interface AuthConfig {
  accessToken?: string;
  userId?: string;
  organizationId?: string;
}

interface Config {
  auth?: AuthConfig;
}

const CONFIG_DIR = path.join(os.homedir(), ".mittvibes");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

// Use a more secure approach with createCipheriv/createDecipheriv
const ENCRYPTION_KEY = crypto.scryptSync("mittvibes-cli-2024", "salt", 32);
const IV = Buffer.alloc(16, 0); // Initialization vector

function encrypt(text: string): string {
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(text: string): string {
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(text, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export async function ensureConfigDir(): Promise<void> {
  await fs.ensureDir(CONFIG_DIR);
}

export async function loadConfig(): Promise<Config> {
  await ensureConfigDir();

  if (!(await fs.pathExists(CONFIG_FILE))) {
    return {};
  }

  try {
    const encryptedContent = await fs.readFile(CONFIG_FILE, "utf8");
    const decryptedContent = decrypt(encryptedContent);
    return JSON.parse(decryptedContent);
  } catch {
    // If decryption fails, try reading as plain JSON (for backward compatibility)
    try {
      return await fs.readJson(CONFIG_FILE);
    } catch {
      return {};
    }
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await ensureConfigDir();
  const jsonContent = JSON.stringify(config, null, 2);
  const encryptedContent = encrypt(jsonContent);
  await fs.writeFile(CONFIG_FILE, encryptedContent, "utf8");
}

export async function getAuthConfig(): Promise<AuthConfig | undefined> {
  const config = await loadConfig();
  return config.auth;
}

export async function saveAuthConfig(auth: AuthConfig): Promise<void> {
  const config = await loadConfig();
  config.auth = auth;
  await saveConfig(config);
}

export async function clearAuthConfig(): Promise<void> {
  const config = await loadConfig();
  delete config.auth;
  await saveConfig(config);
}

export async function isAuthenticated(): Promise<boolean> {
  const auth = await getAuthConfig();
  return !!auth?.accessToken;
}

export async function getAccessToken(): Promise<string | undefined> {
  const auth = await getAuthConfig();
  return auth?.accessToken;
}