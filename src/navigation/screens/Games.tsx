import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Define game mode types
interface GameMode {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instrument: string;
  icon: string;
}

// Available game modes
const GAME_MODES: GameMode[] = [
  {
    id: '1',
    title: 'Pitch Matching Game',
    description: 'Hit 5 random notes consecutively to win!',
    difficulty: 'Beginner',
    instrument: 'Any',
    icon: '🎯',
  },
  {
    id: '2',
    title: 'Melody Memory',
    description: 'Memorize a sequence of notes and sing them back!',
    difficulty: 'Intermediate',
    instrument: 'Any',
    icon: '🧠',
  },
  {
    id: '3',
    title: 'Note Speed Test',
    description: 'Play 20 different notes as fast as you can!',
    difficulty: 'Advanced',
    instrument: 'Any',
    icon: '⚡',
  },
];

interface GameModeItemProps {
  item: GameMode;
  onPress: () => void;
  isSelected: boolean;
}

const GameModeItem: React.FC<GameModeItemProps> = ({ item, onPress, isSelected }) => {
  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return {
          borderColor: '#4CAF50',
          backgroundColor: '#e8f5e9',
        };
      case 'Intermediate':
        return {
          borderColor: '#FFC107', // Amber
          backgroundColor: '#fff8e1',
        };
      case 'Advanced':
        return {
          borderColor: '#F44336', // Red
          backgroundColor: '#ffebee',
        };
      default:
        return {};
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.gameMode,
        getDifficultyStyle(item.difficulty),
        isSelected && styles.selectedGameMode,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.gameModeContent}>
        <Text style={styles.gameModeIcon}>{item.icon}</Text>
        <View style={styles.gameModeInfo}>
          <Text style={styles.gameModeTitle}>{item.title}</Text>
          <Text style={styles.gameModeDescription}>{item.description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export function Games() {
  const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);
  const navigation = useNavigation();

  const handleGameModeSelect = (gameModeId: string) => {
    setSelectedGameMode(gameModeId);
  };

  const handleStartGame = () => {
    if (!selectedGameMode) {
      Alert.alert('No Game Mode Selected', 'Please select a game mode to start playing!');
      return;
    }

    const selectedMode = GAME_MODES.find(mode => mode.id === selectedGameMode);
    if (selectedMode) {
      // Navigate to GamePitch for the Pitch Matching Game
      if (selectedMode.id === '1') {
        navigation.navigate('GamePitch' as never);
      }
      if (selectedMode.id === '2') {
        navigation.navigate('GameMemory' as never);
      }
      if (selectedMode.id === '3') {
        navigation.navigate('GameSpeed' as never);
      }
    }
  };

  const renderGameMode = ({ item }: { item: GameMode }) => (
    <GameModeItem
      item={item}
      onPress={() => handleGameModeSelect(item.id)}
      isSelected={selectedGameMode === item.id}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <FlatList
        data={GAME_MODES}
        renderItem={renderGameMode}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.startButton,
            !selectedGameMode && styles.startButtonDisabled
          ]}
          onPress={handleStartGame}
          disabled={!selectedGameMode}
        >
          <Text style={[
            styles.startButtonText,
            !selectedGameMode && styles.startButtonTextDisabled
          ]}>
            Start Game
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Space for the footer button
  },
  gameMode: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedGameMode: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  gameModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameModeIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  gameModeInfo: {
    flex: 1,
  },
  gameModeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  gameModeDescription: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  startButtonTextDisabled: {
    color: '#ffffff',
  },
});