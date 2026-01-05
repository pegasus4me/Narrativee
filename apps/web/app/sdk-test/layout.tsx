import { NarrativeeProvider } from "./NarrativeeProvider";

/**
 * SDK Demo Layout
 * 
 * Cleanest Integration Pattern:
 * Wraps the entire application with the NarrativeeProvider.
 * This handles initialization and user identification automatically.
 */
export default function SDKDemoLayout({ children }: { children: React.ReactNode }) {
    return (
        <NarrativeeProvider apiKey="nr-live-a76b2c29-16c4-4324-a092-a09fb0beb26a">
            {children}
        </NarrativeeProvider>
    );
}
