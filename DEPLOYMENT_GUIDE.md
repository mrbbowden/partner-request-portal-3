# Partner Request Portal - Deployment Guide

This guide ensures safe and consistent deployments with proper schema validation and backup procedures.

## 🛡️ Safety First - Schema Protection

The Partner Request Portal includes multiple safety mechanisms to prevent database schema mismatches:

### 1. Schema Validation Scripts

**Full Validation** (`npm run validate:schema`):
- Comprehensive schema validation against expected code schema
- Checks data types, constraints, and column definitions
- Detailed error reporting with specific issues

**Quick Check** (`npm run check:schema`):
- Fast validation of required columns
- Simple pass/fail output
- Good for CI/CD pipelines

### 2. Safe Deployment Process

**Safe Deployment** (`npm run deploy:safe`):
- Pre-deployment schema validation
- Automatic database backup
- Post-deployment validation
- Health checks
- Rollback capability

**Standard Deployment** (`npm run deploy`):
- Basic deployment without safety checks
- Use only when you're confident about the schema

## 📋 Pre-Deployment Checklist

Before deploying, always run:

```bash
# 1. Validate current schema
npm run validate:schema

# 2. Create backup
npm run backup:db

# 3. Check for any warnings
npm run check:schema
```

## 🚀 Deployment Commands

### Safe Deployment (Recommended)
```bash
npm run deploy:safe
```

This command:
- ✅ Validates database schema before deployment
- ✅ Creates automatic backup
- ✅ Builds the application
- ✅ Deploys to Cloudflare
- ✅ Validates schema after deployment
- ✅ Performs health checks

### Manual Deployment
```bash
# Build and deploy
npm run build
npm run deploy

# Or use the full deployment script
npm run deploy:full
```

## 🔍 Schema Validation Commands

### Full Schema Validation
```bash
npm run validate:schema
```

**What it checks:**
- Partners table: `id`, `partner_name`, `referring_case_manager`, `case_manager_email`, `case_manager_phone`
- Requests table: All 15 required columns with correct types and constraints
- Data type compatibility
- Primary key constraints
- Foreign key relationships

### Quick Schema Check
```bash
npm run check:schema
```

**What it checks:**
- Required columns exist
- No missing critical fields
- Fast validation for CI/CD

## 💾 Database Backup

### Automatic Backup
```bash
npm run backup:db
```

**Creates:**
- `backups/backup_YYYYMMDD_HHMMSS/`
  - `partners.sql` - Partners table data
  - `requests.sql` - Requests table data
  - `schema.sql` - Database schema
  - `backup_info.txt` - Backup information

### Manual Backup
```bash
# Backup specific table
wrangler d1 execute partner-portal-db --command="SELECT * FROM partners;" --remote > backup_partners.sql

# Backup schema
wrangler d1 execute partner-portal-db --command="SELECT sql FROM sqlite_master WHERE type='table';" --remote > backup_schema.sql
```

## 🚨 Emergency Procedures

### If Schema Validation Fails

1. **Don't deploy** - Fix the schema first
2. **Check the error messages** from validation scripts
3. **Restore from backup** if needed:
   ```bash
   # Find latest backup
   ls -la backups/
   
   # Restore schema
   wrangler d1 execute partner-portal-db --file=backups/backup_YYYYMMDD_HHMMSS/schema.sql --remote
   ```

### If Deployment Fails

1. **Check the logs** for specific errors
2. **Verify database connectivity**
3. **Run schema validation** to ensure database integrity
4. **Restore from backup** if database is corrupted

## 📊 Expected Database Schema

### Partners Table
```sql
CREATE TABLE partners (
  id VARCHAR(4) PRIMARY KEY,
  partner_name TEXT NOT NULL,
  referring_case_manager TEXT NOT NULL,
  case_manager_email TEXT NOT NULL,
  case_manager_phone TEXT NOT NULL
);
```

### Requests Table
```sql
CREATE TABLE requests (
  id VARCHAR PRIMARY KEY DEFAULT (gen_random_uuid()),
  partner_id VARCHAR(4) NOT NULL REFERENCES partners(id),
  partner_name TEXT NOT NULL,
  referring_case_manager TEXT NOT NULL,
  case_manager_email TEXT NOT NULL,
  case_manager_phone TEXT NOT NULL,
  preferred_contact TEXT NOT NULL,
  urgency TEXT NOT NULL,
  description TEXT NOT NULL,
  recipients_name TEXT NOT NULL,
  recipients_address TEXT NOT NULL,
  recipients_email TEXT NOT NULL,
  recipients_phone TEXT NOT NULL,
  description_of_need TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

## 🔧 Troubleshooting

### Common Issues

**Schema Mismatch Error:**
```bash
# Run full validation to see details
npm run validate:schema

# Check specific table
wrangler d1 execute partner-portal-db --command="PRAGMA table_info(partners);" --remote
```

**Deployment Fails:**
```bash
# Check if logged in
wrangler whoami

# Check database exists
wrangler d1 list

# Validate schema
npm run check:schema
```

**Database Connection Issues:**
```bash
# Test database connection
wrangler d1 execute partner-portal-db --command="SELECT 1;" --remote

# Check database status
wrangler d1 list
```

## 📝 Best Practices

1. **Always use safe deployment** for production
2. **Run schema validation** before any database changes
3. **Create backups** before major deployments
4. **Test in development** before production deployment
5. **Monitor logs** after deployment
6. **Keep backup history** (last 10 backups automatically maintained)

## 🎯 Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run deploy:safe` | Safe deployment with validation | Production deployments |
| `npm run validate:schema` | Full schema validation | Before deployments, troubleshooting |
| `npm run check:schema` | Quick schema check | CI/CD, quick validation |
| `npm run backup:db` | Create database backup | Before changes, regular maintenance |
| `npm run deploy` | Standard deployment | Development, when confident |

## 🚀 Production Deployment Checklist

- [ ] Run `npm run validate:schema` ✅
- [ ] Run `npm run backup:db` ✅
- [ ] Run `npm run deploy:safe` ✅
- [ ] Verify application is responding ✅
- [ ] Test admin panel functionality ✅
- [ ] Test partner authentication ✅
- [ ] Monitor logs for errors ✅

---

**Remember:** The schema validation scripts are your safety net. Always run them before deploying to ensure database integrity!

