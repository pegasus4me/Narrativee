import type {
    NarrativeeConfig,
    UserTraits,
    EventMetadata,
    EventResponse,
    WorkflowAction
} from './types/types';

export * from './types/types';

class NarrativeeSDK {
    private apiKey: string | null = null;
    private baseUrl: string = 'https://api.narrativee.com'; // Default to prod
    private userId: string | null = null;
    private userTraits: UserTraits | null = null;
    private listeners: Map<string, Set<(action: WorkflowAction) => void>> = new Map();

    /**
     * Initialize the Narrativee SDK with your API key
     */
    init(apiKey: string, config?: Partial<NarrativeeConfig>): void {
        if (!apiKey) {
            console.error('Narrativee SDK: API Key is required');
            return;
        }

        this.apiKey = apiKey;

        if (config?.baseUrl) {
            this.baseUrl = config.baseUrl;
        }

        console.log(`Narrativee SDK initialized with Key: ${apiKey.substring(0, 8)}...`);
    }

    /**
     * Identify a user with their plan status and traits
     * @param userId - Unique user identifier
     * @param traits - User attributes including 'plan'
     */
    identify(userId: string, traits: UserTraits): void {
        this.userId = userId;
        this.userTraits = traits;

        console.log(`Narrativee: Identifying user ${userId}`, traits);

        // Send identify event to backend
        if (this.apiKey) {
            this.sendIdentify(userId, traits);
        }
    }

    /**
     * Send identify call to backend to update user profile
     */
    private async sendIdentify(userId: string, traits: UserTraits): Promise<void> {
        try {
            // We reuse the /track endpoint for identification for now, or use a specific /identify if it exists.
            // Looking at backend code, we insert/update user on every track call.
            // But let's verify if we have a dedicated /identify endpoint.
            // We don't have a dedicated /identify endpoint in events.ts yet.
            // So we will trigger a system event 'narrativee_identify'.

            await this.event('narrativee_identify', { ...traits, isSystem: true });

        } catch (err) {
            console.error('Narrativee: Error identifying user:', err);
        }
    }

    /**
     * Update user plan status (e.g., when they upgrade)
     */
    updatePlan(newPlan: string, metadata?: Record<string, any>): void {
        if (!this.userId) {
            console.error('Narrativee: No user identified. Call identify() first.');
            return;
        }

        const oldPlan = this.userTraits?.plan

        // Update local traits
        if (this.userTraits) {
            this.userTraits.plan = newPlan;
        } else {
            this.userTraits = { plan: newPlan };
        }

        // Send plan update event
        this.event('plan_updated', {
            oldPlan,
            newPlan,
            ...metadata
        });
    }

    /**
     * Track an event
     */
    async event(eventName: string, metadata: EventMetadata = {}): Promise<EventResponse | null> {
        if (!this.apiKey) {
            console.error('Narrativee SDK: SDK not initialized. Call narrativee.init() first.');
            return null;
        }

        // Update userId if provided in metadata
        if (metadata.userId) {
            this.userId = metadata.userId;
        }

        const payload = {
            apiKey: this.apiKey, // Legacy support if backend expects it in body
            eventName,
            metadata: { ...metadata, userId: this.userId }, // Ensure userId is in metadata
            userId: this.userId || 'anonymous-user',
            // We pass traits so backend can use them for rules if needed immediately
            userTraits: this.userTraits
        };

        console.log('Narrativee: Sending event...', payload);

        try {
            const response = await fetch(`${this.baseUrl}/api/events/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                body: JSON.stringify(payload)
            });

            const data: EventResponse = await response.json();
            console.log('Narrativee: Event sent!', data);

            // Handle workflow triggers
            if (data.actions && data.actions.length > 0) {
                console.log('Narrativee: Workflow trigger received!', data.actions);
                data.actions.forEach(action => {
                    // 1. Notify Code Listeners (React SDK, etc)
                    this.notifyListeners(action);

                    // 2. Dispatch Window Event (for raw HTML/JS integration)
                    if (typeof window !== 'undefined') {
                        const event = new CustomEvent('narrativee:action', { detail: action });
                        window.dispatchEvent(event);
                    }
                });
            }

            return data;
        } catch (err) {
            console.error('Narrativee: Error sending event:', err);
            return null;
        }
    }

    /**
     * Subscribe to workflow actions programmatically
     */
    on(actionId: string, callback: (action: WorkflowAction) => void): () => void {
        if (!this.listeners.has(actionId)) {
            this.listeners.set(actionId, new Set());
        }

        this.listeners.get(actionId)!.add(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(actionId);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    private notifyListeners(action: WorkflowAction): void {
        // Notify generic listeners (keyed by action ID or wildcards?)
        // For now, let's notify listeners subscribed to the COMPONENT ID (e.g. 'vip-modal')
        // The action comes as { type: 'component', config: { componentId: 'vip-modal' } }

        let targetId = action.id;
        if (action.type === 'component' && action.config?.componentId) {
            targetId = action.config.componentId;
        }

        console.log('[Narrativee SDK] notifyListeners called with action:', action);
        console.log('[Narrativee SDK] Resolved targetId:', targetId);
        console.log('[Narrativee SDK] All registered listeners:', Array.from(this.listeners.keys()));

        const callbacks = this.listeners.get(targetId);
        console.log('[Narrativee SDK] Found callbacks for targetId:', callbacks?.size || 0);

        if (callbacks) {
            callbacks.forEach(callback => callback(action));
        } else {
            console.warn(`[Narrativee SDK] No listeners found for targetId: ${targetId}`);
        }
    }

    /**
     * Track when a user clicks on a popup CTA triggered by a workflow.
     * This enables conversion attribution tracking.
     * @param workflowId - The ID of the workflow that triggered the popup
     * @param componentId - Optional component ID for the popup
     */
    trackPopupClick(workflowId: string, componentId?: string): void {
        this.event('narrativee_popup_clicked', {
            workflowId,
            componentId: componentId || 'unknown',
            isSystem: true
        });
        console.log('[Narrativee SDK] Popup click tracked:', { workflowId, componentId });
    }
}

// Ensure singleton across bundle splits using globalThis
const NARRATIVEE_KEY = '__narrativee_sdk_instance__';

function getGlobalNarrativee(): NarrativeeSDK {
    if (typeof globalThis !== 'undefined') {
        if (!(globalThis as any)[NARRATIVEE_KEY]) {
            (globalThis as any)[NARRATIVEE_KEY] = new NarrativeeSDK();
        }
        return (globalThis as any)[NARRATIVEE_KEY];
    }
    // Fallback for non-globalThis environments
    return new NarrativeeSDK();
}

export const narrativee = getGlobalNarrativee();
export type { NarrativeeSDK };
