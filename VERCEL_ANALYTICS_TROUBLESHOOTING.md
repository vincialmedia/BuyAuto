# Troubleshooting Vercel Analytics

You have successfully installed and deployed Vercel Analytics. If you aren't seeing data yet, it is likely due to one of the following reasons:

## 1. Ad Blockers (Most Common)
Analytics scripts are often blocked by:
- **Ad Blockers**: uBlock Origin, AdBlock Plus, Ghostery, etc.
- **Privacy Browsers**: Brave, Firefox (Strict Mode), Safari (Intelligent Tracking Prevention).
- **VPNs**: Some VPNs have built-in tracker blocking.

**Solution**:
- Open your deployed website in an **Incognito/Private** window (without extensions).
- Or, temporarily disable your ad blocker for your site.
- Refresh the page a few times and navigate between pages.

## 2. Production Environment
Vercel Analytics is designed to run in the **production** environment.
- Ensure you are viewing the **deployed** URL (e.g., `your-project.vercel.app`), NOT `localhost:3000`.
- Data from localhost is usually ignored to prevent pollution.

## 3. Data Delay
There is often a slight delay (30-60 seconds) between the first event and it appearing on the dashboard.
- Keep the dashboard open.
- Visit your site on your phone (disconnected from WiFi if you have network-level blocking like Pi-hole).
- Click around to generate "page view" events.

## 4. Correct Project
- Double-check that you are looking at the Analytics tab for the **correct project** in Vercel.

## Verification Steps
1. Open your deployed site on a **mobile phone** (using cellular data to bypass any network filters).
2. Click 2-3 links on your site.
3. Wait 60 seconds.
4. Refresh the Vercel Analytics dashboard.

If you still see nothing, the installation itself is correct, so it is purely a data collection/viewing issue.
