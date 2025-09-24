# PocketBase Authentication Setup

This project now includes a fully functional authentication system connected to PocketBase.

## Setup

### 1. PocketBase Server Configuration

Make sure your PocketBase server is running and accessible. Update the URL in:
```
src/config/pocketbase.ts
```

### 2. User Collection

The authentication system expects a `users` collection with the following fields (as per your schema):
- `id`: auto-generated ID
- `email`: user's email address (used for login)
- `password`: user's password (auto-handled by PocketBase)
- `name`: optional user name
- `avatar`: optional user avatar image
- `verified`: email verification status
- `emailVisibility`: email visibility setting
- `created`: creation timestamp
- `updated`: last update timestamp

## Usage

### Authentication Context

The app is wrapped with an `AuthProvider` that provides authentication state throughout the app:

```tsx
import { useAuth } from './src/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  // Use authentication state and methods
}
```

### Login Component

The `Login` component (`src/navigation/screens/auth/Login.tsx`) is now fully functional:

- **Email validation**: Checks for basic email format
- **Form validation**: Ensures all fields are filled
- **Loading states**: Shows spinner during authentication
- **Error handling**: Displays appropriate error messages
- **Success feedback**: Shows success message on login

### PocketBase Service

Direct access to PocketBase functionality is available through:

```tsx
import { pocketbase } from './src/services/pocketbase';

// Check authentication status
const isLoggedIn = pocketbase.isAuthenticated;

// Get current user
const currentUser = pocketbase.currentUser;

// Access PocketBase instance directly for advanced operations
const pb = pocketbase.instance;
```

## Features Implemented

✅ **User Authentication**: Login with email/password
✅ **Persistent Sessions**: Uses AsyncStorage for React Native
✅ **Auth State Management**: React Context for global state
✅ **Type Safety**: Full TypeScript support
✅ **Error Handling**: Comprehensive error management
✅ **Loading States**: UI feedback during operations
✅ **Auto Token Refresh**: Automatic token management

## Next Steps

To extend the authentication system:

1. **Registration**: Create a register component using `pocketbase.instance.collection('users').create()`
2. **Password Reset**: Implement using `pocketbase.instance.collection('users').requestPasswordReset()`
3. **Email Verification**: Use `pocketbase.instance.collection('users').requestVerification()`
4. **Profile Management**: Build user profile editing screens
5. **Navigation Guards**: Protect routes based on authentication status

## Configuration

### Development
- PocketBase URL: `http://127.0.0.1:8090`
- Auth storage: AsyncStorage with key `pb_auth`

### Production
Update `src/config/pocketbase.ts` with your production PocketBase URL.

## Dependencies Added

- `pocketbase`: PocketBase JavaScript SDK
- `@react-native-async-storage/async-storage`: Persistent storage for React Native

## Security Notes

- Tokens are automatically managed by PocketBase SDK
- AsyncStorage is used for secure token persistence
- All API calls are made over HTTPS in production
- PocketBase handles password hashing and security best practices
