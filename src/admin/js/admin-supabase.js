import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'rce_admin_session',
  }
})

export async function updateVerificationStatus(tableName, id, nextStatus) {
  const { data, error } = await supabase.rpc('set_verification_status', {
    table_name: tableName,
    row_id: String(id),
    next_status: nextStatus,
  })

  if (error) throw error
  return data
}