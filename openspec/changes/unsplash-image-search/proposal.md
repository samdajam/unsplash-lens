# Proposal

## Why

Users need an elegant, modern, and responsive web application to search for high-quality Unsplash photos through an existing n8n automation webhook. The application provides an interactive visual search experience and transparently surfaces the webhook's JSON response without requiring backend rebuilds or direct client-side Unsplash API calls.

## What Changes

- Create a responsive, accessible single-page web application (HTML5, modern Vanilla CSS, and JavaScript) to interface with the n8n Unsplash webhook.
- Implement a search input bar supporting keyboard submission (Enter) and button click, along with quick-select keyword chips (coffee, nature, cars, mountains).
- Query the n8n webhook endpoint (`https://hopeu.app.n8n.cloud/webhook/a9bd47d1-aab4-4a9e-9605-7432f746ca10?q=<query>`) via GET requests.
- Render the 3 returned image URLs in a responsive, modern card gallery featuring loading skeletons, hover overlays, and preview/open links.
- Display the exact raw JSON response returned by the n8n webhook (`{"images": [...]}`) in an inspectable code viewer.
- Provide comprehensive UI states including initial welcome, loading/fetching, success gallery, empty results, and error notifications with retry capability.

## Capabilities

### New Capabilities
- `image-search`: User interface and client logic for querying the n8n Unsplash webhook by keyword, presenting the image gallery, and inspecting the raw JSON response.

### Modified Capabilities

None.

## Impact

- **Files added**: Frontend web application files (`index.html`, `styles.css`, `app.js`).
- **External APIs**: Calls external n8n webhook URL (`https://hopeu.app.n8n.cloud/webhook/a9bd47d1-aab4-4a9e-9605-7432f746ca10`).
- **Dependencies**: Zero build dependencies required; runs directly in modern web browsers or via static local web servers.
