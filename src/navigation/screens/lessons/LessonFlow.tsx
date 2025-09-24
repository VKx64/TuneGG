import React, { useEffect, useState } from 'react';
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
import { AudioModule } from 'expo-audio';
import MicrophoneStreamModule, { AudioBuffer } from '../../../../modules/microphone-stream';
import DSPModule from '../../../../specs/NativeDSPModule';
import { checkAndAwardLessonAchievement, DifficultyLevel, getAchievementTitle, getAchievementDescription } from '../../../utils/lessonAchievements';

const { width } = Dimensions.get('window');

// Pitch detection parameters
const BUF_SIZE = 9000;
const MIN_FREQ = 30;
const MAX_FREQ = 500;
const THRESHOLD_DEFAULT = 0.15;

// Note conversion utilities
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export type NoteName = (typeof NOTE_NAMES)[number];
export type Note = { name: NoteName };

interface RouteParams {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  notes: string[];
  title: string;
}

/**
 * Get nearest note name from a given frequency.
 */
function getNoteFromFreq(frequency: number): Note | undefined {
  if (frequency <= 0) return undefined;

  const a4_frequency = 440;
  const semitonesFromA4 = 12 * Math.log2(frequency / a4_frequency);
  const semitonesFromC4 = Math.round(semitonesFromA4 + 9);
  const noteIndex = ((semitonesFromC4 % 12) + 12) % 12;

  return { name: NOTE_NAMES[noteIndex] };
}

/**
 * Calculate cents deviation from the nearest note
 */
function getNoteCents(frequency: number): number {
  if (frequency <= 0) return 0;

  const a4_frequency = 440;
  const semitonesFromA4 = 12 * Math.log2(frequency / a4_frequency);
  const roundedSemitonesFromA4 = Math.round(semitonesFromA4);
  const nearestNoteFreq = a4_frequency * Math.pow(2, roundedSemitonesFromA4 / 12);
  const cents = 1200 * Math.log2(frequency / nearestNoteFreq);

  return Math.round(cents);
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

export function LessonFlow() {
  const route = useRoute();
  const navigation = useNavigation();
  const { difficulty, notes, title } = route.params as RouteParams;

  // Audio and pitch detection states
  const [micAccess, setMicAccess] = useState<"pending" | "granted" | "denied">("pending");
  const [isRecording, setIsRecording] = useState(false);
  const [sampleRate, setSampleRate] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<number[]>(() => new Array(BUF_SIZE).fill(0));
  const [bufferId, setBufferId] = useState(0);
  const [pitch, setPitch] = useState(-1);
  const [detectedNote, setDetectedNote] = useState<Note | undefined>(undefined);
  const [cents, setCents] = useState<number>(0);

  // Lesson state
  const [lessonState, setLessonState] = useState<'ready' | 'learning' | 'listening' | 'success' | 'completed'>('ready');
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [completedNotes, setCompletedNotes] = useState<boolean[]>(new Array(notes.length).fill(false));
  const [attempts, setAttempts] = useState(0);

  const currentNote = notes[currentNoteIndex];
  const noteImages = getNotePairImages(currentNote);

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

  // Request microphone permission
  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (status.granted) {
          console.log("Granted microphone permission");
          setMicAccess("granted");
        } else {
          setMicAccess("denied");
          Alert.alert("Microphone access denied", "Please enable microphone access to take lessons.");
        }
      } catch (error) {
        console.error("Error requesting microphone permission:", error);
        setMicAccess("denied");
      }
    })();
  }, []);

  // Get pitch of the audio
  useEffect(() => {
    if (!audioBuffer.length || micAccess !== "granted" || !isRecording) return;

    // Set sampleRate after first audio buffer
    let sr = sampleRate;
    if (!sr) {
      sr = MicrophoneStreamModule.getSampleRate();
      setSampleRate(sr);
    }

    // Estimate pitch using DSP module
    const detectedPitch = DSPModule.pitch(audioBuffer, sr, MIN_FREQ, MAX_FREQ, THRESHOLD_DEFAULT);
    setPitch(detectedPitch);

    // Convert pitch to note
    const note = getNoteFromFreq(detectedPitch);
    const noteCents = getNoteCents(detectedPitch);
    setDetectedNote(note);
    setCents(noteCents);
  }, [audioBuffer, sampleRate, micAccess, isRecording, bufferId]);

  // Check if detected note matches target note
  useEffect(() => {
    if (lessonState !== 'listening' || !detectedNote) return;

    const targetNoteName = currentNote as NoteName;
    const isMatch = detectedNote.name === targetNoteName;
    const isInTune = Math.abs(cents) <= 30; // Allow 30 cents tolerance for lessons

    if (isMatch && isInTune) {
      // Note matched successfully
      stopRecording();

      // Update completed notes
      const newCompletedNotes = [...completedNotes];
      newCompletedNotes[currentNoteIndex] = true;
      setCompletedNotes(newCompletedNotes);

      // Move directly to next note or complete lesson
      if (currentNoteIndex + 1 >= notes.length) {
        setLessonState('completed');

        // Check and award achievement for completing the difficulty level
        checkAndAwardLessonAchievement(difficulty as DifficultyLevel).catch(error => {
          console.error('Failed to award lesson achievement:', error);
          // Don't show error to user as it's not critical to lesson flow
        });
      } else {
        setCurrentNoteIndex(currentNoteIndex + 1);
        setLessonState('learning');
        setAttempts(0);
      }
    }
  }, [detectedNote, cents, lessonState, currentNote, currentNoteIndex, notes.length, completedNotes]);

  const startLearning = () => {
    setCurrentNoteIndex(0);
    setCompletedNotes(new Array(notes.length).fill(false));
    setAttempts(0);
    setLessonState('learning');
  };

  const startListening = () => {
    setLessonState('listening');
    setAttempts(attempts + 1);
    startRecording();
  };

  const startRecording = () => {
    if (micAccess === "granted") {
      try {
        MicrophoneStreamModule.startRecording();
        setIsRecording(true);
        const sr = MicrophoneStreamModule.getSampleRate();
        setSampleRate(sr);

        // Subscribe to audio buffer events
        const subscriber = MicrophoneStreamModule.addListener(
          "onAudioBuffer",
          (buffer: AudioBuffer) => {
            const len = buffer.samples.length;
            setAudioBuffer((prevBuffer) => [...prevBuffer.slice(len), ...buffer.samples]);
            setBufferId((prevId) => prevId + 1);
          }
        );

        // Store subscriber for cleanup
        (startRecording as any).subscriber = subscriber;
      } catch (error) {
        console.error("Error starting recording:", error);
        Alert.alert("Recording Error", "Failed to start recording: " + error);
      }
    }
  };

  const stopRecording = () => {
    try {
      MicrophoneStreamModule.stopRecording();
      setIsRecording(false);

      // Clean up subscriber
      if ((startRecording as any).subscriber) {
        (startRecording as any).subscriber.remove();
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  const tryAgain = () => {
    setLessonState('learning');
  };

  const restartLesson = () => {
    setCurrentNoteIndex(0);
    setCompletedNotes(new Array(notes.length).fill(false));
    setAttempts(0);
    setLessonState('ready');
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>
        Progress: {currentNoteIndex + 1} of {notes.length}
      </Text>
      <View style={styles.progressBar}>
        {notes.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: completedNotes[index]
                  ? getDifficultyColor()
                  : index === currentNoteIndex
                    ? '#FFC107'
                    : '#E0E0E0'
              }
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderLessonContent = () => {
    switch (lessonState) {
      case 'ready':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.welcomeIcon}>🎵</Text>
            <Text style={styles.welcomeTitle}>Ready to Learn?</Text>
            <Text style={styles.welcomeSubtitle}>
              Master {notes.length} notes: {notes.join(' • ')}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: getDifficultyColor() }]}
              onPress={startLearning}
            >
              <Text style={styles.actionButtonText}>Start Learning</Text>
            </TouchableOpacity>
          </View>
        );

      case 'learning':
      case 'listening':
        return (
          <View style={styles.learningContent}>
            {renderProgressBar()}

            <View style={styles.noteCard}>
              <Text style={styles.currentNoteTitle}>{currentNote}</Text>
              <Text style={styles.noteInstruction}>Study the guides and practice</Text>
            </View>

            {/* Guide Images */}
            <View style={styles.imageContainer}>
              <View style={styles.guideCard}>
                {noteImages.male && (
                  <Image
                    source={noteImages.male}
                    style={styles.guideImage}
                    resizeMode="cover"
                  />
                )}
              </View>

              <View style={styles.guideCard}>
                {noteImages.female && (
                  <Image
                    source={noteImages.female}
                    style={styles.guideImage}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>

            {/* Listening Feedback */}
            {lessonState === 'listening' && (
              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackTitle}>🎸 Listening...</Text>
                {detectedNote && (
                  <Text style={styles.feedbackText}>
                    Detected: {detectedNote.name} {Math.abs(cents) <= 30 ? '✅' : '❌'}
                  </Text>
                )}
              </View>
            )}

            {lessonState === 'learning' ? (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: getDifficultyColor() }]}
                onPress={startListening}
              >
                <Text style={styles.actionButtonText}>Start Listening</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  stopRecording();
                  setLessonState('learning');
                }}
              >
                <Text style={styles.secondaryButtonText}>Stop Listening</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'listening':
        return (
          <View style={styles.centerContent}>
            {renderProgressBar()}

            <View style={styles.listeningCard}>
              <Text style={styles.listeningIcon}>�</Text>
              <Text style={styles.listeningTitle}>Listening for: {currentNote}</Text>

              {detectedNote && (
                <View style={styles.detectionInfo}>
                  <Text style={styles.detectedNote}>
                    {detectedNote.name} {Math.abs(cents) <= 30 ? '✅' : '❌'}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                stopRecording();
                setLessonState('learning');
              }}
            >
              <Text style={styles.secondaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );

      case 'completed':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.completedTitle}>🌟 Lesson Completed!</Text>
            <Text style={styles.completedSubtitle}>
              Congratulations! You've mastered all {notes.length} notes in {title}
            </Text>

            <View style={styles.achievementNotice}>
              <Text style={styles.achievementTitle}>🏆 Achievement Unlocked!</Text>
              <Text style={styles.achievementDesc}>
                {getAchievementTitle(difficulty as DifficultyLevel)}
              </Text>
              <Text style={styles.achievementSubDesc}>
                {getAchievementDescription(difficulty as DifficultyLevel)}
              </Text>
            </View>

            <View style={styles.completedStats}>
              <Text style={styles.statsText}>Notes Learned: {notes.join(', ')}</Text>
              <Text style={styles.statsText}>Difficulty: {difficulty}</Text>
            </View>

            <View style={styles.completedActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: getDifficultyColor() }]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.actionButtonText}>Back to Lessons</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton]}
                onPress={restartLesson}
              >
                <Text style={styles.secondaryButtonText}>Practice Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {renderLessonContent()}

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
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 60,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  centerContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  learningContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  noteCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentNoteTitle: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  noteInstruction: {
    fontSize: 14,
    color: '#666',
  },
  imageContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  guideCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guideImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  listeningCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  listeningIcon: {
    fontSize: 40,
    marginBottom: 15,
  },
  listeningTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15,
  },
  detectionInfo: {
    alignItems: 'center',
  },
  detectedNote: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
  },
  completedStats: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  completedActions: {
    gap: 12,
    width: '100%',
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  bottomPadding: {
    height: 20,
  },
  achievementNotice: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  achievementDesc: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementSubDesc: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
});