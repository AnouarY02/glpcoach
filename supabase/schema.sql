-- GlpCoach Database Schema
-- Enable RLS on all tables

-- Users profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  medication_type TEXT NOT NULL DEFAULT 'ozempic',
  dose_mg DECIMAL(4,2) NOT NULL DEFAULT 0.25,
  injection_day INTEGER NOT NULL DEFAULT 1, -- 0=Sun, 1=Mon...
  start_date DATE,
  start_weight_kg DECIMAL(5,2),
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  goal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Injections table
CREATE TABLE injections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  injected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dose_mg DECIMAL(4,2) NOT NULL,
  site TEXT NOT NULL CHECK (site IN ('buik', 'dij', 'arm')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Symptoms table
CREATE TABLE symptoms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  notes TEXT,
  cycle_day INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meals table
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL,
  protein_estimate_g INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weight logs table
CREATE TABLE weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily check-ins table
CREATE TABLE daily_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_ml INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  ai_coaching_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE injections ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users own data" ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own injections" ON injections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own symptoms" ON symptoms FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own meals" ON meals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own weight_logs" ON weight_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own checkins" ON daily_checkins FOR ALL USING (auth.uid() = user_id);

-- Updated_at trigger for user_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-create user_profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Indexes for performance
CREATE INDEX idx_injections_user_id ON injections(user_id);
CREATE INDEX idx_injections_injected_at ON injections(injected_at DESC);
CREATE INDEX idx_symptoms_user_id ON symptoms(user_id);
CREATE INDEX idx_symptoms_logged_at ON symptoms(logged_at DESC);
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_meals_logged_at ON meals(logged_at DESC);
CREATE INDEX idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX idx_weight_logs_logged_at ON weight_logs(logged_at DESC);
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, date DESC);

-- Coach messages table (persistent chat history)
CREATE TABLE coach_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own coach_messages" ON coach_messages FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_coach_messages_user_id ON coach_messages(user_id);
CREATE INDEX idx_coach_messages_created_at ON coach_messages(created_at DESC);
