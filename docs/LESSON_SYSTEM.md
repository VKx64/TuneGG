# Lesson System Documentation

## Overview
The lesson system is designed to teach users how to play musical notes with different difficulty levels and voice guides.

## Components

### 1. Lessons.tsx (Main Entry Point)
- Displays three difficulty levels: Easy, Medium, and Hard
- Shows progress statistics
- Provides quick access to individual notes
- **Easy Chords**: A, C, D, E, G (5 notes)
- **Medium Chords**: B, F (2 notes)
- **Hard Chords**: A#, C#, D#, F#, G# (5 sharp notes)

### 2. LessonNotes.tsx
- Shows all notes within a selected difficulty level
- Displays learning tips and practice guidance
- Allows navigation to individual note lessons

### 3. LessonNote.tsx
- Individual note learning interface
- Displays both male and female voice guide images
- Voice guide selection (male/female)
- Audio playback for voice guides (placeholder implementation)
- Step-by-step learning instructions

### 4. Lesson.tsx
- Simple re-export of the main Lessons component
- Maintains compatibility with existing navigation

## Assets
The lesson system uses voice guide images located in `/src/assets/lessons/`:
- Male guides: `AMale.jpg`, `BMale.jpg`, etc.
- Female guides: `AFemale.png`, `BFemale.png`, etc.
- Sharp notes: `ASHARPMale.jpg`, `ASHARPFemale.png`, etc.

## Navigation Flow
1. User starts at Lessons component (difficulty selection)
2. Selects difficulty → navigates to LessonFlow for sequential learning
3. **Sequential Flow**: Ready → Learn Note 1 → Listen & Detect → Success → Learn Note 2 → ... → Complete
4. Quick practice option navigates directly to single-note LessonFlow

## Learning States in LessonFlow
1. **Ready**: Welcome screen explaining the sequence
2. **Learning**: Shows current note with visual guides
3. **Listening**: Real-time pitch detection and feedback
4. **Success**: Confirmation before moving to next note
5. **Completed**: Final congratulations and statistics

## Features
- ✅ **Sequential note progression** (no skipping ahead)
- ✅ **Real-time pitch detection** using DSP module
- ✅ **Visual learning guides** (paired images for each note)
- ✅ **Progress tracking** with visual indicators
- ✅ **Microphone integration** with permission handling
- ✅ **Accuracy feedback** (cents deviation display)
- ✅ **Auto-progression** through difficulty levels
- ✅ **Responsive design** with difficulty-based color coding
- 🚧 Audio playback (placeholder - requires expo-av)
- 🚧 XP/scoring system integration
- 🚧 Progress persistence across sessions

## Integration
The lesson system is integrated into the main navigation stack and can be accessed from the bottom tab navigation under "Lesson".