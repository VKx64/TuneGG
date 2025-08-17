import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getTitleAndRank, formatExperience } from '../utils/rankingUtils';

interface RankDisplayProps {
  experience: number;
  showProgress?: boolean;
  compact?: boolean;
}

/**
 * Reusable component to display user rank information
 * Can be used throughout the app to show user's current rank
 */
export const RankDisplay: React.FC<RankDisplayProps> = ({
  experience,
  showProgress = true,
  compact = false
}) => {
  const rankInfo = getTitleAndRank(experience);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.compactBadge, { backgroundColor: rankInfo.current.bgColor }]}>
          <Text style={[styles.compactTitle, { color: rankInfo.current.color }]}>
            {rankInfo.current.title}
          </Text>
        </View>
        <Text style={styles.compactExp}>{formatExperience(experience)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.rankBadge, { backgroundColor: rankInfo.current.bgColor }]}>
        <Text style={[styles.rankTitle, { color: rankInfo.current.color }]}>
          {rankInfo.current.title}
        </Text>
      </View>

      <Text style={styles.experienceText}>
        {formatExperience(experience)}
      </Text>

      {showProgress && rankInfo.next && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${rankInfo.progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(rankInfo.progress)}%
          </Text>
        </View>
      )}

      {showProgress && rankInfo.next && (
        <Text style={styles.nextRankText}>
          Next: <Text style={[styles.nextRankTitle, { color: rankInfo.next.color }]}>
            {rankInfo.next.title}
          </Text>
          {` (${rankInfo.next.minExp - experience} XP to go)`}
        </Text>
      )}

      {showProgress && !rankInfo.next && (
        <Text style={styles.maxRankText}>🏆 Maximum Rank!</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 15,
  },
  rankBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  rankTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  experienceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    minWidth: 35,
  },
  nextRankText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  nextRankTitle: {
    fontWeight: 'bold',
  },
  maxRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  compactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  compactExp: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
