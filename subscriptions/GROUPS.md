# Group subscriptions

Apply `schema.sql` for a fresh database, then `groups.sql` before deploying this worker.
Existing subscriptions and keys are preserved. Do not upload `secrets/` or local Wrangler state.

Create a group with a calendar duration, customer capacity and total device capacity.
Choose that group when creating a customer's independent activation code. Each customer
has their own device limit (1–20), expiry, suspend/resume action and permanent deletion.
The effective expiry is the earlier of the customer's and group's expiry. A suspended
group blocks all its members. Group capacity is enforced atomically in database triggers.

Durations support days, calendar months, calendar years and an exact date/time. Adding
a duration extends from the current expiry, or today for expired subscriptions. Selecting
an exact date replaces the expiry. Renewal does not clear suspension.

Device management lists anonymous installation identifiers and last check-in dates.
Blocking a device frees its slot and prevents that installation from reactivating with
the same code. Reinstalling/resetting application data can generate a new identifier.

Deleting a customer's code removes its device allocations and group membership, and
retains an audit event without the customer name or key. Groups can be deleted only when
empty. The UI requires confirmation for permanent deletion. No customer data is deleted
during deployment. Signed offline leases may remain valid for up to 24 hours; online
clients normally refresh hourly or when activation is requested.

Functional tests were not run, at the owner's request.
