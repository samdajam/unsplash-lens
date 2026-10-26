# Tasks

## 1. Project Setup & HTML Structure

- [x] 1.1 Create `index.html` with semantic structure including header branding, search input bar, quick-suggestion tag chips, photo gallery container, JSON payload inspector, and modal lightbox, verifying markup structure in browser.
- [x] 1.2 Add accessibility attributes (ARIA labels, roles, live regions), responsive meta tags, Google Fonts Inter import, and embedded SVG icons, verifying element accessibility and layout hierarchy.

## 2. Design System & CSS Styling

- [x] 2.1 Define CSS design tokens in `styles.css` for dark-mode glassmorphic theme (backgrounds, glass borders, violet accent gradients, and typography scales), verifying base page styling.
- [x] 2.2 Implement styles and micro-interactions for search bar, glowing focus states, submit button states, and suggestion chips, verifying hover and active transitions.
- [x] 2.3 Style responsive photo gallery cards with CSS aspect-ratio, loading skeleton shimmer animations, hover overlay actions, and modal lightbox viewer, verifying responsiveness across mobile and desktop viewports.
- [x] 2.4 Style collapsible raw JSON response viewer with syntax highlighting and copy-to-clipboard button, verifying syntax contrast and copy indicator tooltip.

## 3. Webhook Integration & Client Logic

- [x] 3.1 Implement n8n webhook integration in `app.js` using `fetch` with `encodeURIComponent`, request abort handling, and loading state management, verifying successful network communication with `https://hopeu.app.n8n.cloud/webhook/a9bd47d1-aab4-4a9e-9605-7432f746ca10`.
- [x] 3.2 Bind search trigger events for search button click, Enter keypress, and suggestion chip selection with input validation to prevent empty queries, verifying correct query dispatch.
- [x] 3.3 Implement gallery DOM rendering to display the 3 returned image URLs with skeleton loaders and `onerror` fallback handling, verifying image display.
- [x] 3.4 Implement raw JSON inspector rendering to display the exact response object formatted with syntax highlighting and clipboard copying, verifying JSON output matches the webhook payload.
- [x] 3.5 Implement lightbox preview modal with open-in-tab link and keyboard Esc / backdrop dismiss handlers, verifying modal navigation.

## 4. Verification & Polish

- [x] 4.1 Perform end-to-end verification across test keywords ("coffee", "nature", "cars", "mountains") using a local static server, verifying accurate image presentation and raw JSON output.
- [x] 4.2 Test edge cases including network timeout simulation, whitespace input validation, and fallback handling, verifying resilient user feedback.
