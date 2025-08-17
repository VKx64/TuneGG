import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  usePitchDetection,
  getNoteFromFreq,
  NOTE_NAMES,
  NoteName,
  formatPitch,
  formatCents,
  getNoteCents
} from '../../utils/noteUtils';

type GameState = 'setup' | 'playing' | 'finished';

interface GameStats {
  totalTime: number;
  averageTime: number;
  fastestNote: number;
  slowestNote: number;
}

export function GameSpeed() {
  const navigation = useNavigation();
  const [gameState, setGameState] = useState<GameState>('setup');
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [targetNotes, setTargetNotes] = useState<NoteName[]>([]);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [currentNoteStartTime, setCurrentNoteStartTime] = useState<number>(0);
  const [noteTimes, setNoteTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  const gameStartTimeRef = useRef<number>(0);
  const lastValidNoteRef = useRef<NoteName | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use pitch detection with continuous monitoring
  const { status, startRecording, stopRecording } = usePitchDetection({
    autoStart: false,
  });

  const { micAccess, isRecording, result } = status;
  const { pitch, note, cents, isValidPitch } = result;

  // Generate 20 random notes for the game
  const generateTargetNotes = (): NoteName[] => {
    const notes: NoteName[] = [];
    for (let i = 0; i < 20; i++) {
      const randomIndex = Math.floor(Math.random() * NOTE_NAMES.length);
      notes.push(NOTE_NAMES[randomIndex]);
    }
    return notes;
  };

  // Start the game
  const startGame = () => {
    if (micAccess !== 'granted') {
      Alert.alert('Microphone Required', 'Please grant microphone access to play this game.');
      return;
    }

    const notes = generateTargetNotes();
    setTargetNotes(notes);
    setCurrentNoteIndex(0);
    setNoteTimes([]);
    setGameStats(null);
    setGameState('playing');
    setFeedback('Get ready! First note coming up...');

    const now = Date.now();
    setStartTime(now);
    setCurrentNoteStartTime(now);
    gameStartTimeRef.current = now;

    startRecording();
  };

  // Check if the played note matches the target note
  useEffect(() => {
    if (gameState !== 'playing' || !isValidPitch || !note) return;

    const targetNote = targetNotes[currentNoteIndex];
    if (!targetNote) return;

    // Check if the detected note matches the target note and is within ±15 cents
    if (note.name === targetNote && Math.abs(cents) <= 15) {
      const now = Date.now();
      const noteTime = now - currentNoteStartTime;

      // Avoid duplicate detections by checking if we just detected this note
      if (lastValidNoteRef.current !== targetNote || !detectionTimeoutRef.current) {
        lastValidNoteRef.current = targetNote;

        // Clear any existing timeout
        if (detectionTimeoutRef.current) {
          clearTimeout(detectionTimeoutRef.current);
        }

        // Set a timeout to prevent duplicate detections
        detectionTimeoutRef.current = setTimeout(() => {
          lastValidNoteRef.current = null;
          detectionTimeoutRef.current = null;
        }, 1000); // 1 second cooldown

        // Record the time for this note
        const newNoteTimes = [...noteTimes, noteTime];
        setNoteTimes(newNoteTimes);
        setFeedback(`✅ Correct! ${note.name} (${formatCents(cents)} cents) - ${(noteTime / 1000).toFixed(2)}s`);

        // Move to next note or finish game
        if (currentNoteIndex + 1 >= targetNotes.length) {
          // Game finished
          finishGame(newNoteTimes, now);
        } else {
          // Move to next note
          setTimeout(() => {
            setCurrentNoteIndex(currentNoteIndex + 1);
            setCurrentNoteStartTime(Date.now());
            setFeedback('');
          }, 1500); // Show feedback for 1.5 seconds
        }
      }
    } else if (note.name !== targetNote) {
      // Wrong note detected
      setFeedback(`❌ Wrong note! Play ${targetNote}, not ${note.name}`);
    } else {
      // Right note but out of tune
      setFeedback(`🎯 ${note.name} detected, but tune it better! (${formatCents(cents)} cents, need ±15)`);
    }
  }, [pitch, note, cents, isValidPitch, gameState, currentNoteIndex, targetNotes, currentNoteStartTime, noteTimes]);

  // Finish the game and calculate stats
  const finishGame = (finalNoteTimes: number[], endTime: number) => {
    stopRecording();

    const totalTime = endTime - gameStartTimeRef.current;
    const averageTime = finalNoteTimes.reduce((sum, time) => sum + time, 0) / finalNoteTimes.length;
    const fastestNote = Math.min(...finalNoteTimes);
    const slowestNote = Math.max(...finalNoteTimes);

    setGameStats({
      totalTime,
      averageTime,
      fastestNote,
      slowestNote,
    });

    setGameState('finished');
    setFeedback('🎉 Congratulations! Game completed!');
  };

  // Reset the game
  const resetGame = () => {
    setGameState('setup');
    setCurrentNoteIndex(0);
    setTargetNotes([]);
    setGameStats(null);
    setNoteTimes([]);
    setFeedback('');
    lastValidNoteRef.current = null;
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
    stopRecording();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, []);

  const getCurrentTargetNote = () => {
    return targetNotes[currentNoteIndex];
  };

  const getProgress = () => {
    return `${currentNoteIndex + 1} / ${targetNotes.length}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      <View style={styles.content}>
        {gameState === 'setup' && (
          <View style={styles.setupContainer}>
            <Text style={styles.gameDescription}>
              Play 20 different notes as fast as you can!
            </Text>
            <Text style={styles.gameRules}>
              • Notes will appear one at a time{'\n'}
              • Play each note anywhere on your instrument{'\n'}
              • Must be within ±15 cents to count{'\n'}
              • Timer stops after all 20 notes
            </Text>
            <Text style={styles.micStatus}>
              Microphone: {micAccess === 'granted' ? '✅ Ready' : '❌ Not Available'}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, micAccess !== 'granted' && styles.disabledButton]}
              onPress={startGame}
              disabled={micAccess !== 'granted'}
            >
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'playing' && (
          <View style={styles.gameContainer}>
            <Text style={styles.progress}>{getProgress()}</Text>
            <Text style={styles.targetNote}>Play: {getCurrentTargetNote()}</Text>

            <View style={styles.detectionInfo}>
              <Text style={styles.detectedPitch}>
                Detected: {formatPitch(pitch)}
              </Text>
              {isValidPitch && note && (
                <Text style={styles.detectedNote}>
                  Note: {note.name} ({formatCents(cents)} cents)
                </Text>
              )}
            </View>

            <Text style={styles.feedback}>{feedback}</Text>

            <TouchableOpacity
              style={styles.stopButton}
              onPress={resetGame}
            >
              <Text style={styles.stopButtonText}>Stop Game</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'finished' && gameStats && (
          <View style={styles.resultsContainer}>
            <Text style={styles.congratulations}>🎉 Game Complete!</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Time:</Text>
                <Text style={styles.statValue}>{(gameStats.totalTime / 1000).toFixed(2)}s</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Average per Note:</Text>
                <Text style={styles.statValue}>{(gameStats.averageTime / 1000).toFixed(2)}s</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Fastest Note:</Text>
                <Text style={styles.statValue}>{(gameStats.fastestNote / 1000).toFixed(2)}s</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Slowest Note:</Text>
                <Text style={styles.statValue}>{(gameStats.slowestNote / 1000).toFixed(2)}s</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={resetGame}
            >
              <Text style={styles.playAgainButtonText}>Play Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameDescription: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#212529',
  },
  gameRules: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 30,
    color: '#495057',
    lineHeight: 24,
  },
  micStatus: {
    fontSize: 16,
    marginBottom: 30,
    color: '#495057',
  },
  startButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
  },
  progress: {
    fontSize: 18,
    color: '#495057',
    marginBottom: 20,
  },
  targetNote: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 40,
  },
  detectionInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  detectedPitch: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 5,
  },
  detectedNote: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  feedback: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    minHeight: 24,
    color: '#495057',
  },
  stopButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  congratulations: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#28a745',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    minWidth: 280,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    color: '#495057',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  playAgainButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  playAgainButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});