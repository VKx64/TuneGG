import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface RouteParams {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  notes: string[];
  title: string;
}

export function LessonNotes() {
  const route = useRoute();
  const navigation = useNavigation();
  const { difficulty, notes, title } = route.params as RouteParams;

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'Easy':
        return '#4CAF50';
      case 'Medium':
        return '#FFC107';
      case 'Hard':
        return '#F44336';
      default:
        return '#4ECDC4';
    }
  };

  const handleNoteSelect = (note: string) => {
    (navigation as any).navigate('LessonNote', { note });
  };

  const getDifficultyDescription = () => {
    switch (difficulty) {
      case 'Easy':
        return 'Perfect for beginners! These are the most common notes in music.';
      case 'Medium':
        return 'Ready for the next step? These notes require a bit more precision.';
      case 'Hard':
        return 'Master level! Sharp notes that will challenge your ear training.';
      default:
        return 'Learn these notes to improve your musical skills.';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: getDifficultyColor() }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{getDifficultyDescription()}</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {notes.length} notes to learn
              </Text>
            </View>
          </View>
        </View>

        {/* Notes Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select a Note to Learn</Text>
          <View style={styles.notesGrid}>
            {notes.map((note, index) => (
              <TouchableOpacity
                key={note}
                style={[
                  styles.noteCard,
                  { backgroundColor: getDifficultyColor() }
                ]}
                onPress={() => handleNoteSelect(note)}
                activeOpacity={0.7}
              >
                <View style={styles.noteNumber}>
                  <Text style={styles.noteNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.noteName}>{note}</Text>
                <Text style={styles.noteSubtitle}>
                  {note.includes('#') ? 'Sharp Note' : 'Natural Note'}
                </Text>
                <View style={styles.startButton}>
                  <Text style={styles.startButtonText}>Start Learning</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tip}>
              <Text style={styles.tipIcon}>🎧</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Listen First</Text>
                <Text style={styles.tipText}>
                  Always listen to the voice guide before attempting to sing
                </Text>
              </View>
            </View>

            <View style={styles.tip}>
              <Text style={styles.tipIcon}>🎵</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Practice Regularly</Text>
                <Text style={styles.tipText}>
                  Consistent practice is key to developing your pitch accuracy
                </Text>
              </View>
            </View>

            <View style={styles.tip}>
              <Text style={styles.tipIcon}>🎯</Text>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Take Your Time</Text>
                <Text style={styles.tipText}>
                  Don't rush - focus on accuracy over speed
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Practice All Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.practiceAllButton, { backgroundColor: getDifficultyColor() }]}
            onPress={() => {
              // Navigate to practice mode for all notes in this difficulty
              console.log('Starting practice for all notes:', notes);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.practiceAllButtonText}>
              Practice All {difficulty} Notes
            </Text>
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
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 15,
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  notesGrid: {
    gap: 15,
  },
  noteCard: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noteNumber: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noteName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  noteSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  practiceAllButton: {
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  practiceAllButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 50,
  },
});