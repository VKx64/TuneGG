import PocketBase, { AsyncAuthStore } from 'pocketbase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventSource from 'react-native-sse';

// Configure EventSource polyfill for React Native realtime subscriptions
(global as any).EventSource = EventSource;

// Configure async auth store for React Native
const store = new AsyncAuthStore({
    save: async (serialized) => AsyncStorage.setItem('pb_auth', serialized),
    initial: AsyncStorage.getItem('pb_auth'),
});

// Get PocketBase URL from environment variables
const POCKETBASE_URL = process.env.EXPO_PUBLIC_POCKETBASE_URL;

if (!POCKETBASE_URL) {
    throw new Error(
        'EXPO_PUBLIC_POCKETBASE_URL environment variable is required. ' +
        'Please check your .env file or environment configuration.'
    );
}

// Initialize PocketBase client
const pb = new PocketBase(POCKETBASE_URL, store);

// User type based on PocketBase auth records
export interface User {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    verified: boolean;
    emailVisibility?: boolean;
    experience?: number;
    created: string;
    updated: string;
}

// Simplified PocketBase service
export const pocketbase = {
    // Authentication methods
    async login(email: string, password: string) {
        return await pb.collection('users').authWithPassword(email, password);
    },

    async register(email: string, password: string, passwordConfirm: string, name?: string) {
        return await pb.collection('users').create({
            email,
            password,
            passwordConfirm,
            name,
        });
    },

    async logout() {
        pb.authStore.clear();
    },

    // Auth state getters
    get isAuthenticated() {
        return pb.authStore.isValid;
    },

    get currentUser() {
        return pb.authStore.record as User | null;
    },

    get token() {
        return pb.authStore.token;
    },

    // Auth change listener
    onAuthChange(callback: (token: string, record: User | null) => void) {
        return pb.authStore.onChange((token, record) => {
            callback(token, record as User | null);
        });
    },

    // User experience methods
    async updateUserExperience(userId: string, experienceToAdd: number) {
        const currentUser = await pb.collection('users').getOne(userId);
        const currentExperience = currentUser.experience || 0;
        const newExperience = currentExperience + experienceToAdd;

        return await pb.collection('users').update(userId, {
            experience: newExperience
        });
    },

    async getUserExperience(userId: string): Promise<number> {
        const user = await pb.collection('users').getOne(userId);
        return user.experience || 0;
    },

    // Direct access to PocketBase instance
    get client() {
        return pb;
    }
};
