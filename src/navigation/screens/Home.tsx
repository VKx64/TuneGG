import { Button, Text } from '@react-navigation/elements';
import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { AudioModule } from 'expo-audio';
import MicrophoneStreamModule, { AudioBuffer } from '../../../modules/microphone-stream';
import DSPModule from '../../../specs/NativeDSPModule';
import { useAuth } from '../../contexts/AuthContext';

// Pitch detection parameters
const BUF_SIZE = 9000;
const MIN_FREQ = 30;
const MAX_FREQ = 500;
const THRESHOLD_DEFAULT = 0.15;

// Note conversion utilities
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export type NoteName = (typeof NOTE_NAMES)[number];
export type Note = { name: NoteName };

/**
 * Get nearest note name from a given frequency.
 * @param frequency Frequency in Hz.
 * @returns name of the note.
 */
function getNoteFromFreq(frequency: number): Note | undefined {
  if (frequency <= 0) return undefined;

  // Use A4 = 440Hz as reference
  const a4_frequency = 440;
  const semitonesFromA4 = 12 * Math.log2(frequency / a4_frequency);

  // Octaves start in C, calculate semitones from C4
  const semitonesFromC4 = Math.round(semitonesFromA4 + 9);

  // Determine the note
  const noteIndex = ((semitonesFromC4 % 12) + 12) % 12;

  return { name: NOTE_NAMES[noteIndex] };
}

/**
 * Calculates the frequency of a note given its name and octave.
 * @param note The name and octave of the note.
 * @returns The frequency of the note in Hz.
 */
function getFreqFromNote(note: { name: NoteName; octave: number }): number {
  const a4_frequency = 440;

  // Calculate the semitone offset from A4
  const noteDistance = NOTE_NAMES.indexOf(note.name) - NOTE_NAMES.indexOf("A");
  const semitonesFromA4 = (note.octave - 4) * 12 + noteDistance;

  // freq = ref^(semitones / 12)
  return a4_frequency * Math.pow(2, semitonesFromA4 / 12);
}

/**
 * Calculate cents deviation from the nearest note
 * @param frequency Frequency in Hz
 * @returns cents deviation (positive = sharp, negative = flat)
 */
function getNoteCents(frequency: number): number {
  if (frequency <= 0) return 0;

  const note = getNoteFromFreq(frequency);
  if (!note) return 0;

  const a4_frequency = 440;
  const semitonesFromA4 = 12 * Math.log2(frequency / a4_frequency);
  const roundedSemitonesFromA4 = Math.round(semitonesFromA4);
  const nearestNoteFreq = a4_frequency * Math.pow(2, roundedSemitonesFromA4 / 12);
  const cents = 1200 * Math.log2(frequency / nearestNoteFreq);

  return Math.round(cents);
}

export function Home() {
  const { user, logout } = useAuth();
  const [micAccess, setMicAccess] = useState<"pending" | "granted" | "denied">("pending");
  const [isRecording, setIsRecording] = useState(false);
  const [lastBufferSize, setLastBufferSize] = useState(0);
  const [sampleRate, setSampleRate] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<number[]>(() => new Array(BUF_SIZE).fill(0));
  const [bufferId, setBufferId] = useState(0);
  const [pitch, setPitch] = useState(-1);
  const [note, setNote] = useState<Note | undefined>(undefined);
  const [cents, setCents] = useState<number>(0);

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
          Alert.alert("Microphone access denied", "Please enable microphone access to test the feature.");
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
      console.log(`Setting sample rate to ${sr}Hz`);
      setSampleRate(sr);
    }

    // Estimate pitch using DSP module
    const detectedPitch = DSPModule.pitch(audioBuffer, sr, MIN_FREQ, MAX_FREQ, THRESHOLD_DEFAULT);
    console.log(`Detected pitch: ${detectedPitch.toFixed(1)}Hz`);
    setPitch(detectedPitch);

    // Convert pitch to note
    const detectedNote = getNoteFromFreq(detectedPitch);
    const detectedCents = getNoteCents(detectedPitch);
    setNote(detectedNote);
    setCents(detectedCents);

    if (detectedPitch > 0 && detectedNote) {
      console.log(`Note: ${detectedNote.name}, Cents: ${detectedCents > 0 ? '+' : ''}${detectedCents}`);
    }
  }, [audioBuffer, sampleRate, micAccess, isRecording, bufferId]);

  // Start/stop recording
  const toggleRecording = () => {
    if (!isRecording && micAccess === "granted") {
      try {
        MicrophoneStreamModule.startRecording();
        setIsRecording(true);
        const sr = MicrophoneStreamModule.getSampleRate();
        setSampleRate(sr);
        console.log("Started recording with sample rate:", sr);

        // Subscribe to audio buffer events
        const subscriber = MicrophoneStreamModule.addListener(
          "onAudioBuffer",
          (buffer: AudioBuffer) => {
            console.log("Received audio buffer with", buffer.samples.length, "samples");
            setLastBufferSize(buffer.samples.length);

            // Append new audio samples to the end of the buffer
            const len = buffer.samples.length;
            setAudioBuffer((prevBuffer) => [...prevBuffer.slice(len), ...buffer.samples]);
            setBufferId((prevId) => prevId + 1);
          }
        );

        // Clean up after 10 seconds for testing
        setTimeout(() => {
          subscriber.remove();
          MicrophoneStreamModule.stopRecording();
          setIsRecording(false);
          console.log("Stopped recording");
        }, 10000);

      } catch (error) {
        console.error("Error starting recording:", error);
        Alert.alert("Recording Error", "Failed to start recording: " + error);
      }
    } else if (isRecording) {
      MicrophoneStreamModule.stopRecording();
      setIsRecording(false);
      console.log("Stopped recording manually");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'Failed to logout');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Home Screen - Microphone Test</Text>
      <Text>Welcome, {user?.email}!</Text>
      <Text>Microphone Access: {micAccess}</Text>

      {micAccess === "granted" && (
        <>
          <Text>Sample Rate: {sampleRate}Hz</Text>
          <Text>Recording: {isRecording ? "Yes" : "No"}</Text>
          <Text>Last Buffer Size: {lastBufferSize} samples</Text>
          <Text>Buffers per second: {MicrophoneStreamModule.BUF_PER_SEC}</Text>
          <Text>Detected Pitch: {pitch > 0 ? `${pitch.toFixed(1)}Hz` : "No pitch detected"}</Text>
          <Text style={styles.noteText}>
            Detected Note: {note ? `${note.name}` : "No note"}
          </Text>
          {pitch > 0 && note && (
            <Text style={[styles.centsText, cents > 10 ? styles.sharp : cents < -10 ? styles.flat : styles.inTune]}>
              Tuning: {cents > 0 ? `+${cents}` : cents} cents {cents > 10 ? '(sharp)' : cents < -10 ? '(flat)' : '(in tune)'}
            </Text>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={toggleRecording}
          >
            <Text style={styles.buttonText}>
              {isRecording ? "Stop Recording (auto-stops in 10s)" : "Start Recording Test"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {micAccess === "denied" && (
        <Text style={styles.error}>
          Microphone access is required to test the microphone stream module.
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      <Button screen="Settings">Go to Settings</Button>
      <Button screen="Achievements">View Achievements</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  noteText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  centsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inTune: {
    color: '#4CAF50', // Green
  },
  sharp: {
    color: '#FF9800', // Orange
  },
  flat: {
    color: '#2196F3', // Blue
  },
});
