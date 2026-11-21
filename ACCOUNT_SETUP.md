# Permanent accounts without email confirmation

New signups ask for a display name, unique username, email and password. Users sign in later with email and password, including on another device. Names are labels and may repeat; usernames are stored lowercase and reserved by a database unique constraint. A failed duplicate username rolls back the account creation. Supabase email/password authentication prevents reuse of an existing account email; do not create a second custom email database or collect a separate identifier for isolation.

## Enable this release

1. Before deploying the new form, open your NeuroTwin Supabase project → SQL Editor → New query. Paste and run `supabase/migrations/006_account_profiles.sql`. It adds a profile table with owner-only read access and a transactional signup trigger. Existing accounts and wellness records are untouched. Newly created email accounts must include the new profile fields.
2. Open Authentication → Sign In / Providers → Email. Disable **Confirm Email** and save. Keep Email enabled. The location can vary with dashboard versions; search for Confirm Email if necessary. This setting is what allows immediate sign-in; frontend code cannot bypass it. Keep **Allow anonymous sign-ins** off, since this release uses permanent accounts.
3. Merge the guest-login branch after checks pass and wait for Vercel Production to become Ready. No new environment variables or secrets are needed. Because the trigger requires profile fields, deploy the updated form promptly after applying migration 006.
4. Create two disposable accounts with different emails/usernames but the same display name. Both should enter immediately, without a confirmation email. Test a case-variant of the first username: it must fail. Test reuse of the first email with another username: it must not create another account.
5. Save a check-in, sign out, then sign back in with the original email/password. The data should remain. Use a separate browser profile for the second account and verify it cannot see the first account's records. Password reset still uses email. Account deletion removes its profile by foreign-key cascade; deleting wellness records alone preserves the login profile.

Data are retained in the existing Supabase tables across sign-out; there is no guest expiry or new automatic deletion. This is not a guarantee against service loss or backups. Without email verification, a signup does not establish that the person owns the address, so recovery depends on entering an address they control. The unique account ID and existing RLS policies isolate records, not names, usernames or user-editable auth metadata. Profile usernames cannot be modified directly by the browser.

Sources: [Supabase email/password auth](https://supabase.com/docs/guides/auth/passwords), [Confirm Email configuration](https://supabase.com/docs/guides/auth/general-configuration).
