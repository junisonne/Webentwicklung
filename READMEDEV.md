# Developer Documentation for Poll System

## Technical Overview

This document provides technical information for developers working on the Poll System codebase. For user instructions and general usage information, please refer to the main README.md file.

The Poll System is built on a modern web stack using vanilla JavaScript with Web Components for the frontend and Express.js for the backend API.

This documentation is intended for developers working on the Poll System project. For user-facing documentation, please refer to the main README.md file.plication follows a component-based architecture with clear separation between UI templates, API integration, and business logic.

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Web Components)
- **Backend**: Node.js with Express
- **Testing**: Jest for unit tests, Cypress for E2E tests
- **CI/CD**: GitHub Actions
- **Containerization**: Docker

## Project Structure

This is a simplified view showing only the most important parts of the project structure:

```
📦 poll-system
 ┣ 📂 backend         
 ┃ ┗ 📜 server.js     # Express server with REST API endpoints
 ┣ 📂 frontend        
 ┃ ┣ 📜 api.js        # API client for backend communication
 ┃ ┣ 📜 templates.js  # HTML templates for UI components 
 ┃ ┗ 📜 poll-component.js # Main Web Component implementation
 ┣ 📂 .github/workflows # CI/CD pipelines
 ┣ 📂 test            # Jest unit tests
 ┣ 📂 cypress         # E2E tests
 ┣ 📜 *.html          # Theme variations (index, spaceship, retro, jungle)
 ┣ 📜 jest.config.js  # Test configuration
 ┣ 📜 Dockerfile      # Container configuration
 ┗ 📜 package.json    # Dependencies and scripts
```

## Development Setup

### Prerequisites

- Node.js (v18+) - Based on the CI configuration
- npm (v8+)
- Docker & Docker Compose (optional, for containerized development)

### Development Setup

1. **Install all development dependencies**

```bash
npm install
```

2. **Start the development server**

```bash
npm start
```

The application will run on port 8500 by default. The port configuration is defined in `server.js` and also referenced in the Cypress configuration.

### Environment Configuration

#### Local Development

To run the application locally, ensure the API URL in each HTML file points to your local server:

```html
<poll-component api-url="http://localhost:8500"></poll-component>
```

#### Server Deployment

When deploying to a server, update the API URL to match your server's domain:

```html
<poll-component api-url="https://your-server-domain.com"></poll-component>
```

The API URL can be found and modified in these files:
- `index.html`
- `spaceship.html`
- `retro.html`
- `jungle.html`

#### API Default Configuration

The frontend API client (`frontend/api.js`) has a default URL that's used when no `api-url` attribute is specified in the HTML:

```javascript
let API_URL = `http://localhost:8500`;
```

For most deployments, you have two options:

1. **Recommended**: Set the `api-url` attribute in each HTML file (overrides the default)
2. **Alternative**: Modify the default URL in `api.js` if you can't change the HTML files

The Web Component first checks for the `api-url` attribute, and if not found, falls back to this default value.

## Testing

The project uses Jest for unit tests and Cypress for end-to-end tests, configured via `jest.config.js` and `cypress.config.js` respectively.

### Unit Tests

```bash
npm test
```
This runs Jest unit tests with coverage reporting.

### Watch Mode for Unit Tests

```bash
npm run test:watch
```
Runs Jest in watch mode, re-running tests when files change.

### Running E2E Tests with Server

```bash
npm run cy:run
```
This starts the server and runs Cypress tests against it using `start-server-and-test`.

## Architecture

### Web Component Architecture

The core of the application is the `<poll-component>` Web Component which handles:

1. Poll creation interface for admins
2. Poll participation for users
3. Results visualization
4. Theme customization

#### Component Structure

The component uses Shadow DOM for encapsulation and follows this general architecture:

```
PollComponent
├── MainMenu        # Home screen with create/join/view options
├── CreatePollView  # Admin interface for creating polls
├── JoinPollView    # Interface for entering poll codes
├── PollParticipant # Interface for answering poll questions
├── PollResults     # Results visualization
└── AdminPanel      # Admin controls for managing active polls
```

### API Integration

The component communicates with the backend using the methods defined in `frontend/api.js`, which include:

- `createPoll(pollData)` - Creates a new poll
- `joinPoll(code)` - Joins an existing poll using a code
- `submitAnswers(code, answers)` - Submits answers to a poll
- `getPollResults(code, password)` - Retrieves poll results

### Component Interaction Architecture

The application is structured around several interconnected modules:

#### Core Component and Utility Integration

```
poll-component.js
     │
     ├─────── api.js (Backend communication)
     │
     ├─────── templates.js (HTML rendering)
     │
     └─────── utils/ (Specialized functionality)
              ├── style-utils.js (Dynamic styling)
              ├── csv-utils.js (Data export)
              ├── pollOverviewHandler.js (Poll listing)
              ├── pollCreateHandler.js (Poll creation)
              ├── ipHandler.js (IP management)
              └── adminHandler.js (Admin controls)
```

The main Web Component (`poll-component.js`) acts as the orchestrator that:

1. **Imports and coordinates utility modules**:
   - Utility modules are specialized for specific tasks (styles, data handling, etc.)
   - Each handler manages a specific aspect of the application

2. **Manages rendering flow**:
   - Requests appropriate templates from `templates.js`
   - Attaches event listeners to elements
   - Delegates complex behaviors to specialized handlers

3. **Handles state management**:
   - Maintains minimal component state (current poll, user responses, etc.)
   - Passes state to handlers when needed
   - Updates state based on handler responses

4. **Applies styles dynamically**:
   - Uses `applyStylesToShadowRoot` to load and apply view-specific styles
   - Each view (main menu, poll questions, admin panel) receives targeted styling

When a user interaction occurs (like clicking "Create Poll"):
1. The event handler in `poll-component.js` is triggered
2. The component loads the appropriate template and applies view-specific styling
3. Specialized handlers from the utils directory are delegated to manage complex tasks
4. The handlers communicate with the API if needed and update the DOM

This modular architecture ensures separation of concerns while maintaining clear pathways for component interaction.

### Style Management System

The application uses a dynamic styling system that loads and applies view-specific CSS:

```
style-utils.js
    │
    └── applyStylesToShadowRoot(shadowRoot, viewName)
        │
        ├── mainMenu.css     (Main menu styling)
        ├── joinPoll.css     (Join poll form styling)
        ├── pollQuestions.css (Questions styling)
        ├── createPoll.css   (Poll creation styling)
        ├── pollList.css     (Poll listing styling)
        └── adminPanel.css   (Admin panel styling)
```

This approach offers several advantages:

1. **Dynamic Loading**: CSS is loaded only when needed for the current view
2. **Encapsulation**: Shadow DOM prevents style leakage between components
3. **Modularity**: Each view has its own dedicated stylesheet
4. **Performance**: Reduces initial load time by deferring non-essential styles

The utility function `applyStylesToShadowRoot(shadowRoot, viewName)` works by:

1. Determining which CSS file to load based on the viewName parameter
2. Fetching the CSS content from the appropriate file
3. Creating a style element and inserting the CSS content
4. Attaching the style element to the Shadow DOM
5. Applying common styles that should be available across all views

When a new view is rendered, the component first calls this utility function to ensure the proper styles are loaded before the HTML is rendered, maintaining a consistent user experience.

### Utility Handlers Integration

The poll component delegates complex tasks to specialized utility handlers:

1. **pollCreateHandler.js** - Manages poll creation workflow
   - Handles dynamic addition of questions and options
   - Validates form inputs and formats data for submission
   - Provides template loading functionality

2. **pollOverviewHandler.js** - Manages poll listing and search
   - Implements search functionality across polls
   - Handles administrator authentication
   - Filters and sorts poll data

3. **ipHandler.js** - Manages IP-related operations
   - Implements IP banning and unbanning functionality
   - Sets up event listeners for IP management buttons
   - Provides feedback for IP management operations

4. **adminHandler.js** - Manages administrator panel functionality
   - Updates poll status display
   - Generates QR codes for poll sharing
   - Refreshes poll results
   - Updates result visualization

5. **csv-utils.js** - Provides data export functionality
   - Formats poll data for CSV export
   - Generates downloadable CSV files
   - Handles data transformation for export

Each utility exposes functions that are imported and used by the main poll component. For example:

```javascript
// In poll-component.js
import { handleBanNewIP, setupIPEventListeners } from "./utils/ipHandler.js";
import { handleRefreshResults, updateResultBars } from "./utils/adminHandler.js";

// Later in the code, when showing admin results
async showAdminResults(data) {
  // Apply styles and render template
  await applyStylesToShadowRoot(this.shadowRoot, 'adminPanel');
  this.render(templates.getAdminPanelTemplate(data), [...]);
  
  // Use utility handlers for specialized tasks
  updateResultBars(this.shadowRoot);
  setupIPEventListeners(this.shadowRoot, data, this.state.adminPassword);
  generateQRCode(this.shadowRoot, data.poll.code);
}
```

This approach maintains clean separation of concerns while allowing specialized functionality to be developed and maintained independently.

### Templates System

The application uses a modular template system defined in `frontend/templates.js` to generate HTML markup for different views:

- `getMainMenuTemplate()` - Generates the main menu interface
- `getJoinPollTemplate()` - Creates the poll joining interface
- `getPollQuestionsTemplate(poll)` - Renders questions for participants to answer
- `getCreatePollTemplate(hasInitial)` - Builds the poll creation form for administrators
- `getAdminPanelTemplate({poll, results, participantEntries})` - Constructs the admin dashboard with results
- `getResultTemplate(result)` - Displays formatted results for a single question
- `getPollListTemplate(polls)` - Shows the list of available polls
- `getBannedIPsListTemplate(bannedIPs)` - Renders the list of banned IP addresses

### Backend Architecture

The backend server (`backend/server.js`) handles the following API Endpoints:

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/poll/create` | POST | Create a new poll |
| `/poll/enter` | POST | Enter an existing poll |
| `/poll/submit` | POST | Submit answers to a poll |
| `/poll/results` | GET | Get poll results (admin only) |
| `/poll/ban` | POST | Ban IP from poll (admin only) |
| `/poll/unban` | POST | Unban IP from poll (admin only) |

## Production Deployment

### Application Structure

The application is designed as an ES module-based Node.js application (`"type": "module"` in package.json). This means:
- All import/export statements use ES module syntax
- No CommonJS `require()` statements are used
- File extensions are required in import paths
- Top-level await is supported

### Docker Deployment

```bash
# Build the Docker image locally
docker build -t poll-system .

# Run with Docker Compose
docker-compose up -d
```

The application will be available at: `http://localhost:8500`

### Continuous Deployment with Watchtower

The project uses Watchtower for automated deployment updates instead of a traditional CI/CD pipeline that directly pushes to production servers. This setup is critical for environments where direct server access from external CI systems isn't possible or desirable.

#### How Watchtower Works

1. The `docker-compose.yml` includes a Watchtower service alongside the poll application:
   ```yaml
   watchtower:
     image: containrrr/watchtower
     container_name: watchtower-junisonne
     restart: unless-stopped
     environment:
       - WATCHTOWER_CLEANUP=true
       - WATCHTOWER_POLL_INTERVAL=300
     volumes:
       - /var/run/docker.sock:/var/run/docker.sock
     command: poll-app
   ```

2. **Polling Mechanism**: Watchtower checks the container registry every 5 minutes (300 seconds) for new versions of the poll-app image.

3. **Update Process**:
   - When a new image is detected, Watchtower automatically:
     - Pulls the new image from the registry
     - Gracefully stops the current container
     - Starts a new container with the updated image
     - Removes the old image (cleanup=true)

4. **Workflow**:
   - Changes are pushed to the main branch
   - CI builds and pushes a new image to the registry
   - Watchtower detects the new image and updates the deployment
   - No direct access needed between CI and production server

This approach provides several advantages:
- Server security is maintained (no external direct access required)
- Deployment happens automatically without manual intervention
- Rollback is possible by pushing an older image tag to the registry
- The server only needs outbound internet access, not inbound access

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and delivery:

1. **Testing Workflow** (`test.yml`)
   - Triggered on push to main and pull requests
   - Runs on Ubuntu latest with Node.js 18
   - Installs dependencies and runs all tests

2. **Docker Build Workflow** (`docker-ghcr.yml`)
   - Triggered on push to main branch
   - Builds the Docker image using the Dockerfile
   - Pushes the image to GitHub Container Registry (ghcr.io)
   - Tags the image as `latest`

To access the container image:

```bash
docker pull ghcr.io/YOUR_USERNAME/poll-app:latest
docker run -p 8500:8500 ghcr.io/YOUR_USERNAME/poll-app:latest
```

## Coding Standards

### HTML

- Use semantic HTML5 elements appropriately
- Ensure proper document structure
- Maintain accessibility standards with ARIA attributes when needed
- Keep markup clean and readable

### CSS

- Use nested CSS for better organization
- Follow BEM (Block Element Modifier) naming convention
- Avoid inline styles; all styling should be in external CSS files
- Design for responsiveness using media queries

### JavaScript

- Follow modern ES6+ practices
- Use const/let instead of var
- Implement proper error handling
- Use async/await for asynchronous operations
- Comment complex logic and edge cases

---

This documentation is intended for developers working on the Poll System project. For user-facing documentation, please refer to the README.md file.

## Utility Handlers Integration

The poll component delegates complex tasks to specialized utility handlers:

1. **pollCreateHandler.js** - Manages poll creation workflow
   - Handles dynamic addition of questions and options
   - Validates form inputs and formats data for submission
   - Provides template loading functionality

2. **pollOverviewHandler.js** - Manages poll listing and search
   - Implements search functionality across polls
   - Handles administrator authentication
   - Filters and sorts poll data

3. **ipHandler.js** - Manages IP-related operations
   - Implements IP banning and unbanning functionality
   - Sets up event listeners for IP management buttons
   - Provides feedback for IP management operations

4. **adminHandler.js** - Manages administrator panel functionality
   - Updates poll status display
   - Generates QR codes for poll sharing
   - Refreshes poll results
   - Updates result visualization

5. **csv-utils.js** - Provides data export functionality
   - Formats poll data for CSV export
   - Generates downloadable CSV files
   - Handles data transformation for export

Each utility exposes functions that are imported and used by the main poll component. For example:

```javascript
// In poll-component.js
import { handleBanNewIP, setupIPEventListeners } from "./utils/ipHandler.js";
import { handleRefreshResults, updateResultBars } from "./utils/adminHandler.js";

// Later in the code, when showing admin results
async showAdminResults(data) {
  // Apply styles and render template
  await applyStylesToShadowRoot(this.shadowRoot, 'adminPanel');
  this.render(templates.getAdminPanelTemplate(data), [...]);
  
  // Use utility handlers for specialized tasks
  updateResultBars(this.shadowRoot);
  setupIPEventListeners(this.shadowRoot, data, this.state.adminPassword);
  generateQRCode(this.shadowRoot, data.poll.code);
}
```

This approach maintains clean separation of concerns while allowing specialized functionality to be developed and maintained independently.