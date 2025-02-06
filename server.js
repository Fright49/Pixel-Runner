const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Routes for game data
app.get('/api/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const playerDoc = await db.collection('players').doc(playerId).get();
    
    if (!playerDoc.exists) {
      res.json({});
    } else {
      res.json(playerDoc.data());
    }
  } catch (err) {
    console.error('Error fetching player data:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { 
      highScore, 
      totalCoins, 
      purchasedUpgrades, 
      powerups,
      purchasedSkins,
      purchasedEnemySkins,
      purchasedBackgrounds 
    } = req.body;

    const playerData = {
      high_score: highScore,
      total_coins: totalCoins,
      purchased_upgrades: purchasedUpgrades,
      powerups: powerups,
      purchased_skins: purchasedSkins,
      purchased_enemy_skins: purchasedEnemySkins,
      purchased_backgrounds: purchasedBackgrounds,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('players').doc(playerId).set(playerData, { merge: true });
    res.json({ ...playerData, player_id: playerId });
  } catch (err) {
    console.error('Error saving player data:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
