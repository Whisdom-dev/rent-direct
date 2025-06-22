// Debug script to check verification requests
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugVerificationRequests() {
  console.log('🔍 Checking verification requests...')
  
  try {
    // Check if verification_requests table exists and has data
    const { data: requests, error: requestsError } = await supabase
      .from('verification_requests')
      .select('*')
    
    if (requestsError) {
      console.error('❌ Error fetching verification requests:', requestsError)
      return
    }
    
    console.log(`📋 Found ${requests.length} verification requests:`)
    requests.forEach((req, index) => {
      console.log(`${index + 1}. User ID: ${req.user_id}, Type: ${req.request_type}, Status: ${req.status}, Submitted: ${req.submitted_at}`)
    })
    
    // Check users table for verification status
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, user_type, verification_status')
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`\n👥 Found ${users.length} users:`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Type: ${user.user_type}, Status: ${user.verification_status}`)
    })
    
    // Check admin_users table
    const { data: admins, error: adminsError } = await supabase
      .from('admin_users')
      .select('*')
    
    if (adminsError) {
      console.error('❌ Error fetching admin users:', adminsError)
      return
    }
    
    console.log(`\n👑 Found ${admins.length} admin users:`)
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Admin ID: ${admin.id}, Role: ${admin.role}`)
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugVerificationRequests() 