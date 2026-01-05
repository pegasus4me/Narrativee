export interface NarrativeeConfig {
    apiKey: string;
    baseUrl?: string;
}

export interface UserTraits {
    // Flexible Plan: "Free", "Pro", "Enterprise", "Growth", etc.
    plan?: string;
    email?: string;
    name?: string;
    trialEndsAt?: string | Date;
    // Allow any other custom traits (role, company_size, etc.)
    [key: string]: any;
}

export interface EventMetadata {
    userId?: string;
    [key: string]: any;
}

export interface WorkflowAction {
    id: string;
    type: string;
    payload: any;
    config?: any; // For backward compatibility with 'config' in backend
    workflowId?: string; // For popup click attribution
}

export interface EventResponse {
    success: boolean;
    trigger?: boolean;
    actions?: WorkflowAction[];
}
