import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { pocketbase } from '../../../services/pocketbase';
import { getTitleAndRank, formatExperience, RANKS } from '../../../utils/rankingUtils';

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
      return pocketbase.client.files.getURL(user, filename, { thumb: '100x100' });
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
  const userExperience = user.experience || 0;
  const rankInfo = getTitleAndRank(userExperience);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Section with Avatar */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <View style={styles.greetingText}>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.username}>
                {user.name || user.email.split('@')[0]}
              </Text>
            </View>
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
          </View>
        </View>

        {/* Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>My level</Text>
            <Text style={styles.levelValue}>{formatExperience(userExperience)}</Text>
          </View>
          <View style={styles.levelProgress}>
            <View style={styles.progressRing}>
              <Text style={styles.progressNumber}>
                {RANKS.findIndex(rank => rank.title === rankInfo.current.title) + 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userExperience}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {RANKS.findIndex(rank => rank.title === rankInfo.current.title) + 1}
            </Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Current Rank Display */}
        <View style={styles.rankCard}>
          <Text style={styles.rankCardTitle}>Current Rank</Text>
          <Text style={[styles.rankName, { color: rankInfo.current.color }]}>
            {rankInfo.current.title}
          </Text>

          {rankInfo.next && (
            <>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${rankInfo.progress}%` }]}
                  />
                </View>
                <Text style={styles.progressPercentage}>
                  {Math.round(rankInfo.progress)}%
                </Text>
              </View>
              <Text style={styles.nextRankText}>
                {rankInfo.next.minExp - userExperience} XP to <Text style={styles.nextRankName}>{rankInfo.next.title}</Text>
              </Text>
            </>
          )}

          {!rankInfo.next && (
            <Text style={styles.maxRankText}>Maximum rank achieved! 🎉</Text>
          )}
        </View>

        {/* Profile Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Profile Information</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{user.email}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, user.verified ? styles.verified : styles.unverified]}>
              {user.verified ? 'Verified' : 'Not Verified'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Member Since</Text>
            <Text style={styles.detailValue}>{formatDate(user.created)}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Email Visibility</Text>
            <Text style={styles.detailValue}>
              {user.emailVisibility ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  greetingSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    paddingTop: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f0f0f0',
  },
  avatarText: {
    color: '#000',
    fontSize: 28,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 32,
    color: '#000',
    fontWeight: '300',
    lineHeight: 40,
  },
  username: {
    fontSize: 32,
    color: '#000',
    fontWeight: '600',
    lineHeight: 40,
  },
  levelCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
  levelProgress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 20,
    color: '#000',
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    color: '#000',
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 15,
  },
  rankCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rankCardTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  rankName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    minWidth: 35,
  },
  nextRankText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  nextRankName: {
    fontWeight: '600',
    color: '#000',
  },
  maxRankText: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  verified: {
    color: '#4CAF50',
  },
  unverified: {
    color: '#FF9800',
  },
  logoutButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
  },
  errorText: {
    fontSize: 18,
    color: '#ff3333',
    textAlign: 'center',
  },
});
