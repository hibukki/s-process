import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://mhhndkyzhftujcsrhffm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaG5ka3l6aGZ0dWpjc3JoZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1MzIxMzUsImV4cCI6MjA1NDEwODEzNX0.sC8JPVlLEQyp5Gk1pI2YXSAsStDY8a-BylA4IjyPnxE'
) 