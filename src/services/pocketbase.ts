import PocketBase from 'pocketbase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AsyncAuthStore } from 'pocketbase';
import { POCKETBASE_CONFIG } from '../config/pocketbase';

// Configure async auth store for React Native
const store = new AsyncAuthStore({
    save: async (serialized) => AsyncStorage.setItem('pb_auth', serialized),
    initial: AsyncStorage.getItem('pb_auth'),
});

// Initialize PocketBase client
const pb = new PocketBase(POCKETBASE_CONFIG.url, store);

// Types based on your database schema
export interface User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    verified: boolean;
    created: string;
    updated: string;
    emailVisibility?: boolean;
}

export interface AuthResponse {
    token: string;
    record: User;
}

export class PocketBaseService {
    private client = pb;

    // Authentication methods
    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            const authData = await this.client.collection('users').authWithPassword(email, password);
            return {
                token: authData.token,
                record: authData.record as unknown as User
            };
        } catch (error: any) {
            throw new Error(error.message || 'Login failed');
        }
    }

    async logout(): Promise<void> {
        this.client.authStore.clear();
    }

    // Check if user is authenticated
    get isAuthenticated(): boolean {
        return this.client.authStore.isValid;
    }

    // Get current user
    get currentUser(): User | null {
        return this.client.authStore.record as unknown as User | null;
    }

    // Get auth token
    get token(): string {
        return this.client.authStore.token;
    }

    // Listen for auth changes
    onAuthChange(callback: (token: string, record: User | null) => void): () => void {
        return this.client.authStore.onChange((token, record) => {
            callback(token, record as unknown as User | null);
        });
    }

    // Get the PocketBase client instance for direct access if needed
    get instance() {
        return this.client;
    }
}

// Export a singleton instance
export const pocketbase = new PocketBaseService();
