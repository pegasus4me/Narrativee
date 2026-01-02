import React, { useEffect, useState } from 'react';
import { narrativee } from './index';
import { WorkflowAction } from './types/types';

interface NarrativeeTriggerProps {
    id: string; // The ID of the component in Narrativee workflow (e.g. "vip-modal")
    component: React.ReactNode;
}

/**
 * A wrapper that only renders the component when Narrativee triggers it.
 */
export const NarrativeeTrigger: React.FC<NarrativeeTriggerProps> = ({ id, component }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [payload, setPayload] = useState<any>(null);

    useEffect(() => {
        // Subscribe to the action ID
        const unsubscribe = narrativee.on(id, (action: WorkflowAction) => {
            console.log(`[Narrativee React] Component ${id} triggered!`, action);
            setIsVisible(true);
            setPayload(action.payload);
        });

        return () => {
            unsubscribe();
        };
    }, [id]);

    if (!isVisible) return null;

    // We can inject payload into the component if it accepts it
    // For now, we just render the component as is
    return (
        <>
            {component}
        </>
    );
};

/**
 * Hook to access SDK functionality
 */
export const useNarrativee = () => {
    return narrativee;
};
