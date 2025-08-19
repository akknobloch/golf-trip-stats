# Data Management Guide

This guide explains how to manage and clean up your golf trip data, particularly for combining duplicate player records.

## Combining Player Records

### Quick Method (Recommended)

1. **Navigate to Admin Panel**: Go to `/admin` in your golf trip manager
2. **Open Data Management Tab**: Click on the "Data Management" tab
3. **Use Quick Actions**: Click the "Combine Matt Slagel & Matthew Slagel" button
4. **Confirm Success**: You'll see a success message if the operation completes

### Manual Method (Browser Console)

If you prefer to run the operation manually, you can use the provided utility script:

1. **Open Browser Console**: Press F12 and go to the Console tab
2. **Load the Utility Script**: Copy and paste the contents of `combine-slagel-records.js` into the console
3. **Check Current Data**: Run `checkSlagelData()` to see the current state
4. **Combine Records**: Run `combineSlagelRecords()` to perform the merge

## What Happens During a Merge

When you combine player records, the system:

1. **Keeps the Primary Player**: Matt Slagel remains as the main record
2. **Updates All References**: All rounds, trips, and other data that referenced Matthew Slagel are updated to reference Matt Slagel
3. **Removes Duplicate**: The Matthew Slagel player record is removed
4. **Preserves All Data**: No golf scores or statistics are lost

## Finding Potential Duplicates

The Data Management tab automatically scans your data for potential duplicate players by:

- **Exact Name Matches**: Players with identical names (case-insensitive)
- **Common Name Variations**: Matt/Matthew, Mike/Michael, Joe/Joseph, etc.
- **Same Last Names**: Players with similar first names and identical last names

## Data Safety

- **Backup Recommended**: Before performing any data operations, consider exporting your data
- **No Data Loss**: The merge operation preserves all golf scores and statistics
- **Reversible**: You can always re-import data if needed

## Technical Details

The merge operation updates these data structures:

- **Players**: Removes the secondary player record
- **Rounds**: Updates `playerId` references from secondary to primary player
- **Trips**: Updates `championPlayerId` references if the secondary player was a champion
- **Statistics**: Automatically recalculated when data is reloaded

## Troubleshooting

### "Player not found" Error
- Ensure both player names exist exactly as expected
- Check for extra spaces or different spellings

### "No Slagel records found"
- The data doesn't contain any players with "Slagel" in their name
- Verify the player names in your data

### Data Not Updating
- Refresh the page after the merge operation
- Check the browser console for any error messages

## Advanced Usage

For more complex data management scenarios, you can use the utility functions directly:

```javascript
// Merge any two players
const result = mergePlayerRecords('Primary Player Name', 'Secondary Player Name');

// Find all potential duplicates
const duplicates = findPotentialDuplicates();

// Check specific player data
const players = JSON.parse(localStorage.getItem('golfPlayers') || '[]');
const rounds = JSON.parse(localStorage.getItem('golfRounds') || '[]');
```

## Support

If you encounter any issues with data management operations, please:

1. Check the browser console for error messages
2. Verify your data structure is intact
3. Consider exporting your data as a backup before troubleshooting
