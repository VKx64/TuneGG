import { Button, Text } from '@react-navigation/elements';
import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePitchDetection, getTuningStatus, formatPitch, formatCents, Note } from '../../utils/noteUtils';
import MicrophoneStreamModule from '../../../modules/microphone-stream';

export function Home() {
  const { user, logout } = useAuth();

  // Use the pitch detection hook with auto-stop after 10 seconds (like the original)
  const { status, toggleRecording } = usePitchDetection({
    autoStopAfter: 10000,
  });

  const { micAccess, isRecording, lastBufferSize, sampleRate, result } = status;
  const { pitch, note, cents, isValidPitch } = result;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'Failed to logout');
    }
  };

  // Get tuning status for styling
  const tuningStatus = getTuningStatus(cents);

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
          <Text>Detected Pitch: {formatPitch(pitch)}</Text>
          <Text style={styles.noteText}>
            Detected Note: {note ? `${note.name}` : "No note"}
          </Text>
          {isValidPitch && (
            <Text style={[styles.centsText, { color: tuningStatus.color }]}>
              Tuning: {formatCents(cents)} cents ({tuningStatus.text})
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
});
