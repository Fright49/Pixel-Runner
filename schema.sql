CREATE DATABASE game_db;

\c game_db;

CREATE TABLE player_data (
    player_id VARCHAR(255) PRIMARY KEY,
    high_score INTEGER DEFAULT 0,
    total_coins INTEGER DEFAULT 0,
    purchased_upgrades JSONB DEFAULT '{}',
    powerups JSONB DEFAULT '{}',
    purchased_skins JSONB DEFAULT '{}',
    purchased_enemy_skins JSONB DEFAULT '{}',
    purchased_backgrounds JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 