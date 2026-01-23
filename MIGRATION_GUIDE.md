# Sequelize Migrations Setup Guide

## Prerequisites
Ensure you have the following installed:
- Node.js and npm
- PostgreSQL database (Neon Cloud or local)
- Sequelize CLI: `npm install --save-dev sequelize-cli`

## Migration Files Created
All migration files are located in `migrations/` directory with timestamp prefixes to ensure correct execution order:

1. `20260123000001-create-shops.js`
2. `20260123000002-create-users.js`
3. `20260123000003-create-categories.js`
4. `20260123000004-create-products.js`
5. `20260123000005-create-transactions.js` ⚠️ **Uses UUID**
6. `20260123000006-create-transaction-items.js`
7. `20260123000007-create-purchases.js`
8. `20260123000008-create-purchase-items.js`
9. `20260123000009-create-shifts.js`

## Step-by-Step Migration Process

### 1. Verify Database Configuration
Ensure `config/db.js` exports both the `sequelize` instance and the `config` object:

```javascript
module.exports = config;
module.exports.sequelize = sequelize;
```

### 2. Check Sequelize CLI Configuration
Verify `.sequelizerc` points to the correct paths:

```javascript
const path = require('path');

module.exports = {
    'config': path.resolve('config', 'db.js'),
    'models-path': path.resolve('models'),
    'seeders-path': path.resolve('seeders'),
    'migrations-path': path.resolve('migrations')
};
```

### 3. Run Migrations
Execute the following commands in the `USAHAKU_BE` directory:

```bash
# Navigate to backend directory
cd USAHAKU_BE

# Run all pending migrations
npx sequelize-cli db:migrate

# Expected output:
# == 20260123000001-create-shops: migrating =======
# == 20260123000001-create-shops: migrated (0.123s)
# == 20260123000002-create-users: migrating =======
# ... (continues for all 9 migrations)
```

### 4. Verify Migration Status
Check which migrations have been applied:

```bash
npx sequelize-cli db:migrate:status

# Expected output:
# up 20260123000001-create-shops.js
# up 20260123000002-create-users.js
# ... (all 9 migrations should show "up")
```

### 5. Test Rollback (Optional)
To verify rollback functionality:

```bash
# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Re-run migrations
npx sequelize-cli db:migrate
```

### 6. Remove sequelize.sync() from index.js
Update `index.js` to remove the old sync method:

**BEFORE:**
```javascript
await sequelize.sync({ alter: true });
console.log('Database synced');
```

**AFTER:**
```javascript
// Migrations are now managed via sequelize-cli
// Run: npx sequelize-cli db:migrate
console.log('Database ready (use migrations)');
```

## Important Notes

### UUID for Transactions
⚠️ **Breaking Change**: The `Transactions` table now uses UUID as the primary key instead of auto-increment INTEGER.

**Impact on Mobile App:**
- The Flutter app's `TransactionHive` model already uses `String id`, which is compatible with UUIDs.
- When creating transactions offline, the mobile app should generate UUIDs using the `uuid` package:

```dart
import 'package:uuid/uuid.dart';

final transaction = TransactionHive(
  id: const Uuid().v4(), // Generate UUID client-side
  // ... other fields
);
```

### Delta Sync Indexes
All tables with `is_deleted` have composite indexes optimized for Delta Sync queries:
- `(shop_id, updatedAt, is_deleted)`

This significantly improves performance for queries like:
```sql
SELECT * FROM Products 
WHERE shop_id = ? 
  AND updatedAt > ? 
  AND is_deleted = false
```

### Foreign Key Constraints
All foreign keys are configured with:
- `onUpdate: CASCADE` - Updates propagate to child tables
- `onDelete: CASCADE` or `SET NULL` - Appropriate deletion behavior

## Troubleshooting

### Error: "relation already exists"
If tables already exist from previous `sequelize.sync()` calls:

```bash
# Option 1: Drop all tables manually
psql -d your_database -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Option 2: Use a fresh database
# Create a new database in Neon Cloud and update DATABASE_URL
```

### Error: "config is not a function"
Ensure `config/db.js` exports the config object:

```javascript
module.exports = config;
module.exports.sequelize = sequelize;
```

### Migration fails with foreign key error
Ensure migrations run in the correct order (timestamps ensure this automatically).

## Next Steps

1. ✅ Run migrations on development database
2. ✅ Test CRUD operations with new schema
3. ✅ Update mobile app to generate UUIDs for transactions
4. ✅ Test offline transaction creation and sync
5. ✅ Deploy migrations to production (Neon Cloud)

## Production Deployment

For production deployment on Vercel:

1. Ensure `DATABASE_URL` environment variable is set
2. Add migration command to deployment script:

```json
// package.json
{
  "scripts": {
    "migrate": "sequelize-cli db:migrate",
    "start": "npm run migrate && node index.js"
  }
}
```

3. Update Vercel build settings to run migrations before starting the server.
