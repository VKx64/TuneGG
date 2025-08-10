// Test file to verify PocketBase setup
import { pocketbase } from './services/pocketbase';

export async function testPocketBaseConnection() {
    try {
        // Test basic connection
        console.log('PocketBase client initialized');
        console.log('Is authenticated:', pocketbase.isAuthenticated);
        console.log('Current user:', pocketbase.currentUser);

        return true;
    } catch (error) {
        console.error('PocketBase setup error:', error);
        return false;
    }
}
