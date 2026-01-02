'use client';

import { useCallback } from 'react';

interface TrackEventParams {
    eventName: string;
    eventData?: {
        value?: number;
        currency?: string;
        items?: Array<{
            item_id: string;
            item_name: string;
            item_category?: string;
            price?: number;
            quantity?: number;
        }>;
        [key: string]: any;
    };
}

interface TrackPageViewParams {
    pageTitle: string;
    pagePath: string;
}

export const useGTMTracking = () => {

    /**
     * Universal helper to push to dataLayer
     * Using dataLayer.push is more compatible with 3rd-party tags (like Reddit)
     * compared to the generic gtag('event', ...) wrapper.
     */
    const pushToDataLayer = useCallback((data: Record<string, any>) => {
        if (typeof window !== 'undefined' && (window as any).dataLayer) {
            (window as any).dataLayer.push(data);
        }
    }, []);

    // Track custom events
    const trackEvent = useCallback(({ eventName, eventData = {} }: TrackEventParams) => {
        pushToDataLayer({
            event: eventName,
            ...eventData
        });
    }, [pushToDataLayer]);

    // Track page views
    const trackPageView = useCallback(({ pageTitle, pagePath }: TrackPageViewParams) => {
        pushToDataLayer({
            event: 'page_view',
            page_title: pageTitle,
            page_location: typeof window !== 'undefined' ? window.location.href : '',
            page_path: pagePath
        });
    }, [pushToDataLayer]);

    // Track item selection (for pricing plans, products, etc.)
    const trackItemSelection = useCallback((
        itemName: string,
        price: number,
        currency: string = 'USD',
        category?: string
    ) => {
        // Clear previous ecommerce object (Google/Reddit best practice)
        pushToDataLayer({ ecommerce: null });

        // Push GA4 standard ecommerce event
        pushToDataLayer({
            event: 'select_item',
            ecommerce: {
                currency,
                value: price,
                items: [{
                    item_id: itemName.toLowerCase().replace(/\s+/g, '_'),
                    item_name: itemName,
                    item_category: category || 'Subscription',
                    price
                }]
            }
        });
    }, [pushToDataLayer]);

    // Track purchases
    const trackPurchase = useCallback((
        transactionId: string,
        value: number,
        currency: string = 'USD',
        items: Array<{
            item_id: string;
            item_name: string;
            price: number;
            quantity: number;
            item_category?: string;
        }>,
        userEmail?: string,
        userPhone?: string
    ) => {
        // Clear previous ecommerce object
        pushToDataLayer({ ecommerce: null });

        // Push GA4 standard ecommerce purchase event
        pushToDataLayer({
            event: 'purchase',
            // User data at top level for Reddit/Attribution matching
            user_data: {
                ...(userEmail && { email_address: userEmail }),
                ...(userPhone && { phone_number: userPhone })
            },
            ecommerce: {
                transaction_id: transactionId,
                value,
                currency,
                items
            }
        });
    }, [pushToDataLayer]);

    // Track sign ups
    const trackSignUp = useCallback((method?: string) => {
        pushToDataLayer({
            event: 'sign_up',
            method: method || 'email'
        });
    }, [pushToDataLayer]);

    return {
        trackEvent,
        trackPageView,
        trackItemSelection,
        trackPurchase,
        trackSignUp
    };
};

// Type declaration
declare global {
    interface Window {
        dataLayer?: Object[];
        gtag: (
            command: string,
            targetId: string,
            config?: Record<string, any>
        ) => void;
    }
}
