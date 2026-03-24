# Fix 404 Error on Message Links

## The Issue
When users click a link to a conversation from an email notification (e.g., `https://buyauto.ch/dashboard/messages/[conversationId]`), they sometimes receive a 404 Not Found error despite being logged in and having permissions to view the chat.

This occurs because `src/pages/dashboard/messages/[conversationId].tsx` contains a `getServerSideProps` function that enforces an overly strict check. It requires the `session.user.id` to perfectly match a record in `conversation_participants`. 

This breaks for users who have access via indirect means (e.g., Garage team members who didn't personally create the listing but have rights to view the garage's messages, or admins).

## The Solution

1. **Update `src/pages/dashboard/messages/[conversationId].tsx`**:
   - Remove the `getServerSideProps` function entirely, or modify it to *only* check for a valid session and redirect to `/auth` if the user is not logged in.
   - Remove the strict `conversation_participants` check that returns `{ notFound: true }`.
   - Rely on the existing client-side `getConversationContext` function which correctly evaluates RLS policies, garage affiliations, and permissions.
   - The existing client-side `useEffect` already handles unauthorized access perfectly by displaying a toast ("Unterhaltung nicht gefunden oder kein Zugriff.") and gracefully routing the user back to `/dashboard/messages`.

## Implementation Steps
1. Open `src/pages/dashboard/messages/[conversationId].tsx`.
2. Locate the `getServerSideProps` block at the bottom of the file.
3. Remove the database query to `conversation_participants`.
4. Remove the `if (!participant) { return { notFound: true }; }` logic.
5. Save the file.