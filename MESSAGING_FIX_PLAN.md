# Messaging Fix Plan: Prevent Empty Conversation Creation

## 1. The Root Cause
Currently, when a logged-in user visits a listing page, the `MessagingPanel.tsx` component automatically runs a `useEffect` hook that calls `createOrGetConversationForListing(listingId)`. 

This function triggers the `create_or_get_conversation_for_listing` RPC on the backend, which immediately creates a new conversation row in the database if one does not exist between the current user and the listing's owner. Because this happens on component mount (page load), empty chats are created for every listing an authenticated user visits.

## 2. Proposed Solution

### A. Modify Database RPC or Query
We have two options to safely check for a conversation:
1. Modify the existing `create_or_get_conversation_for_listing` RPC to accept a `p_create_if_missing BOOLEAN DEFAULT true` parameter.
2. Create a simple query in the frontend service to check if a conversation exists where `listing_id = ?` and `buyer_user_id = auth.uid()`.

### B. Update `messagingService.ts`
We will add a new client service function `getExistingConversationForListing(listingId: string)` that safely checks if a conversation exists without inserting any new records.

### C. Update `MessagingPanel.tsx` (Lazy Creation)
1. **On Mount**: Instead of calling `createOrGetConversationForListing`, the panel will call `getExistingConversationForListing`.
2. **Handle Empty State**: If no conversation is found, the component will set `conversationId` to `null` but *will not* block the UI. The user will still see the empty chat state and be able to type a message.
3. **On Send (`handleSend`)**: If `conversationId` is `null` when the user clicks "Send", we will *then* call `createOrGetConversationForListing` to officially initialize the chat in the database right before sending the first message.
4. **Seller Check**: We need to ensure that if the viewer is the seller of the listing, they don't see a "Write a message" box to themselves when no chat exists. We can pass the listing's owner ID to the panel to easily hide or disable the messaging UI for the seller.

## 3. Implementation Steps
To apply these fixes, switch to **Standard Mode** in Softgen. We will:
1. Update `src/services/messagingService.ts` to add the non-mutating check.
2. Refactor `src/components/buyauto/detail/MessagingPanel.tsx` to use lazy initialization.
3. Pass the listing's `user_id` down to `MessagingPanel` from `ListingDetailV2.tsx` to handle the seller view accurately.