import React, { useEffect, useState, cloneElement, isValidElement } from 'react';
import { narrativee } from './index';
import { WorkflowAction } from './types/types';

interface NarrativeeTriggerProps {
    id: string; // The ID of the component in Narrativee workflow (e.g. "vip-modal")
    /**
     * The component to render when triggered.
     * Can be a React element or a render function that receives { onCtaClick, payload, dismiss }.
     */
    children: React.ReactElement | ((props: {
        onCtaClick: () => void;
        payload: any;
        dismiss: () => void;
    }) => React.ReactElement);
}

/**
 * A wrapper that only renders the component when Narrativee triggers it.
 * Automatically tracks popup impressions and provides an onCtaClick handler for attribution.
 */
export const NarrativeeTrigger: React.FC<NarrativeeTriggerProps> = ({ id, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [payload, setPayload] = useState<any>(null);
    const [workflowId, setWorkflowId] = useState<string | null>(null);

    useEffect(() => {
        // Subscribe to the action ID
        const unsubscribe = narrativee.on(id, (action: WorkflowAction) => {
            console.log(`[Narrativee React] Component ${id} triggered!`, action);
            setIsVisible(true);
            setPayload(action.config || action.payload); // config from backend, payload for backwards compat
            setWorkflowId(action.workflowId || null);
        });

        return () => {
            unsubscribe();
        };
    }, [id]);

    // Handler for CTA clicks - automatically tracks popup attribution
    const handleCtaClick = () => {
        if (workflowId) {
            narrativee.trackPopupClick(workflowId, id);
        }
    };

    // Dismiss the popup
    const dismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    // If children is a function, call it with props
    if (typeof children === 'function') {
        return children({ onCtaClick: handleCtaClick, payload, dismiss });
    }

    // If children is a React element, clone it and inject the handlers
    if (isValidElement(children)) {
        return cloneElement(children, {
            onCtaClick: handleCtaClick,
            onDismiss: dismiss,
            payload,
        } as any);
    }

    return null;
};

/**
 * Hook to access SDK functionality
 */
export const useNarrativee = () => {
    return narrativee;
};
