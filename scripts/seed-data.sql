-- First, delete any conversations linked to the specific seed properties to avoid foreign key errors.
DELETE FROM conversations
WHERE property_id IN (
  SELECT id FROM properties
  WHERE title IN (
    'Spacious Downtown Loft',
    'Cozy Suburban House',
    'Modern Studio Apartment',
    'Luxury Condo with a View',
    'Shared Room in House'
  )
);

-- Now, delete only the specific seed properties to prevent duplicates
DELETE FROM properties
WHERE title IN (
  'Spacious Downtown Loft',
  'Cozy Suburban House',
  'Modern Studio Apartment',
  'Luxury Condo with a View',
  'Shared Room in House'
);

-- Insert sample properties
INSERT INTO properties (landlord_id, title, description, location, rent, bedrooms, bathrooms, property_type, image_url, available) VALUES
('13f02c94-f702-40b9-9484-ca4d17e58c73', 'Spacious Downtown Loft', 'A beautiful and spacious loft in the heart of the city, perfect for professionals.', 'Downtown', 1800, 2, 2, 'apartment', '/placeholder-property-v2.jpg', true),
('13f02c94-f702-40b9-9484-ca4d17e58c73', 'Cozy Suburban House', 'Charming 3-bedroom house with a large backyard, perfect for families.', 'Suburbia', 2200, 3, 2, 'house', '/placeholder-property-v2.jpg', true),
('13f02c94-f702-40b9-9484-ca4d17e58c73', 'Modern Studio Apartment', 'A sleek and modern studio apartment with all the amenities, close to public transport.', 'University District', 900, 1, 1, 'studio', '/placeholder-property-v2.jpg', true),
('13f02c94-f702-40b9-9484-ca4d17e58c73', 'Luxury Condo with a View', 'Stunning condo with panoramic city views and high-end finishes.', 'Uptown', 2800, 2, 2, 'condo', '/placeholder-property-v2.jpg', true),
('13f02c94-f702-40b9-9484-ca4d17e58c73', 'Shared Room in House', 'Furnished room in a shared house with common areas and utilities included.', 'Midtown', 650, 1, 1, 'room', '/placeholder-property-v2.jpg', true);
