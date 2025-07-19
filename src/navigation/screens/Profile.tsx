import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { pocketbase } from '../../services/pocketbase';

export function Profile() {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const getAvatarUrl = (user: any, filename: string) => {
    if (!filename) return null;
    try {
      return pocketbase.client.files.getUrl(user, filename, { thumb: '100x100' });
    } catch (error) {
      console.error('Error generating avatar URL:', error);
      return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No user data found</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const avatarUrl = user.avatar ? getAvatarUrl(user, user.avatar) : null;

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user.name || 'No name set'}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          <View style={styles.verificationBadge}>
            <Text style={[styles.verificationText, user.verified && styles.verifiedText]}>
              {user.verified ? '✓ Verified' : '! Not Verified'}
            </Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>User ID:</Text>
            <Text style={styles.detailValue}>{user.id}</Text>
          </View>

          {typeof user.experience === 'number' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Experience:</Text>
              <Text style={styles.detailValue}>{user.experience}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Member since:</Text>
            <Text style={styles.detailValue}>{formatDate(user.created)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last updated:</Text>
            <Text style={styles.detailValue}>{formatDate(user.updated)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email visibility:</Text>
            <Text style={styles.detailValue}>
              {user.emailVisibility ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#ff3333',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  verificationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  verifiedText: {
    color: '#51cf66',
  },
  detailsSection: {
    marginBottom: 25,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
