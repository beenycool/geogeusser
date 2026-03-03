-- Drop existing tables
DROP TABLE IF EXISTS guesses;
DROP TABLE IF EXISTS rounds;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS parties;

-- Parties Table
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_round INT DEFAULT 1,
    total_rounds INT DEFAULT 5,
    host_id UUID -- We'll set this when the host joins
);

-- Players Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    nickname VARCHAR(50) NOT NULL,
    score INT DEFAULT 0,
    is_host BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rounds Table
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    location_id VARCHAR(50) NOT NULL, -- Mapillary Image ID
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    location_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(party_id, round_number)
);

-- Guesses Table
CREATE TABLE guesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    distance DOUBLE PRECISION NOT NULL, -- distance in meters
    score INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(round_id, player_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (since we are not using auth)
CREATE POLICY "Allow anonymous read access on parties" ON parties FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on parties" ON parties FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on parties" ON parties FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read access on players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on players" ON players FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read access on rounds" ON rounds FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on rounds" ON rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on rounds" ON rounds FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous read access on guesses" ON guesses FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert on guesses" ON guesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update on guesses" ON guesses FOR UPDATE USING (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE parties;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE guesses;
