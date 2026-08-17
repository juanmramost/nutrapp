#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Error: set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false } })

async function run() {
  const bucket = 'uploads'
  try {
    const { error } = await admin.storage.createBucket(bucket, { public: false })
    if (error) {
      // If bucket already exists, supabase returns an error; handle gracefully
      if (error.message && /already exists/i.test(error.message)) {
        console.log(`Bucket '${bucket}' already exists.`)
      } else {
        throw error
      }
    } else {
      console.log(`Bucket '${bucket}' created.`)
    }
  } catch (err) {
    console.error('Error creating bucket:', err.message || err)
    process.exit(1)
  }

  console.log('\nRecommended SQL policies to run in Supabase SQL editor:')
  console.log('--------------------------------------------------------------------------------')
  console.log(`-- Allow authenticated users to upload files to their own folder\nCREATE POLICY upload_own ON storage.objects\n  FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated' AND name LIKE ('uploads/' || auth.uid() || '/%'));\n`)
  console.log(`-- Allow authenticated users to read their own files\nCREATE POLICY select_own ON storage.objects\n  FOR SELECT USING (bucket_id = 'uploads' AND auth.role() = 'authenticated' AND name LIKE ('uploads/' || auth.uid() || '/%'));\n`)
  console.log(`-- Allow authenticated users to delete their own files\nCREATE POLICY delete_own ON storage.objects\n  FOR DELETE USING (bucket_id = 'uploads' AND auth.role() = 'authenticated' AND name LIKE ('uploads/' || auth.uid() || '/%'));\n`)
  console.log('--------------------------------------------------------------------------------')
  console.log('\nNotes:')
  console.log('- These policies assume client uploads to paths like uploads/{userId}/...')
  console.log('- Run the SQL in Supabase -> SQL editor (requires project owner privileges)')
  console.log('- The script only creates the bucket. Apply policies manually in the SQL editor.')
}

run()
