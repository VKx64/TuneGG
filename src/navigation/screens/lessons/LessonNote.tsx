import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface RouteParams {
  note: string;
}

// Map notes to their corresponding image files
const getNotePairImages = (note: string): { male: any; female: any } => {
  const noteMap: { [key: string]: { male: any; female: any } } = {
    'A': {
      male: require('../../../assets/lessons/AMale.jpg'),
      female: require('../../../assets/lessons/AFemale.png'),
    },
    'A#': {
      male: require('../../../assets/lessons/ASHARPMale.jpg'),
      female: require('../../../assets/lessons/ASHARPFemale.png'),
    },
    'B': {
      male: require('../../../assets/lessons/BMale.jpg'),
      female: require('../../../assets/lessons/BFemale.png'),
    },
    'C': {
      male: require('../../../assets/lessons/CMale.jpg'),
      female: require('../../../assets/lessons/CFemale.png'),
    },
    'C#': {
      male: require('../../../assets/lessons/CSHARPMale.jpg'),
      female: require('../../../assets/lessons/CSHARPFemale.png'),
    },
    'D': {
      male: require('../../../assets/lessons/DMale.jpg'),
      female: require('../../../assets/lessons/DFemale.png'),
    },
    'D#': {
      male: require('../../../assets/lessons/DSHARPMale.jpg'),
      female: require('../../../assets/lessons/DSHARPFemale.png'),
    },
    'E': {
      male: require('../../../assets/lessons/EMale.jpg'),
      female: require('../../../assets/lessons/EFemale.png'),
    },
    'F': {
      male: require('../../../assets/lessons/FMale.jpg'),
      female: require('../../../assets/lessons/FFemale.png'),
    },
    'F#': {
      male: require('../../../assets/lessons/FSHARPMale.jpg'),
      female: require('../../../assets/lessons/FSHARPFemale.png'),
    },
    'G': {
      male: require('../../../assets/lessons/GMale.jpg'),
      female: require('../../../assets/lessons/GFemale.png'),
    },
    'G#': {
      male: require('../../../assets/lessons/GSHARPMale.jpg'),
      female: require('../../../assets/lessons/GSHARPFemale.png'),
    },
  };

  return noteMap[note] || { male: null, female: null };
};

export function LessonNote() {
  const route = useRoute();
  const navigation = useNavigation();
  const { note } = route.params as RouteParams;

  const [isPlaying, setIsPlaying] = useState(false);

  const playGuideAudio = async () => {
    try {
      setIsPlaying(true);

      // For now, we'll show an alert. In a real implementation,
      // you would load and play audio files for each note
      Alert.alert(
        'Note Guide',
        `Playing ${note} note guide`,
        [{ text: 'OK', onPress: () => setIsPlaying(false) }]
      );

      // Simulate audio playing
      setTimeout(() => {
        setIsPlaying(false);
      }, 2000);

    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const startPractice = () => {
    Alert.alert(
      'Start Practice',
      `Ready to practice the ${note} note? Listen to the guide first, then try to sing the same note!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Practice', onPress: () => {
          // Navigate to practice mode or start pitch detection
          console.log('Starting practice for note:', note);
        }}
      ]
    );
  };

  const getDifficultyInfo = (note: string) => {
    if (['A', 'C', 'D', 'E', 'G'].includes(note)) {
      return { level: 'Easy', color: '#4CAF50' };
    } else if (['B', 'F'].includes(note)) {
      return { level: 'Medium', color: '#FFC107' };
    } else {
      return { level: 'Hard', color: '#F44336' };
    }
  };

  const difficultyInfo = getDifficultyInfo(note);
  const noteImages = getNotePairImages(note);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.noteTitle}>Note {note}</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyInfo.color }]}>
              <Text style={styles.difficultyText}>{difficultyInfo.level}</Text>
            </View>
          </View>
        </View>

        {/* Note Guide Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note Guide</Text>
          <View style={styles.imageContainer}>
            {/* First Guide Image */}
            <View style={styles.guideCard}>
              <Text style={styles.guideLabel}>Guide 1</Text>
              {noteImages.male && (
                <Image
                  source={noteImages.male}
                  style={styles.guideImage}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Second Guide Image */}
            <View style={styles.guideCard}>
              <Text style={styles.guideLabel}>Guide 2</Text>
              {noteImages.female && (
                <Image
                  source={noteImages.female}
                  style={styles.guideImage}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>

          {/* Play Guide Button */}
          <TouchableOpacity
            style={[
              styles.playButton,
              isPlaying && styles.playButtonActive
            ]}
            onPress={playGuideAudio}
            disabled={isPlaying}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? '🔊 Playing Guide...' : '▶️ Play Note Guide'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Practice</Text>
          <View style={styles.instructionsCard}>
            <View style={styles.instruction}>
              <Text style={styles.instructionStep}>1.</Text>
              <Text style={styles.instructionText}>Listen to the voice guide carefully</Text>
            </View>
            <View style={styles.instruction}>
              <Text style={styles.instructionStep}>2.</Text>
              <Text style={styles.instructionText}>Try to match the pitch with your voice</Text>
            </View>
            <View style={styles.instruction}>
              <Text style={styles.instructionStep}>3.</Text>
              <Text style={styles.instructionText}>Practice until you can hit the note consistently</Text>
            </View>
          </View>
        </View>

        {/* Practice Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.practiceButton}
            onPress={startPractice}
            activeOpacity={0.7}
          >
            <Text style={styles.practiceButtonText}>Start Practice Session</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },

  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  guideCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guideLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  guideImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 15,
  },
  playButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  instructionStep: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
    width: 30,
  },
  instructionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  practiceButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  practiceButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 50,
  },
});