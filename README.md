# s-process

## Run locally

```bash
npm install
npm run dev
```

## Run tests

```bash
npm test
```

## Supabase

### Initialize Supabase for local development

Run `npx supabase link`, it will complain that things are missing, but explains what to do. [docs](https://supabase.com/docs/reference/cli/supabase-init)

### Create migration

```bash
npx supabase migration new <migration name>
```

### Create types

```bash
npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema public > database.types.ts
```

### Push migrations to Supabase

```bash
npx supabase db push
```
