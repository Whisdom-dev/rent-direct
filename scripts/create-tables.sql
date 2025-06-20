-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  rent INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  property_type VARCHAR(50),
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  landlord_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  property_id UUID REFERENCES properties(id),
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exit_notifications table
CREATE TABLE IF NOT EXISTS exit_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES auth.users(id),
  exit_date DATE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for properties
CREATE POLICY "Properties are viewable by everyone" ON properties
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Users can update their own properties" ON properties
  FOR UPDATE USING (auth.uid() = landlord_id);

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for exit_notifications
CREATE POLICY "Exit notifications are viewable by everyone" ON exit_notifications
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own exit notifications" ON exit_notifications
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);
