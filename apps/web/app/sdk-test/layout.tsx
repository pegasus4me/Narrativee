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
        <NarrativeeProvider apiKey="nr-live-11eaf097-2cb0-4e3b-9e38-d61b131d1620">
            {children}
        </NarrativeeProvider>
    );
}
