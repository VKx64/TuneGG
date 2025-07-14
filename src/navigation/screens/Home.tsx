import { Button, Text } from '@react-navigation/elements';
import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { AudioModule } from 'expo-audio';
import MicrophoneStreamModule, { AudioBuffer } from '../../../modules/microphone-stream';

export function Home() {
  const [micAccess, setMicAccess] = useState<"pending" | "granted" | "denied">("pending");
  const [isRecording, setIsRecording] = useState(false);
  const [lastBufferSize, setLastBufferSize] = useState(0);
  const [sampleRate, setSampleRate] = useState(0);

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

  return (
    <View style={styles.container}>
      <Text>Home Screen - Microphone Test</Text>
      <Text>Microphone Access: {micAccess}</Text>

      {micAccess === "granted" && (
        <>
          <Text>Sample Rate: {sampleRate}Hz</Text>
          <Text>Recording: {isRecording ? "Yes" : "No"}</Text>
          <Text>Last Buffer Size: {lastBufferSize} samples</Text>
          <Text>Buffers per second: {MicrophoneStreamModule.BUF_PER_SEC}</Text>

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

      <Button screen="Profile" params={{ user: 'jane' }}>
        Go to Profile
      </Button>
      <Button screen="Settings">Go to Settings</Button>
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
