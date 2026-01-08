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
        <div>
                   {children}
        </div>

    );
}
