# TuneEgg Ranking System

## Overview
The TuneEgg app now features a comprehensive ranking system based on user experience points (XP). Users progress through 12 distinct musical ranks as they use the app and complete various activities.

## Rank Progression

| Rank | Title | XP Range | Color Theme |
|------|-------|----------|-------------|
| 1 | Tone-Deaf Beginner | 0 - 99 | Brown |
| 2 | Note Novice | 100 - 249 | Gray |
| 3 | Rhythm Rookie | 250 - 499 | Bronze |
| 4 | Melody Maker | 500 - 999 | Silver |
| 5 | Harmony Hero | 1,000 - 1,999 | Gold |
| 6 | Pitch Perfect | 2,000 - 3,999 | Cyan |
| 7 | Tempo Master | 4,000 - 7,999 | Purple |
| 8 | Scale Sage | 8,000 - 15,999 | Coral |
| 9 | Chord Champion | 16,000 - 31,999 | Pink |
| 10 | Symphony Virtuoso | 32,000 - 63,999 | Crimson |
| 11 | Musical Maestro | 64,000 - 127,999 | Royal Blue |
| 12 | Legendary Composer | 128,000+ | Orange (Max Rank) |

## Features

### Profile Screen
- **Rank Badge**: Displays current rank with themed colors
- **Experience Points**: Shows total XP with formatted display (e.g., "1.2K XP")
- **Progress Bar**: Visual progress toward next rank
- **Next Rank Info**: Shows what rank is coming next and XP required
- **Detailed Stats**: Current rank info in the details section

### Utility Functions
- `getTitleAndRank(experience)`: Get complete rank information
- `formatExperience(experience)`: Format XP for display (1.2K, 15M, etc.)
- `getExpToNextRank(experience)`: Calculate XP needed for next rank
- `isRankUp(currentExp, newExp)`: Check if user ranked up
- `getAllRanks()`: Get all available ranks

### Reusable Components
- `RankDisplay`: Flexible component for showing rank info
  - Compact mode for small displays
  - Full mode with progress bars
  - Customizable progress visibility

## Usage Examples

### Basic Rank Display
```tsx
import { RankDisplay } from '../components/RankDisplay';

// Full display with progress
<RankDisplay experience={1500} showProgress={true} />

// Compact display for headers/lists
<RankDisplay experience={1500} compact={true} />
```

### Check for Rank Up
```tsx
import { isRankUp, getTitleAndRank } from '../utils/rankingUtils';

const handleExperienceGain = (oldExp: number, newExp: number) => {
  if (isRankUp(oldExp, newExp)) {
    const newRank = getTitleAndRank(newExp);
    showRankUpNotification(newRank.current.title);
  }
};
```

## Implementation Notes

1. **Experience Tracking**: The database already has an `experience` column in the users table
2. **Color Consistency**: Each rank has both text and background colors for consistent theming
3. **Progress Calculation**: Smooth progress bars show exact percentage to next rank
4. **Scalability**: Easy to add new ranks or modify existing ones in `rankingUtils.ts`
5. **Performance**: Lightweight calculations with caching-friendly design

## Future Enhancements

- **Rank Icons**: Add unique icons for each rank
- **Rank Benefits**: Special features unlocked at certain ranks
- **Leaderboards**: Compare ranks with other users
- **Achievement Integration**: Award XP for specific accomplishments
- **Rank History**: Track user's ranking progression over time
