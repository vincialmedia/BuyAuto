# Plan: Fix `400 Bad Request` on `/api/billing/prepare`

## 1. Diagnosis

- **Problem**: When a user selects a paid plan and clicks "Weiter zur Bezahlung," the application sends a request to `/api/billing/prepare` which fails with a `400 Bad Request` error.
- **Analysis**: The `400` status code indicates a client-side data issue. The server is receiving the request but deems the payload invalid. The most likely cause is that the `listing_id` field is missing or empty in the request body. This happens because the wizard's state (`data.id`) is not reliably available at the payment step.
- **Confirmation Strategy**: Add server-side logging to the API endpoint to inspect the incoming `req.body` and confirm that `listing_id` is missing.

## 2. Implementation Steps

### Step 1: Add Server-Side Logging (Diagnostic)

I will edit `src/pages/api/billing/prepare.ts` to add a `console.log` at the beginning of the handler function. This will allow us to see the exact payload being sent from the client in the server logs.

```typescript
// in src/pages/api/billing/prepare.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received request for /api/billing/prepare with body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    // ...
  }
  // ...
}
```

### Step 2: Implement the Fix on the Client-Side

After confirming the missing `listing_id`, I will make the client-side code more robust in `src/components/buyauto/create-listing/Step3_PlanSelection.tsx`.

1.  **Guard the Payment Button**: I will disable the "Weiter zur Bezahlung" button if `data.id` is not available. This provides a clear visual cue to the user and prevents invalid API calls.

    ```jsx
    // In the Button component
    disabled={isLoading || !data.id}
    ```

2.  **Add a Toast Notification**: If the user clicks the disabled button (or if we want to be more explicit), show a toast notification explaining why they cannot proceed.

    ```typescript
    // In handlePreparePayment function
    if (!data.id) {
      toast({
        title: 'Fehler',
        description: 'Listing-ID nicht gefunden. Bitte gehen Sie zurück und versuchen Sie es erneut.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    ```

This approach ensures that we never attempt to prepare a payment without the essential `listing_id`, directly addressing the root cause of the `400 Bad Request` error.

## 3. Expected Outcome

- The server logs will confirm that `listing_id` is missing in failing requests.
- The "Weiter zur Bezahlung" button will be disabled if the `listing_id` is not present in the application's state.
- Invalid requests to `/api/billing/prepare` will be prevented at the source.
- The `400 Bad Request` error will be resolved, and users will be able to proceed to payment for paid plans successfully.
