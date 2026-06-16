const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabaseUrl = 'https://kortbujyuafwdiqxsiok.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvcnRidWp5dWFmd2RpcXhzaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODE2MjksImV4cCI6MjA5NDY1NzYyOX0.gceG3ophu4c4UVFbfFnUMgJVqTI_UbVde5tYPXv8UBQ';

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('Registering Ifal Fahlevi superadmin account...');

  const acc = { email: 'ifalfahlevi4@gmail.com', name: 'Ifal Fahlevi', password: '19842204' };

  try {
    console.log(`Signing up ${acc.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: acc.email,
      password: acc.password,
      options: {
        data: {
          full_name: acc.name,
          is_admin: true
        }
      }
    });

    if (error) {
      console.error(`Failed to register ${acc.email}:`, error.message);
    } else {
      console.log(`Successfully registered ${acc.email}!`, data.user ? data.user.id : '');
    }
  } catch (err) {
    console.error(err.message);
  }
}

run();
