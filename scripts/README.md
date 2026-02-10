# Migration Scripts

This directory contains data migration scripts for the Maestro Platform.

## Supabase to Firebase Migration

The `migrate-supabase-to-firebase.ts` script migrates all data from Supabase (PostgreSQL) to Firebase (Firestore).

### Prerequisites

1. **Node.js 18+** with TypeScript support
2. **Environment variables** configured (see below)
3. **tsx** package for running TypeScript: `npm install -g tsx`

### Environment Variables

Create a `.env.local` file in the project root or export these variables:

```bash
# Supabase (source)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Or use these alternative names:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Firebase (destination)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Or for project ID:
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
```

### Tables Migrated

The script migrates these tables in order (respecting dependencies):

| Supabase Table | Firestore Collection |
|----------------|---------------------|
| users | users |
| learner_profiles | learnerProfiles |
| aku_progress | akuProgress |
| chat_sessions | chatSessions |
| certificates | certificates |
| subscriptions | subscriptions |
| certification_submissions | certificationSubmissions |
| live_courses | liveCourses |
| live_sessions | liveSessions |
| course_enrollments | courseEnrollments |
| session_enrollments | sessionEnrollments |

### Usage

#### Dry Run (Preview Mode)

Preview what will be migrated without writing any data:

```bash
npx tsx scripts/migrate-supabase-to-firebase.ts --dry-run
```

This will:
- Connect to both databases
- Fetch record counts from each table
- Show sample transformed documents
- Print a summary without writing anything

#### Live Migration

Run the actual migration:

```bash
npx tsx scripts/migrate-supabase-to-firebase.ts
```

### Features

- **Batch Writes**: Writes documents in batches of 500 for efficiency
- **Retry Logic**: Automatic retry with exponential backoff on failures
- **Progress Logging**: Real-time progress updates with timestamps
- **Field Conversion**: Automatically converts snake_case to camelCase
- **Timestamp Handling**: Properly converts ISO strings to Firestore Timestamps
- **Error Handling**: Graceful error handling with detailed error messages
- **Pagination**: Handles large tables by paginating through records

### Output Example

```
======================================================================
  SUPABASE -> FIREBASE DATA MIGRATION
  DRY RUN MODE - No data will be written
======================================================================

2024-02-10T10:30:00.000Z [DRY-RUN] Starting migration: users -> users
2024-02-10T10:30:01.000Z [DRY-RUN] Found 150 records in 'users'
2024-02-10T10:30:01.000Z [DRY-RUN] Would write 150 documents to 'users'
...

======================================================================
  MIGRATION SUMMARY
======================================================================

Table                         Collection               Records   Status
----------------------------------------------------------------------
users                         users                    150       OK
learner_profiles              learnerProfiles          145       OK
aku_progress                  akuProgress              2340      OK
...
----------------------------------------------------------------------

Total: 5000 records processed
Success: 11 tables
Duration: 45.32s

[DRY-RUN] No data was written. Run without --dry-run to perform actual migration.
======================================================================
```

### Troubleshooting

**"Supabase credentials not configured"**
- Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set
- The service key must be the "service_role" key, not the "anon" key

**"Firebase credentials not configured"**
- Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY
- The private key must have newlines properly escaped or quoted

**"Permission denied" errors**
- Ensure the Supabase service role key has access to all tables
- Ensure the Firebase service account has write access to Firestore

**Large datasets timing out**
- The script handles pagination automatically
- Increase the timeout by setting `MIGRATION_TIMEOUT` if needed

### Customization

To add new tables or modify transformations, edit the `TABLE_MAPPINGS` array in the script.

Each mapping has:
- `supabaseTable`: Source table name
- `firestoreCollection`: Destination collection name
- `idField`: Field to use as document ID (defaults to 'id')
- `transform`: Optional function to transform records
