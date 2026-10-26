# Design

## Context

The repository contains an OpenSpec configuration with no existing frontend application code. The backend is an active n8n automation workflow exposed as an HTTP webhook at `https://hopeu.app.n8n.cloud/webhook/a9bd47d1-aab4-4a9e-9605-7432f746ca10`. When sent a GET request with query parameter `q=<keyword>`, it queries the Unsplash API and returns a JSON payload with three image URLs: `{"images": ["<url1>", "<url2>", "<url3>"]}`. Dynamic CORS headers are returned by the webhook to allow direct browser client fetch requests.

## Goals / Non-Goals

**Goals:**
- Deliver a clean, responsive single-page application built with modern HTML5, Vanilla CSS3, and ES6+ JavaScript.
- Create an aesthetically rich interface featuring dark-mode glassmorphism, responsive photo grid, micro-animations, and modern typography (Google Fonts Inter).
- Interface directly with the n8n webhook without intermediate proxies or server builds.
- Render image cards with smooth loading skeletons, hover overlays, full-size image lightbox modal, and direct external links.
- Provide an interactive, formatted JSON response inspector to display the exact payload returned by n8n with one-click clipboard copying.
- Support instant keyword chips (e.g., coffee, nature, cars, mountains) and keyboard navigation.

**Non-Goals:**
- Modifying or re-implementing the n8n backend workflow or Unsplash API authentication.
- Implementing complex multi-page routing or heavy frontend frameworks (e.g. Next.js, React) where standard native web technologies provide superior simplicity and zero-build execution.
- Persisting search history or implementing user authentication accounts.

## Decisions

### 1. Technology Choice: Vanilla HTML5 / Modern CSS / Vanilla JavaScript
- **Decision**: Build the application using standard modern web technologies (`index.html`, `styles.css`, `app.js`).
- **Rationale**: The scope is a focused, high-performance search experience querying a single webhook. Eliminating build pipelines (Vite/Webpack) and heavy frameworks ensures zero dependencies, instant load times, and simple local execution (`npx serve` or any static HTTP server).
- **Alternatives Considered**: Vite + React or Next.js. While capable, they introduce build tooling, node_modules dependencies, and deployment overhead for a single-view visual search tool.

### 2. UI / Visual Design System
- **Decision**: Implement a custom dark-mode design system with CSS custom properties (design tokens):
  - Deep slate background (`#0B0F19`, `#111827`) with subtle radial violet gradients.
  - Glassmorphic panels with `backdrop-filter: blur()`, subtle border glow, and box shadows.
  - Typography: Google Font Inter with structured hierarchy.
  - Color accents: Vibrant violet/indigo (`#6366f1` / `#8b5cf6`) and emerald status indicators.
- **Rationale**: Meets high aesthetic standards with smooth transitions, refined typography, and engaging micro-interactions.
- **Alternatives Considered**: Generic default styles or Tailwind CSS. Custom CSS tokens provide complete control and zero build requirements.

### 3. API Communication & Error Architecture
- **Decision**: Use native `window.fetch` with `AbortController` (to cancel stale in-flight requests when rapid queries occur) and `encodeURIComponent` for query sanitization.
- **Rationale**: Prevents race conditions and ensures resilient handling of network failures, HTTP non-200 responses, and malformed data.
- **Alternatives Considered**: Third-party libraries like Axios; unnecessary given modern Fetch API features.

### 4. Interactive JSON Inspector
- **Decision**: Render formatted JSON inside a collapsible `<pre><code id="json-viewer">` with custom syntax color spans and a "Copy JSON" button.
- **Rationale**: Satisfies the explicit requirement to view the exact JSON structure returned by the n8n webhook in an elegant, non-intrusive presentation.

### 5. Image Loading & Lightbox Modal
- **Decision**: Use CSS shimmer skeletons while images download, handle `onerror` events with fallback states, and include a modal lightbox for enlarged photo viewing.
- **Rationale**: Unsplash images may take time to decode; skeletons and modals provide a polished UX.

## Risks / Trade-offs

- **[Risk] n8n Webhook Latency or Cold Starts** → **Mitigation**: Display prominent loading skeletons and an animated spinner on the search trigger. If the request exceeds 15 seconds, show a helpful timeout message with retry capability.
- **[Risk] Empty Results for Obscure Keywords** → **Mitigation**: Detect empty or missing image arrays in the webhook response and render a friendly empty-state illustration prompting the user to try common terms.
- **[Risk] Image URL Loading Errors** → **Mitigation**: Attach an `onerror` listener to images to replace failed images with a graceful fallback tile instead of broken image icons.

## Migration Plan

No database or infrastructure migrations required. The application consists of static assets ready to be served from any local or remote web server.
