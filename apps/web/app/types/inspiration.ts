// Type definitions for the Inspiration feature

export interface InspirationNote {
    id: string;
    content: string;
    author: {
        name: string;
        handle?: string;
        avatar?: string;
        publicationName?: string;
    };
    engagement: {
        likes: number;
        restacks: number;
        comments: number;
    };
    url: string;
    savedAt: string; // ISO timestamp
    tags: string[];
    notes?: string; // User's personal notes about why they saved it
    source: 'extension' | 'manual';
}

export interface InspirationFilters {
    sortBy: 'newest' | 'most-liked' | 'most-restacked' | 'most-commented' | 'total-engagement';
    searchQuery: string;
    tags: string[];
}

export type SortOption = InspirationFilters['sortBy'];
