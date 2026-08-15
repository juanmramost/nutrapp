#!/usr/bin/env node
import { Client } from 'pg'

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

const policies = [
  {
    name: 'upload_own',
    sql: `CREATE POLICY upload_own ON storage.objects
  FOR INSERT USING (
    auth.role() = 'authenticated'
    AND name LIKE ('uploads/' || auth.uid() || '/%')
  );`,
  },
  {
    name: 'select_own',
    sql: `CREATE POLICY select_own ON storage.objects
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND name LIKE ('uploads/' || auth.uid() || '/%')
  );`,
  },
  {
    name: 'delete_own',
    sql: `CREATE POLICY delete_own ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND name LIKE ('uploads/' || auth.uid() || '/%')
  );`,
  },
]

async function applyPolicies() {
  if (!dbUrl) {
    console.log('No SUPABASE_DB_URL / DATABASE_URL provided.');
    console.log('Run these statements in Supabase SQL editor:')
    console.log('------------------------------------------------')
    for (const p of policies) console.log(p.sql + '\n')
    console.log('------------------------------------------------')
    console.log('If you want to apply automatically, set SUPABASE_DB_URL to your project Postgres URL and re-run this script.')
    process.exit(0)
  }

  const client = new Client({ connectionString: dbUrl })
  await client.connect()
  try {
    // Ensure RLS enabled
    const rlsRes = await client.query("SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname='storage' AND c.relname='objects'")
    const rlsEnabled = rlsRes.rows[0] && rlsRes.rows[0].relrowsecurity
    if (!rlsEnabled) {
      console.log('Enabling RLS on storage.objects')
      await client.query('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY')
    } else {
      console.log('RLS already enabled on storage.objects')
    }

    for (const p of policies) {
      const check = await client.query(
        `SELECT count(*) as cnt FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON pol.polrelid = c.oid JOIN pg_catalog.pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'storage' AND c.relname = 'objects' AND pol.polname = $1`,
        [p.name]
      )
      if (parseInt(check.rows[0].cnt, 10) === 0) {
        console.log(`Applying policy ${p.name}...`)
        await client.query(p.sql)
      } else {
        console.log(`Policy ${p.name} already exists, skipping.`)
      }
    }
    console.log('Policies applied successfully.')
  } catch (err) {
    console.error('Error applying policies:', err.message || err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

applyPolicies()
