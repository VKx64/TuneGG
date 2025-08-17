# Note Detection Utilities

This module provides a unified system for pitch detection, note recognition, and tuning analysis that can be used across all screens in the TuneGG app.

## Overview

The `noteUtils.ts` file contains all the logic that was previously embedded in the Home.tsx component, now refactored into reusable functions and a React hook for easy integration.

## Features

- **Real-time pitch detection** from microphone input
- **Note name recognition** with cent deviation calculation
- **Tuning status** (sharp, flat, in-tune) with color coding
- **MIDI note conversion** utilities
- **Flexible configuration** for different use cases
- **Both hook and standalone function** approaches

## Quick Start

### Using the React Hook (Recommended)

```tsx
import { usePitchDetection, getTuningStatus, formatPitch, formatCents } from '../utils/noteUtils';

function MyTunerScreen() {
  const { status, toggleRecording } = usePitchDetection({
    autoStart: false,
    autoStopAfter: 30000, // Stop after 30 seconds
  });

  const { micAccess, isRecording, result } = status;
  const { pitch, note, cents, isValidPitch } = result;
  const tuningStatus = getTuningStatus(cents);

  return (
    <View>
      <Text>Pitch: {formatPitch(pitch)}</Text>
      <Text>Note: {note?.name || 'No note'}</Text>
      {isValidPitch && (
        <Text style={{ color: tuningStatus.color }}>
          {formatCents(cents)} cents ({tuningStatus.text})
        </Text>
      )}
      <Button onPress={toggleRecording}>
        {isRecording ? 'Stop' : 'Start'} Detection
      </Button>
    </View>
  );
}
```

### Using Standalone Functions

```tsx
import { detectPitch, getNoteFromFreq, getNoteCents } from '../utils/noteUtils';

function analyzeAudioData(audioBuffer: number[], sampleRate: number) {
  // Option 1: All-in-one analysis
  const result = detectPitch(audioBuffer, sampleRate, {
    minFreq: 80,
    maxFreq: 1000,
    threshold: 0.15,
  });

  // Option 2: Step by step
  const frequency = 440; // Hz
  const note = getNoteFromFreq(frequency);
  const cents = getNoteCents(frequency);

  return { result, note, cents };
}
```

## Hook Options

The `usePitchDetection` hook accepts the following options:

```tsx
interface PitchDetectionOptions {
  bufferSize?: number;        // Audio buffer size (default: 9000)
  minFreq?: number;          // Minimum frequency to detect (default: 30)
  maxFreq?: number;          // Maximum frequency to detect (default: 500)
  threshold?: number;        // Detection threshold (default: 0.15)
  autoStart?: boolean;       // Auto-start when permission granted (default: false)
  autoStopAfter?: number;    // Auto-stop after milliseconds (optional)
}
```

## Return Types

### PitchDetectionStatus
```tsx
interface PitchDetectionStatus {
  micAccess: "pending" | "granted" | "denied";
  isRecording: boolean;
  lastBufferSize: number;
  sampleRate: number;
  result: PitchDetectionResult;
}
```

### PitchDetectionResult
```tsx
interface PitchDetectionResult {
  pitch: number;                    // Frequency in Hz
  note: Note | undefined;          // Detected note
  cents: number;                   // Cents deviation
  isValidPitch: boolean;           // Whether a valid pitch was detected
}
```

## Utility Functions

### Core Functions
- `getNoteFromFreq(frequency: number)` - Convert frequency to note name
- `getFreqFromNote(note: {name: NoteName, octave: number})` - Convert note to frequency
- `getNoteCents(frequency: number)` - Calculate cents deviation
- `detectPitch(audioBuffer, sampleRate, options)` - Standalone pitch detection

### Formatting Functions
- `formatPitch(pitch: number)` - Format pitch for display ("440.0Hz" or "No pitch detected")
- `formatCents(cents: number)` - Format cents with sign ("+5" or "-12")
- `getTuningStatus(cents: number)` - Get tuning status with color

### MIDI Conversion
- `noteToMIDI(noteName: NoteName, octave: number)` - Convert to MIDI note number
- `MIDIToNote(midiNote: number)` - Convert from MIDI note number

## Usage Examples

### Vocal Tuning App
```tsx
const { status } = usePitchDetection({
  minFreq: 80,    // Human vocal range
  maxFreq: 1000,
  threshold: 0.2,  // Higher threshold for vocals
});
```

### Instrument Tuner
```tsx
const { status } = usePitchDetection({
  minFreq: 30,     // Lower frequencies for bass instruments
  maxFreq: 2000,   // Higher for treble instruments
  threshold: 0.1,  // Lower threshold for pure tones
});
```

### Guitar Tuner
```tsx
const { status } = usePitchDetection({
  minFreq: 82,     // Low E (E2)
  maxFreq: 330,    // High E (E4)
  autoStart: true, // Start immediately
});
```

### Practice Session Recording
```tsx
const { status, startRecording, stopRecording } = usePitchDetection({
  autoStart: false,
  // No autoStopAfter - manual control
});

// Use startRecording() and stopRecording() for manual control
```

## Migration from Old Home.tsx

The new system is a drop-in replacement. Here's what changed:

**Old approach:**
- All logic embedded in component
- Manual state management
- Duplicate code across screens

**New approach:**
- Centralized utilities
- React hook for state management
- Consistent API across all screens
- Better error handling
- More configuration options

## Configuration

Default configuration can be accessed via:
```tsx
import { PITCH_DETECTION_CONFIG } from '../utils/noteUtils';

console.log(PITCH_DETECTION_CONFIG.BUF_SIZE);     // 9000
console.log(PITCH_DETECTION_CONFIG.MIN_FREQ);     // 30
console.log(PITCH_DETECTION_CONFIG.MAX_FREQ);     // 500
console.log(PITCH_DETECTION_CONFIG.THRESHOLD_DEFAULT); // 0.15
```

## Error Handling

The hook automatically handles:
- Microphone permission requests
- Recording state management
- Cleanup on unmount
- Error logging to console

For manual error handling:
```tsx
try {
  startRecording();
} catch (error) {
  console.error('Failed to start recording:', error);
  // Handle error appropriately
}
```

## Performance Notes

- The hook uses optimized audio buffer management
- Pitch detection runs efficiently on the audio thread
- Memory usage is controlled with circular buffer approach
- Automatic cleanup prevents memory leaks

## Dependencies

- `expo-audio` - for microphone permissions
- `MicrophoneStreamModule` - for audio streaming
- `DSPModule` - for pitch detection algorithm
- React hooks - for state management
