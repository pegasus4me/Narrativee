
import { reportApi } from "../apis";
import { API_URL } from "../api-config";
import axios from "axios";

export interface Post {
    id: string;
    title: string;
    url: string;
    publishedAt: string;
    views: number;
    openRate: number;
    likes: number;
    comments: number;
    lastSyncedAt: string;
}

export interface Stats {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    avgOpenRate: number;
    postCount: number;
}

export const PostsAPI = {
    /**
     * Get all posts
     */
    getPosts: async (): Promise<Post[]> => {
        try {
            const response = await axios.get(`${API_URL}/posts`, { withCredentials: true });
            return response.data.posts;
        } catch (error) {
            console.error("Failed to fetch posts:", error);
            throw error;
        }
    },

    /**
     * Get aggregated stats
     */
    getStats: async (): Promise<Stats> => {
        try {
            const response = await axios.get(`${API_URL}/posts/stats`, { withCredentials: true });
            return response.data.stats;
        } catch (error) {
            console.error("Failed to fetch stats:", error);
            throw error;
        }
    },

    /**
     * Sync posts from extension data
     */
    syncPosts: async (posts: any[]): Promise<any> => {
        try {
            const response = await axios.post(`${API_URL}/posts/sync-extension`, { posts }, { withCredentials: true });
            return response.data;
        } catch (error) {
            console.error("Failed to sync posts:", error);
            throw error;
        }
    }
};

export interface Note {
    id: string;
    contentPreview: string;
    url: string;
    publishedAt: string;
    likes: number;
    comments: number;
    restacks: number;
    lastSyncedAt: string;
}

export interface NoteStats {
    totalLikes: number;
    totalComments: number;
    totalRestacks: number;
    noteCount: number;
}

export const NotesAPI = {
    getNotes: async (): Promise<Note[]> => {
        const response = await axios.get(`${API_URL}/notes`, { withCredentials: true });
        return response.data.notes;
    },

    getNoteStats: async (): Promise<NoteStats> => {
        const response = await axios.get(`${API_URL}/notes/stats`, { withCredentials: true });
        return response.data.stats;
    },

    syncNotes: async (notes: any[]): Promise<any> => {
        const response = await axios.post(`${API_URL}/notes/sync-extension`, { notes }, { withCredentials: true });
        return response.data;
    },

    clearNotes: async (): Promise<any> => {
        const response = await axios.delete(`${API_URL}/notes`, { withCredentials: true });
        return response.data;
    }
};

