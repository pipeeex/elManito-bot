
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
    createCipheriv,
    createDecipheriv,
    randomBytes
} from "node:crypto";

const dbPath = "./data/canvas.db";

mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS canvas_accounts_secure (
        discord_id TEXT PRIMARY KEY,
        encrypted_token TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
`);

function getEncryptionKey(): Buffer {
    const value = process.env.CANVAS_ENCRYPTION_KEY;

    if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
        throw new Error("CANVAS_ENCRYPTION_KEY debe tener 64 caracteres hexadecimales.");
    }

    return Buffer.from(value, "hex");
}

function encryptToken(token: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);

    const encrypted = Buffer.concat([
        cipher.update(token, "utf8"),
        cipher.final()
    ]);

    return [
        iv.toString("hex"),
        cipher.getAuthTag().toString("hex"),
        encrypted.toString("hex")
    ].join(":");
}


function decryptToken(value: string): string {
    const parts = value.split(":");

    if (parts.length !== 3) {
        throw new Error("Formato de token cifrado inválido.");
    }

    const ivHex = parts[0];
    const tagHex = parts[1];
    const encryptedHex = parts[2];

    if (ivHex === undefined || tagHex === undefined || encryptedHex === undefined) {
        throw new Error("Faltan datos del token cifrado.");
    }

    const decipher = createDecipheriv(
        "aes-256-gcm",
        getEncryptionKey(),
        Buffer.from(ivHex, "hex")
    );

    decipher.setAuthTag(Buffer.from(tagHex, "hex"));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, "hex")),
        decipher.final()
    ]);

    return decrypted.toString("utf8");
}


const saveAccount = db.prepare(`
    INSERT INTO canvas_accounts_secure (discord_id, encrypted_token)
    VALUES (?, ?)
    ON CONFLICT(discord_id)
    DO UPDATE SET
        encrypted_token = excluded.encrypted_token,
        created_at = CURRENT_TIMESTAMP
`);

const getAccount = db.prepare(`
    SELECT encrypted_token
    FROM canvas_accounts_secure
    WHERE discord_id = ?
`);

const deleteAccount = db.prepare(`
    DELETE FROM canvas_accounts_secure
    WHERE discord_id = ?
`);

export function saveCanvasAccount(
    discordId: string,
    token: string
): void {
    saveAccount.run(discordId, encryptToken(token));
}

export function getCanvasToken(
    discordId: string
): string | undefined {
    const row = getAccount.get(discordId) as
        | { encrypted_token: string }
        | undefined;

    return row ? decryptToken(row.encrypted_token) : undefined;
}

export function deleteCanvasAccount(discordId: string): void {
    deleteAccount.run(discordId);
}
