// Utility script to combine Matt Slagel and Matthew Slagel records
// Run this in the browser console on the golf trip manager page

function combineSlagelRecords() {
  console.log('Starting Slagel record combination...');
  
  try {
    // Load current data from localStorage
    const players = JSON.parse(localStorage.getItem('golfPlayers') || '[]');
    const rounds = JSON.parse(localStorage.getItem('golfRounds') || '[]');
    const trips = JSON.parse(localStorage.getItem('golfTrips') || '[]');
    
    console.log('Current players:', players);
    console.log('Current rounds:', rounds);
    
    // Find Matt Slagel and Matthew Slagel records
    const mattSlagel = players.find(p => p.name.toLowerCase().includes('matt slagel') && !p.name.toLowerCase().includes('matthew'));
    const matthewSlagel = players.find(p => p.name.toLowerCase().includes('matthew slagel'));
    
    console.log('Matt Slagel record:', mattSlagel);
    console.log('Matthew Slagel record:', matthewSlagel);
    
    if (!mattSlagel && !matthewSlagel) {
      console.log('No Slagel records found in the data.');
      return;
    }
    
    if (!mattSlagel && matthewSlagel) {
      // Only Matthew Slagel exists, rename to Matt Slagel
      console.log('Only Matthew Slagel found, renaming to Matt Slagel...');
      const updatedPlayers = players.map(p => 
        p.id === matthewSlagel.id 
          ? { ...p, name: 'Matt Slagel' }
          : p
      );
      localStorage.setItem('golfPlayers', JSON.stringify(updatedPlayers));
      console.log('Successfully renamed Matthew Slagel to Matt Slagel');
      return;
    }
    
    if (mattSlagel && !matthewSlagel) {
      console.log('Only Matt Slagel found, no action needed.');
      return;
    }
    
    if (mattSlagel && matthewSlagel) {
      // Both exist, need to combine them
      console.log('Both Matt Slagel and Matthew Slagel found, combining records...');
      
      // Update all rounds that reference Matthew Slagel to use Matt Slagel's ID
      const updatedRounds = rounds.map(round => 
        round.playerId === matthewSlagel.id 
          ? { ...round, playerId: mattSlagel.id }
          : round
      );
      
      // Update any trips that have Matthew Slagel as champion
      const updatedTrips = trips.map(trip => 
        trip.championPlayerId === matthewSlagel.id 
          ? { ...trip, championPlayerId: mattSlagel.id }
          : trip
      );
      
      // Remove Matthew Slagel from players array
      const updatedPlayers = players.filter(p => p.id !== matthewSlagel.id);
      
      // Save updated data
      localStorage.setItem('golfPlayers', JSON.stringify(updatedPlayers));
      localStorage.setItem('golfRounds', JSON.stringify(updatedRounds));
      localStorage.setItem('golfTrips', JSON.stringify(updatedTrips));
      
      console.log('Successfully combined records:');
      console.log('- Removed Matthew Slagel from players');
      console.log('- Updated', rounds.filter(r => r.playerId === matthewSlagel.id).length, 'rounds to use Matt Slagel ID');
      console.log('- Updated', trips.filter(t => t.championPlayerId === matthewSlagel.id).length, 'trips to use Matt Slagel as champion');
      console.log('- Kept Matt Slagel as the primary record');
    }
    
  } catch (error) {
    console.error('Error combining Slagel records:', error);
  }
}

// Function to check current data state
function checkSlagelData() {
  console.log('Checking current Slagel data...');
  
  try {
    const players = JSON.parse(localStorage.getItem('golfPlayers') || '[]');
    const rounds = JSON.parse(localStorage.getItem('golfRounds') || '[]');
    const trips = JSON.parse(localStorage.getItem('golfTrips') || '[]');
    
    const slagelPlayers = players.filter(p => 
      p.name.toLowerCase().includes('slagel')
    );
    
    console.log('Slagel players found:', slagelPlayers);
    
    if (slagelPlayers.length > 0) {
      slagelPlayers.forEach(player => {
        const playerRounds = rounds.filter(r => r.playerId === player.id);
        const championTrips = trips.filter(t => t.championPlayerId === player.id);
        
        console.log(`\n${player.name} (ID: ${player.id}):`);
        console.log('- Rounds:', playerRounds.length);
        console.log('- Champion trips:', championTrips.length);
        
        if (playerRounds.length > 0) {
          console.log('- Round details:', playerRounds);
        }
      });
    } else {
      console.log('No Slagel players found in the data.');
    }
    
  } catch (error) {
    console.error('Error checking Slagel data:', error);
  }
}

// Export functions for use in browser console
window.combineSlagelRecords = combineSlagelRecords;
window.checkSlagelData = checkSlagelData;

console.log('Slagel record combination utilities loaded!');
console.log('Use checkSlagelData() to see current state');
console.log('Use combineSlagelRecords() to combine Matt and Matthew Slagel records');
