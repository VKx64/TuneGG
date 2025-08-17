import { useEffect, useState, useRef } from 'react';
import { AudioModule } from 'expo-audio';
import MicrophoneStreamModule, { AudioBuffer } from '../../modules/microphone-stream';
import DSPModule from '../../specs/NativeDSPModule';

// Pitch detection parameters
export const PITCH_DETECTION_CONFIG = {
  BUF_SIZE: 9000,
  MIN_FREQ: 30,
  MAX_FREQ: 500,
  THRESHOLD_DEFAULT: 0.15,
} as const;

// Note conversion utilities
export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export type NoteName = (typeof NOTE_NAMES)[number];
export type Note = { name: NoteName };

/**
 * Get nearest note name from a given frequency.
 * @param frequency Frequency in Hz.
 * @returns name of the note.
 */
export function getNoteFromFreq(frequency: number): Note | undefined {
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
export function getFreqFromNote(note: { name: NoteName; octave: number }): number {
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
export function getNoteCents(frequency: number): number {
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

/**
 * Interface for pitch detection results
 */
export interface PitchDetectionResult {
  pitch: number;
  note: Note | undefined;
  cents: number;
  isValidPitch: boolean;
}

/**
 * Interface for pitch detection status
 */
export interface PitchDetectionStatus {
  micAccess: "pending" | "granted" | "denied";
  isRecording: boolean;
  lastBufferSize: number;
  sampleRate: number;
  result: PitchDetectionResult;
}

/**
 * Options for the pitch detection hook
 */
export interface PitchDetectionOptions {
  /** Buffer size for audio processing */
  bufferSize?: number;
  /** Minimum frequency to detect */
  minFreq?: number;
  /** Maximum frequency to detect */
  maxFreq?: number;
  /** Threshold for pitch detection */
  threshold?: number;
  /** Auto-start recording when permission is granted */
  autoStart?: boolean;
  /** Auto-stop recording after specified milliseconds */
  autoStopAfter?: number;
}

/**
 * Hook for real-time pitch detection using microphone input
 * @param options Configuration options for pitch detection
 * @returns Pitch detection status and control functions
 */
export function usePitchDetection(options: PitchDetectionOptions = {}) {
  const {
    bufferSize = PITCH_DETECTION_CONFIG.BUF_SIZE,
    minFreq = PITCH_DETECTION_CONFIG.MIN_FREQ,
    maxFreq = PITCH_DETECTION_CONFIG.MAX_FREQ,
    threshold = PITCH_DETECTION_CONFIG.THRESHOLD_DEFAULT,
    autoStart = false,
    autoStopAfter,
  } = options;

  const [micAccess, setMicAccess] = useState<"pending" | "granted" | "denied">("pending");
  const [isRecording, setIsRecording] = useState(false);
  const [lastBufferSize, setLastBufferSize] = useState(0);
  const [sampleRate, setSampleRate] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<number[]>(() => new Array(bufferSize).fill(0));
  const [bufferId, setBufferId] = useState(0);
  const [pitch, setPitch] = useState(-1);
  const [note, setNote] = useState<Note | undefined>(undefined);
  const [cents, setCents] = useState<number>(0);

  const subscriptionRef = useRef<any>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        }
      } catch (error) {
        console.error("Error requesting microphone permission:", error);
        setMicAccess("denied");
      }
    })();
  }, []);

  // Auto-start recording when permission is granted
  useEffect(() => {
    if (autoStart && micAccess === "granted" && !isRecording) {
      startRecording();
    }
  }, [micAccess, autoStart]);

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
    const detectedPitch = DSPModule.pitch(audioBuffer, sr, minFreq, maxFreq, threshold);
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
  }, [audioBuffer, sampleRate, micAccess, isRecording, bufferId, minFreq, maxFreq, threshold]);

  /**
   * Start recording from microphone
   */
  const startRecording = () => {
    if (!isRecording && micAccess === "granted") {
      try {
        MicrophoneStreamModule.startRecording();
        setIsRecording(true);
        const sr = MicrophoneStreamModule.getSampleRate();
        setSampleRate(sr);
        console.log("Started recording with sample rate:", sr);

        // Subscribe to audio buffer events
        subscriptionRef.current = MicrophoneStreamModule.addListener(
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

        // Auto-stop recording if specified
        if (autoStopAfter) {
          autoStopTimeoutRef.current = setTimeout(() => {
            stopRecording();
          }, autoStopAfter);
        }

      } catch (error) {
        console.error("Error starting recording:", error);
        throw new Error(`Failed to start recording: ${error}`);
      }
    }
  };

  /**
   * Stop recording from microphone
   */
  const stopRecording = () => {
    if (isRecording) {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }

      MicrophoneStreamModule.stopRecording();
      setIsRecording(false);
      console.log("Stopped recording");
    }
  };

  /**
   * Toggle recording state
   */
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  // Create result object
  const result: PitchDetectionResult = {
    pitch,
    note,
    cents,
    isValidPitch: pitch > 0 && note !== undefined,
  };

  // Create status object
  const status: PitchDetectionStatus = {
    micAccess,
    isRecording,
    lastBufferSize,
    sampleRate,
    result,
  };

  return {
    status,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}

/**
 * Utility function to get tuning status text based on cents
 * @param cents Cents deviation from the nearest note
 * @returns Tuning status object with text and classification
 */
export function getTuningStatus(cents: number) {
  const tolerance = 10; // cents tolerance for "in tune"

  if (Math.abs(cents) <= tolerance) {
    return {
      status: 'in-tune' as const,
      text: 'in tune',
      color: '#4CAF50', // Green
    };
  } else if (cents > tolerance) {
    return {
      status: 'sharp' as const,
      text: 'sharp',
      color: '#FF9800', // Orange
    };
  } else {
    return {
      status: 'flat' as const,
      text: 'flat',
      color: '#2196F3', // Blue
    };
  }
}

/**
 * Utility function to format cents for display
 * @param cents Cents deviation
 * @returns Formatted cents string with sign
 */
export function formatCents(cents: number): string {
  return `${cents > 0 ? '+' : ''}${cents}`;
}

/**
 * Utility function to format pitch for display
 * @param pitch Pitch in Hz
 * @param decimalPlaces Number of decimal places to show
 * @returns Formatted pitch string
 */
export function formatPitch(pitch: number, decimalPlaces: number = 1): string {
  return pitch > 0 ? `${pitch.toFixed(decimalPlaces)}Hz` : "No pitch detected";
}

/**
 * Simple pitch detection without React hooks for use in class components or outside React
 * @param audioBuffer Audio samples array
 * @param sampleRate Sample rate in Hz
 * @param options Detection options
 * @returns Pitch detection result
 */
export function detectPitch(
  audioBuffer: number[],
  sampleRate: number,
  options: {
    minFreq?: number;
    maxFreq?: number;
    threshold?: number;
  } = {}
): PitchDetectionResult {
  const {
    minFreq = PITCH_DETECTION_CONFIG.MIN_FREQ,
    maxFreq = PITCH_DETECTION_CONFIG.MAX_FREQ,
    threshold = PITCH_DETECTION_CONFIG.THRESHOLD_DEFAULT,
  } = options;

  // Estimate pitch using DSP module
  const pitch = DSPModule.pitch(audioBuffer, sampleRate, minFreq, maxFreq, threshold);

  // Convert pitch to note and cents
  const note = getNoteFromFreq(pitch);
  const cents = getNoteCents(pitch);

  return {
    pitch,
    note,
    cents,
    isValidPitch: pitch > 0 && note !== undefined,
  };
}

/**
 * Convert note name to MIDI note number
 * @param noteName The name of the note
 * @param octave The octave number (default 4 for middle octave)
 * @returns MIDI note number (0-127)
 */
export function noteToMIDI(noteName: NoteName, octave: number = 4): number {
  const noteIndex = NOTE_NAMES.indexOf(noteName);
  return (octave + 1) * 12 + noteIndex;
}

/**
 * Convert MIDI note number to note name and octave
 * @param midiNote MIDI note number (0-127)
 * @returns Object with note name and octave
 */
export function MIDIToNote(midiNote: number): { name: NoteName; octave: number } {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = midiNote % 12;
  const name = NOTE_NAMES[noteIndex];

  return { name, octave };
}

export default {
  // Constants
  PITCH_DETECTION_CONFIG,
  NOTE_NAMES,

  // Core functions
  getNoteFromFreq,
  getFreqFromNote,
  getNoteCents,
  detectPitch,

  // Utility functions
  getTuningStatus,
  formatCents,
  formatPitch,
  noteToMIDI,
  MIDIToNote,

  // Hook
  usePitchDetection,
};
