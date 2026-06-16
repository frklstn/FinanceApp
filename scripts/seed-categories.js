const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedCategories() {
  const categories = [
    { name: 'Makanan & Minuman', icon: 'Utensils', color: '#f59e0b' },
    { name: 'Transportasi', icon: 'Car', color: '#3b82f6' },
    { name: 'Hiburan', icon: 'Gamepad2', color: '#8b5cf6' },
    { name: 'Belanja', icon: 'ShoppingBag', color: '#ec4899' },
    { name: 'Tagihan', icon: 'FileText', color: '#ef4444' },
    { name: 'Kesehatan', icon: 'Activity', color: '#10b981' },
  ];

  const { data, error } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'name' });

  if (error) console.error('Error seeding categories:', error);
  else console.log('Categories seeded successfully!');
}

seedCategories();
