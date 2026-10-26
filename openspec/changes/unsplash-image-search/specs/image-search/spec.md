# Spec Delta

## Purpose

Provides a clean, responsive web interface for users to search and discover Unsplash images through an n8n webhook workflow, displaying both visual photo cards and the raw JSON payload.

## ADDED Requirements

### Requirement: Keyword input and search submission
The web interface SHALL provide an input field and search trigger for submitting image search keywords, supporting keyboard submission and quick tag selection.

#### Scenario: Submitting a search via button click
- **WHEN** user enters "coffee" into the search field and clicks the "Search" button
- **THEN** the system initiates a request to the n8n webhook with the query parameter `q=coffee`

#### Scenario: Submitting a search via Enter key
- **WHEN** user types "nature" into the search input and presses the "Enter" key
- **THEN** the system initiates a request to the n8n webhook with the query parameter `q=nature`

#### Scenario: Quick suggestion tag click
- **WHEN** user clicks on a suggested tag chip such as "coffee", "nature", "cars", or "mountains"
- **THEN** the search input is populated with that keyword and the search request is immediately triggered

#### Scenario: Empty input submission prevention
- **WHEN** user attempts to submit an empty or whitespace-only search query
- **THEN** the system SHALL NOT send a network request and SHALL prompt the user to enter a keyword

### Requirement: Querying n8n webhook API
The application SHALL query the n8n webhook endpoint via HTTP GET with the URL-encoded search keyword and process the JSON response containing the image URLs.

#### Scenario: Successful response from webhook
- **WHEN** the webhook responds with HTTP 200 and a JSON object containing an `images` array of URLs
- **THEN** the system extracts the image URLs and presents them in the gallery

#### Scenario: Webhook error handling
- **WHEN** the webhook fails with a network error or non-200 HTTP status
- **THEN** the system SHALL display a clear error message explaining the failure with an option to retry

### Requirement: Responsive image gallery presentation
The application SHALL render the returned image URLs in a clean, modern, responsive photo grid with loading states and preview interactions.

#### Scenario: Rendering returned images
- **WHEN** three image URLs are received from the webhook response
- **THEN** the application SHALL display all three images in a responsive card grid with smooth transitions and image load handling

#### Scenario: Interactive image viewing
- **WHEN** user clicks on an image card in the gallery
- **THEN** the system displays a high-resolution preview modal with an action to open the original image in a new tab

### Requirement: Raw JSON response inspection
The application SHALL display the exact JSON response returned by the n8n webhook in an inspectable, format-highlighted interface section.

#### Scenario: Viewing webhook JSON
- **WHEN** a search completes successfully
- **THEN** the application SHALL display the exact JSON payload formatted with clean indentation and a copy-to-clipboard action
