import { v4 as uuidv4 } from 'uuid';


export class ApiKeyService {
    private _apiKey: string | null;
    private _createdAt: Date | null;
    private _updatedAt: Date | null;
    private _revokedAt: Date | null;

    constructor() {
        this._apiKey = null;
        this._createdAt = null;
        this._updatedAt = null;
        this._revokedAt = null;
    }

    // Getters for read-only access
    get apiKey(): string | null { return this._apiKey; }
    get createdAt(): Date | null { return this._createdAt; }
    get updatedAt(): Date | null { return this._updatedAt; }
    get revokedAt(): Date | null { return this._revokedAt; }

    /** Check if key exists and is not revoked */
    isActive(): boolean {
        return this._apiKey !== null && this._revokedAt === null;
    }

    validateKey(key: string): boolean {
        return this._apiKey === key && this._revokedAt === null;
    }

    /** Check if key has been revoked */
    isRevoked(): boolean {
        return this._revokedAt !== null;
    }

    /** Generate a new API key */
    generateNewKey(): string {
        if (this._apiKey !== null) {
            throw new Error('Key already exists. Use regenerateKey() to create a new one.');
        }

        const now = new Date();
        this._apiKey = `nr-${uuidv4()}`;
        this._createdAt = now;  
        this._updatedAt = now;
        this._revokedAt = null;

        return this._apiKey;
    }

    /** Regenerate the API key (invalidates the old one) */
    regenerateKey(): string {
        if (!this.isActive()) {
            throw new Error('Cannot regenerate: no active key exists.');
        }

        this._apiKey = `nr-${uuidv4()}`;
        this._updatedAt = new Date();

        return this._apiKey;
    }

    /** Revoke the API key (soft delete) */
    revoke(): void {
        if (!this.isActive()) {
            throw new Error('Cannot revoke: no active key exists.');
        }

        this._apiKey = null;
        this._revokedAt = new Date();
        this._updatedAt = new Date();
    }

    /** Serialize for database storage */
    toJSON() {
        return {
            apiKey: this._apiKey,
            createdAt: this._createdAt?.toISOString() ?? null,
            updatedAt: this._updatedAt?.toISOString() ?? null,
            revokedAt: this._revokedAt?.toISOString() ?? null,
        };
    }
}