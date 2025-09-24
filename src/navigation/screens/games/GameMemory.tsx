import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AudioModule } from 'expo-audio';
import MicrophoneStreamModule, { AudioBuffer } from '../../../../modules/microphone-stream';
import DSPModule from '../../../../specs/NativeDSPModule';
import { useAuth } from '../../../contexts/AuthContext';
import { pocketbase } from '../../../services/pocketbase';

// Pitch detection parameters
const BUF_SIZE = 9000;
const MIN_FREQ = 30;
const MAX_FREQ = 500;
const THRESHOLD_DEFAULT = 0.15;

// Note conversion utilities
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export type NoteName = (typeof NOTE_NAMES)[number];
export type Note = { name: NoteName; octave: number };

// Game specific notes range (C4 to B5)
const GAME_NOTES: Note[] = [];
for (let octave = 4; octave <= 5; octave++) {
  for (let noteIndex = 0; noteIndex < NOTE_NAMES.length; noteIndex++) {
    GAME_NOTES.push({
      name: NOTE_NAMES[noteIndex],
      octave: octave
    });
  }
}

// Game configuration
const INITIAL_SEQUENCE_LENGTH = 3;
const MAX_SEQUENCE_LENGTH = 8;
const MEMORY_TIME_BASE = 5000; // Base memory time in ms
const MEMORY_TIME_DECREASE = 300; // Decrease per level
const MIN_MEMORY_TIME = 2000; // Minimum memory time
const PITCH_TOLERANCE = 20; // Cents tolerance for note matching
const NOTE_TIMEOUT = 10000; // 10 seconds to play each note

type GamePhase = 'setup' | 'memorize' | 'recall' | 'completed' | 'roundComplete' | 'failed';

/**
 * Get nearest note name from a given frequency.
 */
function getNoteFromFreq(frequency: number): { name: NoteName; octave: number } | undefined {
  if (frequency <= 0) return undefined;

  const a4_frequency = 440;
  const semitonesFromA4 = 12 * Math.log2(frequency / a4_frequency);
  const semitonesFromC4 = Math.round(semitonesFromA4 + 9);
  const octave = Math.floor((semitonesFromC4 + 48) / 12);
  const noteIndex = ((semitonesFromC4 % 12) + 12) % 12;

  return { name: NOTE_NAMES[noteIndex], octave };
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

/**
 * Check if two notes are the same (considering tolerance)
 */
function notesMatch(detectedNote: { name: NoteName; octave: number } | undefined, targetNote: Note, cents: number): boolean {
  if (!detectedNote || !targetNote) return false;
  return detectedNote.name === targetNote.name &&
         detectedNote.octave === targetNote.octave &&
         Math.abs(cents) <= PITCH_TOLERANCE;
}

/**
 * Calculate memory time for current round
 */
function getMemoryTime(round: number): number {
  const memoryTime = MEMORY_TIME_BASE - (round - 1) * MEMORY_TIME_DECREASE;
  return Math.max(memoryTime, MIN_MEMORY_TIME);
}

/**
 * Calculate sequence length for current round
 */
function getSequenceLength(round: number): number {
  const length = INITIAL_SEQUENCE_LENGTH + Math.floor((round - 1) / 2);
  return Math.min(length, MAX_SEQUENCE_LENGTH);
}

/**
 * Generate a random melody sequence
 */
function generateMelodySequence(length: number): Note[] {
  const sequence: Note[] = [];
  for (let i = 0; i < length; i++) {
    const randomNote = GAME_NOTES[Math.floor(Math.random() * GAME_NOTES.length)];
    sequence.push(randomNote);
  }
  return sequence;
}

export function GameMemory() {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();

  // Audio states
  const [micAccess, setMicAccess] = useState<"pending" | "granted" | "denied">("pending");
  const [isRecording, setIsRecording] = useState(false);
  const [sampleRate, setSampleRate] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<number[]>(() => new Array(BUF_SIZE).fill(0));
  const [bufferId, setBufferId] = useState(0);
  const [pitch, setPitch] = useState(-1);
  const [detectedNote, setDetectedNote] = useState<{ name: NoteName; octave: number } | undefined>(undefined);
  const [cents, setCents] = useState<number>(0);

  // Game states
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [currentRound, setCurrentRound] = useState(1);
  const [currentSequenceLength, setCurrentSequenceLength] = useState(INITIAL_SEQUENCE_LENGTH);
  const [melodySequence, setMelodySequence] = useState<Note[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [playerSequence, setPlayerSequence] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [memoryTimeLeft, setMemoryTimeLeft] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const memoryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noteHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noteTimeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to award XP to the user
  const awardXP = async (amount: number) => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, cannot award XP');
      return;
    }

    try {
      await pocketbase.updateUserExperience(user.id, amount);
      console.log(`Awarded ${amount} XP!`);

      Alert.alert(
        "Congratulations!",
        `You earned ${amount} XP for completing the melody!`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error awarding XP:', error);
      Alert.alert(
        "Game Complete!",
        "You completed the game, but there was an issue updating your experience points.",
        [{ text: "OK" }]
      );
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
          Alert.alert("Microphone access denied", "Please enable microphone access to play the game.");
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

  // Check for note matches during recall phase
  useEffect(() => {
    if (gamePhase !== 'recall' || !detectedNote || currentNoteIndex >= melodySequence.length) return;

    const targetNote = melodySequence[currentNoteIndex];
    const isMatch = notesMatch(detectedNote, targetNote, cents);

    if (isMatch) {
      // Clear any existing timers
      if (noteHoldTimerRef.current) {
        clearTimeout(noteHoldTimerRef.current);
      }
      if (noteTimeoutTimerRef.current) {
        clearTimeout(noteTimeoutTimerRef.current);
      }

      // Start a timer to ensure the note is held for a short duration
      noteHoldTimerRef.current = setTimeout(() => {
        // Note held successfully
        const newPlayerSequence = [...playerSequence, detectedNote];
        setPlayerSequence(newPlayerSequence);
        setScore(score + 1);

        // Animate success
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true })
        ]).start();

        // Move to next note or complete round
        if (currentNoteIndex + 1 >= melodySequence.length) {
          // Round completed successfully
          const newTotalScore = totalScore + score + 1;
          setTotalScore(newTotalScore);
          setGamePhase('roundComplete');
          stopRecording();

          // Award XP based on round completion
          if (!xpAwarded) {
            setXpAwarded(true);
            const baseXP = 20 + (currentRound * 5); // Increasing XP per round
            const perfectBonus = score + 1 === melodySequence.length ? 10 : 0;
            awardXP(baseXP + perfectBonus);
          }
        } else {
          setCurrentNoteIndex(currentNoteIndex + 1);
          // Start timeout for next note
          noteTimeoutTimerRef.current = setTimeout(() => {
            setGamePhase('failed');
            stopRecording();
            Alert.alert(
              "Time's up!",
              `You took too long to play note ${currentNoteIndex + 2} of ${melodySequence.length}. Game over!`,
              [{ text: "OK" }]
            );
          }, NOTE_TIMEOUT);
        }
      }, 500); // Hold note for 500ms
    } else {
      // Clear timer if note doesn't match
      if (noteHoldTimerRef.current) {
        clearTimeout(noteHoldTimerRef.current);
        noteHoldTimerRef.current = null;
      }
    }
  }, [detectedNote, cents, gamePhase, currentNoteIndex, melodySequence, playerSequence, score, currentRound, totalScore, xpAwarded]);

  const startGame = () => {
    const sequenceLength = getSequenceLength(currentRound);
    const memoryTime = getMemoryTime(currentRound);
    const sequence = generateMelodySequence(sequenceLength);

    setMelodySequence(sequence);
    setCurrentSequenceLength(sequenceLength);
    setCurrentNoteIndex(0);
    setPlayerSequence([]);
    setScore(0);
    setXpAwarded(false);
    setMemoryTimeLeft(memoryTime / 1000);
    setGamePhase('memorize');

    // Start memory countdown
    memoryTimerRef.current = setInterval(() => {
      setMemoryTimeLeft((prev) => {
        if (prev <= 1) {
          if (memoryTimerRef.current) {
            clearInterval(memoryTimerRef.current);
          }
          setGamePhase('recall');
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Animate notes appearing
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  };

  const nextRound = () => {
    setCurrentRound(currentRound + 1);
    setGamePhase('setup');
    fadeAnim.setValue(0);
    pulseAnim.setValue(1);
    startGame();
  };

  const startRecording = () => {
    if (micAccess === "granted") {
      try {
        MicrophoneStreamModule.startRecording();
        setIsRecording(true);
        const sr = MicrophoneStreamModule.getSampleRate();
        setSampleRate(sr);

        // Start timeout timer for the current note
        noteTimeoutTimerRef.current = setTimeout(() => {
          // Player took too long - end the game
          setGamePhase('failed');
          stopRecording();
          Alert.alert(
            "Time's up!",
            `You took too long to play note ${currentNoteIndex + 1} of ${melodySequence.length}. Game over!`,
            [{ text: "OK" }]
          );
        }, NOTE_TIMEOUT);

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
    if (isRecording) {
      MicrophoneStreamModule.stopRecording();
      setIsRecording(false);

      // Clean up subscriber
      if ((startRecording as any).subscriber) {
        (startRecording as any).subscriber.remove();
        (startRecording as any).subscriber = null;
      }
    }

    // Clear all timers
    if (noteTimeoutTimerRef.current) {
      clearTimeout(noteTimeoutTimerRef.current);
      noteTimeoutTimerRef.current = null;
    }
  };

  const resetGame = () => {
    stopRecording();
    if (memoryTimerRef.current) {
      clearInterval(memoryTimerRef.current);
    }
    if (noteHoldTimerRef.current) {
      clearTimeout(noteHoldTimerRef.current);
    }
    if (noteTimeoutTimerRef.current) {
      clearTimeout(noteTimeoutTimerRef.current);
    }
    setGamePhase('setup');
    setCurrentRound(1);
    setCurrentSequenceLength(INITIAL_SEQUENCE_LENGTH);
    setMelodySequence([]);
    setPlayerSequence([]);
    setCurrentNoteIndex(0);
    setScore(0);
    setTotalScore(0);
    setXpAwarded(false);
    setMemoryTimeLeft(0);
    fadeAnim.setValue(0);
    pulseAnim.setValue(1);
  };

  const renderNote = (note: Note, index: number, isActive: boolean = false, isCompleted: boolean = false) => (
    <Animated.View
      key={index}
      style={[
        styles.noteContainer,
        isActive && styles.activeNote,
        isCompleted && styles.completedNote,
        isActive && { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <Text style={[styles.noteText, isActive && styles.activeNoteText]}>
        {note.name}
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Melody Memory</Text>

      {micAccess === "denied" && (
        <Text style={styles.error}>
          Microphone access is required to play the game.
        </Text>
      )}

      {micAccess === "granted" && (
        <>
          {!isAuthenticated && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                Login to save your progress and earn XP!
              </Text>
            </View>
          )}

          {gamePhase === 'setup' && (
            <View style={styles.gameContainer}>
              <Text style={styles.description}>
                Memorize the melody sequence, then play it back in order!
              </Text>

              <View style={styles.gameInfo}>
                <Text style={styles.infoTitle}>Round {currentRound}</Text>
                <Text style={styles.infoText}>
                  • Sequence Length: {getSequenceLength(currentRound)} notes
                </Text>
                <Text style={styles.infoText}>
                  • Memory Time: {getMemoryTime(currentRound) / 1000}s
                </Text>
                <Text style={styles.infoText}>
                  • Pitch Tolerance: ±{PITCH_TOLERANCE} cents
                </Text>
                <Text style={styles.infoText}>
                  • Total Score: {totalScore} notes
                </Text>
              </View>

              <TouchableOpacity style={styles.startButton} onPress={startGame}>
                <Text style={styles.buttonText}>
                  {currentRound === 1 ? 'Start Game' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {gamePhase === 'memorize' && (
            <View style={styles.gameContainer}>
              <Text style={styles.phaseTitle}>Memorize this melody:</Text>
              <Text style={styles.countdown}>Time left: {memoryTimeLeft}s</Text>

              <Animated.View style={[styles.melodyContainer, { opacity: fadeAnim }]}>
                {melodySequence.map((note, index) => renderNote(note, index))}
              </Animated.View>

              <Text style={styles.instructionText}>
                Study the sequence carefully. The notes will disappear when it's time to play!
              </Text>
            </View>
          )}

          {gamePhase === 'recall' && (
            <View style={styles.gameContainer}>
              <Text style={styles.phaseTitle}>Play back the melody:</Text>
              <Text style={styles.progressText}>
                Note {currentNoteIndex + 1} of {melodySequence.length}
              </Text>

              {/* Hidden melody - only show empty placeholders */}
              <View style={styles.melodyContainer}>
                {melodySequence.map((note, index) => (
                  <View
                    key={index}
                    style={[
                      styles.noteContainer,
                      styles.hiddenNote,
                      index === currentNoteIndex && styles.activeHiddenNote,
                      index < currentNoteIndex && styles.completedNote
                    ]}
                  >
                    <Text style={styles.hiddenNoteText}>
                      {index < currentNoteIndex ? '✓' : index === currentNoteIndex ? '?' : '•'}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={styles.memoryHint}>
                Remember the melody from memory!
              </Text>

              {/* Current detection */}
              <View style={styles.detectionContainer}>
                <Text style={styles.detectionLabel}>You're playing:</Text>
                <Text style={[
                  styles.detectedNote,
                  detectedNote && notesMatch(
                    detectedNote,
                    melodySequence[currentNoteIndex],
                    cents
                  ) && styles.matchingNote
                ]}>
                  {detectedNote ? `${detectedNote.name}` : "No note detected"}
                </Text>
                {pitch > 0 && detectedNote && (
                  <Text style={[
                    styles.centsText,
                    Math.abs(cents) <= PITCH_TOLERANCE ? styles.inTune :
                    cents > 0 ? styles.sharp : styles.flat
                  ]}>
                    {cents > 0 ? `+${cents}` : cents} cents
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.stopButton} onPress={resetGame}>
                <Text style={styles.buttonText}>Stop Game</Text>
              </TouchableOpacity>
            </View>
          )}

          {gamePhase === 'roundComplete' && (
            <View style={styles.gameContainer}>
              <Text style={styles.completedTitle}>Round {currentRound} Complete!</Text>
              <Text style={styles.scoreText}>
                Score: {score}/{melodySequence.length}
              </Text>
              <Text style={styles.totalScoreText}>
                Total Score: {totalScore} notes
              </Text>

              {isAuthenticated && (
                <Text style={styles.xpText}>
                  +{20 + (currentRound * 5) + (score === melodySequence.length ? 10 : 0)} XP Earned!
                </Text>
              )}

              {!isAuthenticated && score === melodySequence.length && (
                <Text style={styles.missedXpText}>
                  Login to earn XP for perfect rounds!
                </Text>
              )}

              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Your sequence:</Text>
                <View style={styles.sequenceComparison}>
                  <View style={styles.sequenceColumn}>
                    <Text style={styles.sequenceLabel}>Target:</Text>
                    {melodySequence.map((note, index) => (
                      <Text key={index} style={styles.sequenceNote}>
                        {note.name}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.sequenceColumn}>
                    <Text style={styles.sequenceLabel}>Your play:</Text>
                    {playerSequence.map((note, index) => (
                      <Text key={index} style={[
                        styles.sequenceNote,
                        melodySequence[index] &&
                        note.name === melodySequence[index].name &&
                        note.octave === melodySequence[index].octave
                          ? styles.correctNote : styles.incorrectNote
                      ]}>
                        {note.name}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.startButton} onPress={nextRound}>
                <Text style={styles.buttonText}>Next Round</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                <Text style={styles.buttonText}>End Game</Text>
              </TouchableOpacity>
            </View>
          )}

          {gamePhase === 'failed' && (
            <View style={styles.gameContainer}>
              <Text style={styles.failedTitle}>Game Over!</Text>
              <Text style={styles.scoreText}>
                Final Score: {totalScore} notes
              </Text>
              <Text style={styles.roundText}>
                Reached Round {currentRound}
              </Text>
              <Text style={styles.failureMessage}>
                {playerSequence.length < melodySequence.length
                  ? `You failed to complete the sequence at note ${currentNoteIndex + 1}`
                  : "Time ran out!"
                }
              </Text>

              <TouchableOpacity style={styles.startButton} onPress={resetGame}>
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {gamePhase === 'completed' && (
            <View style={styles.gameContainer}>
              <Text style={styles.completedTitle}>Game Over!</Text>
              <Text style={styles.scoreText}>
                Final Score: {totalScore} notes
              </Text>
              <Text style={styles.roundText}>
                Completed {currentRound - 1} rounds
              </Text>

              <TouchableOpacity style={styles.startButton} onPress={resetGame}>
                <Text style={styles.buttonText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    paddingVertical: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 24,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  warningText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  gameContainer: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
    justifyContent: 'center',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  difficultyButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedDifficulty: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  selectedDifficultyText: {
    color: 'white',
  },
  difficultyInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  gameInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  infoText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
    textAlign: 'center',
  },
  phaseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  countdown: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 20,
  },
  melodyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  noteContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ced4da',
    margin: 5,
  },
  activeNote: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  completedNote: {
    backgroundColor: '#28a745',
    borderColor: '#1e7e34',
  },
  hiddenNote: {
    backgroundColor: '#6c757d',
    borderColor: '#495057',
  },
  activeHiddenNote: {
    backgroundColor: '#ffc107',
    borderColor: '#e0a800',
    shadowColor: '#ffc107',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  hiddenNoteText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  noteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  activeNoteText: {
    color: 'white',
  },
  instructionText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  memoryHint: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    color: '#495057',
  },
  targetNoteContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  targetLabel: {
    fontSize: 14,
    color: '#1565c0',
    fontWeight: '500',
  },
  targetNote: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d47a1',
  },
  detectionContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f1f3f4',
    borderRadius: 10,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  detectionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detectedNote: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  matchingNote: {
    color: '#28a745',
  },
  centsText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
  },
  inTune: {
    color: '#28a745',
  },
  sharp: {
    color: '#fd7e14',
  },
  flat: {
    color: '#6f42c1',
  },
  startButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stopButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#2c3e50',
  },
  xpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 15,
    textAlign: 'center',
  },
  missedXpText: {
    fontSize: 16,
    color: '#fd7e14',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2c3e50',
  },
  sequenceComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  sequenceColumn: {
    flex: 1,
    alignItems: 'center',
  },
  sequenceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#495057',
  },
  sequenceNote: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  correctNote: {
    color: '#28a745',
  },
  incorrectNote: {
    color: '#dc3545',
  },
  backButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  totalScoreText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2c3e50',
  },
  roundText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    color: '#6c757d',
  },
  resetButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  failedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  failureMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
});
