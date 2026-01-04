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
        <NarrativeeProvider apiKey="nr-live-a969db13-6a4e-42c4-825e-9101a32dffe8">
            {children}
        </NarrativeeProvider>
    );
}
