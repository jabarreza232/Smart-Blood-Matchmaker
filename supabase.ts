import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
const EXPO_PUBLIC_SUPABASE_URL='https://jggwwcxutxzbanqkujwk.supabase.co'
const EXPO_PUBLIC_SUPABASE_KEY='sb_publishable_lvPhRnMs2SrPnGZ_MaO0ng_-GxLjC02'
export const supabase = createClient(
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })