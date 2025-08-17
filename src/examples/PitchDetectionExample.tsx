import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  usePitchDetection,
  getTuningStatus,
  formatPitch,
  formatCents,
  detectPitch,
  getNoteFromFreq,
  getNoteCents,
  PITCH_DETECTION_CONFIG
} from '../utils/noteUtils';

/**
 * Example component demonstrating how to use the unified pitch detection utilities
 * in any screen throughout the app
 */
export default function PitchDetectionExample() {
  // Example 1: Using the React hook for continuous pitch detection
  const { status, startRecording, stopRecording, toggleRecording } = usePitchDetection({
    autoStart: false, // Don't auto-start
    bufferSize: PITCH_DETECTION_CONFIG.BUF_SIZE,
    minFreq: 80, // Custom frequency range for vocals
    maxFreq: 1000,
  });

  const { micAccess, isRecording, result } = status;
  const { pitch, note, cents, isValidPitch } = result;
  const tuningStatus = getTuningStatus(cents);

  // Example 2: Using utility functions directly
  const exampleFrequency = 440; // A4
  const exampleNote = getNoteFromFreq(exampleFrequency);
  const exampleCents = getNoteCents(442); // Slightly sharp A4

  // Example 3: Standalone pitch detection (without React hook)
  const analyzeAudioBuffer = (audioSamples: number[], sampleRate: number) => {
    const result = detectPitch(audioSamples, sampleRate, {
      minFreq: 100,
      maxFreq: 800,
      threshold: 0.2,
    });

    console.log('Detected:', result);
    return result;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pitch Detection Utility Example</Text>

      {/* Example 1: Real-time detection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Real-time Detection</Text>
        <Text>Microphone: {micAccess}</Text>
        <Text>Recording: {isRecording ? 'Yes' : 'No'}</Text>

        {micAccess === 'granted' && (
          <>
            <Text>Pitch: {formatPitch(pitch)}</Text>
            <Text>Note: {note?.name || 'None'}</Text>
            {isValidPitch && (
              <Text style={{ color: tuningStatus.color }}>
                {formatCents(cents)} cents ({tuningStatus.text})
              </Text>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={toggleRecording}
            >
              <Text style={styles.buttonText}>
                {isRecording ? 'Stop' : 'Start'} Detection
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Example 2: Utility functions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Utility Functions</Text>
        <Text>440Hz = {exampleNote?.name} note</Text>
        <Text>442Hz = {formatCents(exampleCents)} cents from nearest note</Text>
      </View>

      {/* Example 3: Manual analysis button */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Manual Analysis</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            // Example: analyze a dummy audio buffer
            const dummyBuffer = new Array(1000).fill(0).map(() => Math.random() * 0.1);
            analyzeAudioBuffer(dummyBuffer, 44100);
          }}
        >
          <Text style={styles.buttonText}>Analyze Sample Buffer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
});
