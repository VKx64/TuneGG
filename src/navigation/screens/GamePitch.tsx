import { Text } from '@react-navigation/elements';
import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AudioModule } from 'expo-audio';
import MicrophoneStreamModule, { AudioBuffer } from '../../../modules/microphone-stream';
import DSPModule from '../../../specs/NativeDSPModule';

// Pitch detection parameters
const BUF_SIZE = 9000;
const MIN_FREQ = 30;
const MAX_FREQ = 500;
const THRESHOLD_DEFAULT = 0.15;

// Note conversion utilities
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const OCTAVE_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

export type NoteName = (typeof NOTE_NAMES)[number];
export type OctaveNumber = (typeof OCTAVE_NUMBERS)[number];
export type Note = { name: NoteName; octave: OctaveNumber };

// Game specific notes range (C3 to B5)
const GAME_NOTES: Note[] = [];
for (let octave = 3; octave <= 5; octave++) {
  for (let noteIndex = 0; noteIndex < NOTE_NAMES.length; noteIndex++) {
    GAME_NOTES.push({
      name: NOTE_NAMES[noteIndex],
      octave: octave as OctaveNumber
    });
  }
}

/**
 * Get nearest note name and octave from a given frequency.
 */
function getNoteFromFreq(frequency: number): Note | undefined {
  if (frequency <= 0) return undefined;

  const a4_frequency = 440;
  const semitonesFromA4 = 12 * Math.log2(frequency / a4_frequency);
  const semitonesFromC4 = Math.round(semitonesFromA4 + 9);
  const noteIndex = ((semitonesFromC4 % 12) + 12) % 12;
  const octave = 4 + Math.floor(semitonesFromC4 / 12);

  return { name: NOTE_NAMES[noteIndex], octave: octave as OctaveNumber };
}

/**
 * Calculates the frequency of a note given its name and octave.
 */
function getFreqFromNote(note: Note | undefined): number {
  if (!note) return 0;

  const a4_frequency = 440;
  const noteDistance = NOTE_NAMES.indexOf(note.name) - NOTE_NAMES.indexOf("A");
  const semitonesFromA4 = (note.octave - 4) * 12 + noteDistance;

  return a4_frequency * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * Calculate cents deviation from the nearest note
 */
function getNoteCents(frequency: number): number {
  if (frequency <= 0) return 0;

  const note = getNoteFromFreq(frequency);
  if (!note) return 0;

  const noteFreq = getFreqFromNote(note);
  const cents = 1200 * Math.log2(frequency / noteFreq);

  return Math.round(cents);
}

/**
 * Check if two notes are the same
 */
function notesMatch(note1: Note | undefined, note2: Note | undefined): boolean {
  if (!note1 || !note2) return false;
  return note1.name === note2.name && note1.octave === note2.octave;
}

/**
 * Generate a random note from the game range
 */
function generateRandomNote(): Note {
  const randomIndex = Math.floor(Math.random() * GAME_NOTES.length);
  return GAME_NOTES[randomIndex];
}

export function GamePitch() {
  const navigation = useNavigation();
  const [micAccess, setMicAccess] = useState<"pending" | "granted" | "denied">("pending");
  const [isRecording, setIsRecording] = useState(false);
  const [sampleRate, setSampleRate] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<number[]>(() => new Array(BUF_SIZE).fill(0));
  const [bufferId, setBufferId] = useState(0);
  const [pitch, setPitch] = useState(-1);
  const [detectedNote, setDetectedNote] = useState<Note | undefined>(undefined);
  const [cents, setCents] = useState<number>(0);

  // Game state
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'completed'>('ready');
  const [targetNotes, setTargetNotes] = useState<Note[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [matchedNotes, setMatchedNotes] = useState<boolean[]>([]);

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

  // Check if detected note matches target note
  useEffect(() => {
    if (gameState !== 'playing' || !detectedNote || currentNoteIndex >= targetNotes.length) return;

    const targetNote = targetNotes[currentNoteIndex];
    const isMatch = notesMatch(detectedNote, targetNote);
    const isInTune = Math.abs(cents) <= 20; // Within 20 cents

    if (isMatch && isInTune) {
      // Note matched successfully
      const newMatchedNotes = [...matchedNotes];
      newMatchedNotes[currentNoteIndex] = true;
      setMatchedNotes(newMatchedNotes);
      setScore(score + 1);

      // Move to next note or complete game
      if (currentNoteIndex + 1 >= targetNotes.length) {
        setGameState('completed');
        stopRecording();
      } else {
        setCurrentNoteIndex(currentNoteIndex + 1);
      }
    }
  }, [detectedNote, cents, gameState, currentNoteIndex, targetNotes, matchedNotes, score]);

  const startGame = () => {
    // Generate 5 random notes
    const notes = Array.from({ length: 5 }, () => generateRandomNote());
    setTargetNotes(notes);
    setCurrentNoteIndex(0);
    setScore(0);
    setMatchedNotes(new Array(5).fill(false));
    setGameState('playing');
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
    if (isRecording) {
      MicrophoneStreamModule.stopRecording();
      setIsRecording(false);

      // Clean up subscriber
      if ((startRecording as any).subscriber) {
        (startRecording as any).subscriber.remove();
        (startRecording as any).subscriber = null;
      }
    }
  };

  const resetGame = () => {
    stopRecording();
    setGameState('ready');
    setTargetNotes([]);
    setCurrentNoteIndex(0);
    setScore(0);
    setMatchedNotes([]);
  };

  const currentTargetNote = targetNotes[currentNoteIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pitch Matching Game</Text>

      {micAccess === "denied" && (
        <Text style={styles.error}>
          Microphone access is required to play the game.
        </Text>
      )}

      {micAccess === "granted" && (
        <>
          {gameState === 'ready' && (
            <View style={styles.gameContainer}>
              <Text style={styles.description}>
                Hit 5 random notes consecutively to win!
              </Text>
              <TouchableOpacity style={styles.startButton} onPress={startGame}>
                <Text style={styles.buttonText}>Start Game</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === 'playing' && (
            <View style={styles.gameContainer}>
              <Text style={styles.progressText}>
                Note {currentNoteIndex + 1} of {targetNotes.length}
              </Text>

              {/* Target note display */}
              <View style={styles.targetNoteContainer}>
                <Text style={styles.targetLabel}>Target Note:</Text>
                <Text style={styles.targetNote}>
                  {currentTargetNote ? `${currentTargetNote.name}${currentTargetNote.octave}` : ''}
                </Text>
              </View>

              {/* Progress indicators */}
              <View style={styles.progressContainer}>
                {targetNotes.map((note, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index === currentNoteIndex && styles.progressDotCurrent,
                      matchedNotes[index] && styles.progressDotMatched
                    ]}
                  >
                    <Text style={styles.progressDotText}>
                      {note.name}{note.octave}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Current detection */}
              <View style={styles.detectionContainer}>
                <Text style={styles.detectionLabel}>You're playing:</Text>
                <Text style={styles.detectedNote}>
                  {detectedNote ? `${detectedNote.name}${detectedNote.octave}` : "No note detected"}
                </Text>
                {pitch > 0 && detectedNote && (
                  <Text style={[
                    styles.centsText,
                    Math.abs(cents) <= 20 ? styles.inTune :
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

          {gameState === 'completed' && (
            <View style={styles.gameContainer}>
              <Text style={styles.completedTitle}>Game Completed!</Text>
              <Text style={styles.scoreText}>Score: {score}/5</Text>

              <View style={styles.resultsContainer}>
                {targetNotes.map((note, index) => (
                  <View key={index} style={styles.resultItem}>
                    <Text style={styles.resultNote}>
                      {note.name}{note.octave}
                    </Text>
                    <Text style={matchedNotes[index] ? styles.resultSuccess : styles.resultMiss}>
                      {matchedNotes[index] ? '✓' : '✗'}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.startButton} onPress={startGame}>
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
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  gameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  targetNoteContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    minWidth: 120,
  },
  targetLabel: {
    fontSize: 14,
    color: '#666',
  },
  targetNote: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  progressDot: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  progressDotCurrent: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f2ff',
  },
  progressDotMatched: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  progressDotText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  detectionContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    minWidth: 120,
  },
  detectionLabel: {
    fontSize: 14,
    color: '#666',
  },
  detectedNote: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  centsText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
  },
  inTune: {
    color: '#4CAF50',
  },
  sharp: {
    color: '#FF9800',
  },
  flat: {
    color: '#2196F3',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  resultsContainer: {
    marginBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 100,
    marginBottom: 5,
  },
  resultNote: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultSuccess: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultMiss: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
});
