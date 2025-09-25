# Backend Development Plan: Snap Your Shelf - Digital Movie Collection Organizer

## 1) Executive Summary

Building a FastAPI backend to support the "Snap Your Shelf" movie collection application. The backend will provide secure user authentication, movie collection management, AI vision processing coordination, and social sharing capabilities. 

**Constraints honored:**
- FastAPI (Python 3.12) with async support
- MongoDB Atlas with Motor and Pydantic v2 models
- No Docker deployment
- Frontend-driven manual testing through UI flows
- Single branch `main`-only Git workflow
- API base path `/api/v1/*`
- Dynamic sprint planning to cover all frontend features

## 2) In-scope & Success Criteria

**In-scope features:**
- User authentication (signup, login, logout, JWT tokens)
- Movie collection CRUD operations
- Photo upload and storage management
- AI vision service integration (Anthropic Claude, Google Vision)
- Movie metadata enrichment and management
- Collection sharing and export functionality
- Search and filtering capabilities
- User profile and settings management

**Success criteria:**
- Full coverage of all frontend features identified in analysis
- Each sprint passes manual testing via the UI
- Successful push to `main` branch after each sprint completion
- Backend supports all current frontend routes and components

## 3) API Design

**Conventions:**
- Base path: `/api/v1`
- Consistent JSON error envelope: `{"error": "message", "code": "ERROR_CODE"}`
- JWT Bearer token authentication for protected routes
- RESTful resource naming

**Endpoints:**

**Health & System**
- `GET /healthz` - Health check with DB connectivity status

**Authentication**
- `POST /api/v1/auth/signup` - User registration with email/password
- `POST /api/v1/auth/login` - User login, returns JWT access token
- `POST /api/v1/auth/logout` - Token invalidation
- `GET /api/v1/auth/me` - Get current user profile

**Collections**
- `GET /api/v1/collections` - Get user's collections
- `POST /api/v1/collections` - Create new collection
- `GET /api/v1/collections/{id}` - Get specific collection
- `PUT /api/v1/collections/{id}` - Update collection metadata
- `DELETE /api/v1/collections/{id}` - Delete collection

**Movies**
- `GET /api/v1/collections/{id}/movies` - Get movies in collection with search/filter
- `POST /api/v1/collections/{id}/movies` - Add movie to collection
- `GET /api/v1/movies/{id}` - Get movie details
- `PUT /api/v1/movies/{id}` - Update movie metadata
- `DELETE /api/v1/movies/{id}` - Remove movie from collection
- `DELETE /api/v1/collections/{id}/movies/bulk` - Bulk delete movies

**Photo Processing**
- `POST /api/v1/photos/upload` - Upload shelf photo, returns photo ID
- `POST /api/v1/photos/{id}/process` - Process photo with AI vision
- `GET /api/v1/photos/{id}/status` - Get processing status

**Sharing**
- `POST /api/v1/collections/{id}/share` - Generate shareable catalog image
- `GET /api/v1/collections/{id}/export` - Export collection data

**User Management**
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/settings` - Update user settings

## 4) Data Model (MongoDB Atlas)

**Collections:**

**users**
- `_id: ObjectId` (required)
- `email: str` (required, unique)
- `password_hash: str` (required)
- `name: str` (required)
- `created_at: datetime` (required)
- `updated_at: datetime` (required)
- `is_active: bool` (default: True)
- `settings: dict` (default: {})

Example:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "password_hash": "$argon2id$v=19$m=65536,t=3,p=4$...",
  "name": "John Doe",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "is_active": true,
  "settings": {"theme": "light", "notifications": true}
}
```

**collections**
- `_id: ObjectId` (required)
- `user_id: ObjectId` (required, ref: users)
- `name: str` (required)
- `shelf_image_url: str` (optional)
- `created_at: datetime` (required)
- `updated_at: datetime` (required)

Example:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "user_id": "507f1f77bcf86cd799439011",
  "name": "My Movie Collection",
  "shelf_image_url": "https://storage.example.com/photos/shelf123.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**movies**
- `_id: ObjectId` (required)
- `collection_id: ObjectId` (required, ref: collections)
- `title: str` (required)
- `release_year: int` (optional)
- `genre: str` (optional)
- `director: str` (optional)
- `runtime: int` (optional, minutes)
- `rating: str` (optional)
- `imdb_rating: float` (optional)
- `studio: str` (optional)
- `format: str` (optional)
- `language: str` (optional)
- `cast: list[str]` (optional)
- `plot: str` (optional)
- `awards: str` (optional)
- `box_office: str` (optional)
- `country: str` (optional)
- `poster_url: str` (optional)
- `personal_rating: int` (optional, 1-5)
- `notes: str` (optional)
- `tags: list[str]` (optional)
- `spine_position: dict` (optional, {x: float, y: float})
- `added_at: datetime` (required)

Example:
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "collection_id": "507f1f77bcf86cd799439012",
  "title": "The Dark Knight",
  "release_year": 2008,
  "genre": "Action",
  "director": "Christopher Nolan",
  "runtime": 152,
  "rating": "PG-13",
  "imdb_rating": 9.0,
  "cast": ["Christian Bale", "Heath Ledger"],
  "spine_position": {"x": 10.5, "y": 25.0},
  "added_at": "2024-01-01T00:00:00Z"
}
```

**photos**
- `_id: ObjectId` (required)
- `user_id: ObjectId` (required, ref: users)
- `filename: str` (required)
- `url: str` (required)
- `processing_status: str` (required, enum: pending/processing/completed/failed)
- `detected_titles: list[dict]` (optional)
- `uploaded_at: datetime` (required)

Example:
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "user_id": "507f1f77bcf86cd799439011",
  "filename": "shelf_photo_123.jpg",
  "url": "https://storage.example.com/photos/shelf_photo_123.jpg",
  "processing_status": "completed",
  "detected_titles": [{"title": "Batman", "confidence": 0.95}],
  "uploaded_at": "2024-01-01T00:00:00Z"
}
```

## 5) Frontend Audit & Feature Map

**Routes/Components Analysis:**

**Index Page (`/`)**
- Purpose: Main collection view and photo capture
- Data needed: User's movie collections, movies list
- Backend capability: `GET /api/v1/collections`, `GET /api/v1/collections/{id}/movies`
- Auth requirement: Yes
- Components: CatalogView, PhotoCapture

**PhotoCapture Component**
- Purpose: Upload/capture photos, AI vision processing
- Data needed: Photo upload, AI processing results
- Backend capability: `POST /api/v1/photos/upload`, `POST /api/v1/photos/{id}/process`
- Auth requirement: Yes

**CatalogView Component**
- Purpose: Display and manage movie collection
- Data needed: Movies list, search/filter, CRUD operations
- Backend capability: Movies CRUD endpoints, bulk operations
- Auth requirement: Yes

**MovieDetail Page (`/movie/{id}`)**
- Purpose: Detailed movie information display
- Data needed: Complete movie metadata
- Backend capability: `GET /api/v1/movies/{id}`
- Auth requirement: Yes

**ShareModal Component**
- Purpose: Generate and share collection images
- Data needed: Collection data for image generation
- Backend capability: `POST /api/v1/collections/{id}/share`
- Auth requirement: Yes

**Settings Page (`/settings`)**
- Purpose: User preferences and account management
- Data needed: User profile, settings
- Backend capability: `GET /api/v1/users/profile`, `PUT /api/v1/users/settings`
- Auth requirement: Yes

**About Page (`/about`)**
- Purpose: Static information page
- Data needed: None
- Backend capability: None required
- Auth requirement: No

## 6) Configuration & ENV Vars (core only)

- `APP_ENV` - environment name (development/production)
- `PORT` - HTTP port (default: 8000)
- `MONGODB_URI` - Atlas connection string
- `JWT_SECRET` - token signing secret (generate random 32+ chars)
- `JWT_EXPIRES_IN` - access token lifetime in seconds (default: 86400)
- `CORS_ORIGINS` - allowed origins (frontend URL, default: http://localhost:5137)

## 7) Background Work

**Photo Processing Task**
- Trigger: `POST /api/v1/photos/{id}/process` endpoint call
- Function: Coordinate AI vision services (Anthropic Claude, Google Vision) to extract movie titles
- Idempotency: Check processing_status before starting, update status atomically
- UI observation: Frontend polls `GET /api/v1/photos/{id}/status` or uses WebSocket updates

**Metadata Enrichment Task**
- Trigger: Movie creation/title updates
- Function: Enrich movie data with metadata from internal database
- Idempotency: Only enrich if metadata fields are empty
- UI observation: Immediate response with enriched data

## 8) Integrations

**Anthropic Claude Vision API**
- Purpose: Primary AI vision service for movie title detection
- Flow: Upload photo → call Claude Vision API → parse detected titles → return structured results
- Additional env: `ANTHROPIC_API_KEY`

**Google Cloud Vision API**
- Purpose: Fallback OCR service for text detection
- Flow: If Claude fails → call Google Vision → extract text → filter for movie titles
- Additional env: `GOOGLE_CLOUD_VISION_API_KEY`

**File Storage**
- Purpose: Store uploaded shelf photos
- Flow: Upload → store locally or cloud storage → return URL
- Additional env: `STORAGE_PATH` (local) or cloud storage credentials

## 9) Testing Strategy (Manual via Frontend)

**Policy:** Validate all functionality through the frontend UI by navigating screens, submitting forms, and observing Network tab in DevTools for API responses.

**Per-sprint Manual Test Checklist (Frontend):** Each sprint includes specific UI test steps and expected outcomes.

**User Test Prompt:** Copy-pasteable instructions for human testers to verify functionality through the UI.

**Post-sprint:** If manual tests pass, commit changes and push to GitHub `main` branch. If tests fail, fix issues and retest before pushing.

## 10) Dynamic Sprint Plan & Backlog (S0…S6)

### S0 - Environment Setup & Frontend Connection

**Objectives:**
- Create FastAPI skeleton with `/api/v1` structure and `/healthz` endpoint
- Set up MongoDB Atlas connection and basic configuration
- Implement health check with DB connectivity verification
- Enable CORS for frontend origin
- Initialize Git repository and GitHub setup
- Wire frontend to backend (configure API_BASE_URL)

**User Stories:**
- As a developer, I want a working FastAPI server so I can begin building features
- As a developer, I want DB connectivity verification so I know the system is properly configured
- As a user, I want the frontend to connect to the backend so I can use live data

**Tasks:**
- Set up Python 3.12 virtual environment and install FastAPI, Motor, Pydantic v2
- Create basic FastAPI app structure with `/api/v1` router
- Implement `/healthz` endpoint with MongoDB ping check
- Configure CORS middleware for frontend origin
- Set up environment variable loading
- Ask user for `MONGODB_URI` and configure connection
- Initialize Git repo, create `.gitignore`, set up GitHub remote
- Update frontend API configuration to point to backend
- Replace dummy data calls with real API calls

**Definition of Done:**
- Backend runs on port 8000 and responds to requests
- `/healthz` endpoint returns 200 with DB connectivity status
- Frontend successfully calls backend and renders live data
- Git repository exists on GitHub with `main` as default branch
- CORS allows frontend requests

**Manual Test Checklist (Frontend):**
- Set `MONGODB_URI` environment variable
- Start backend server (`python -m uvicorn main:app --reload`)
- Open frontend application
- Navigate to any page that triggers API calls
- Verify `/healthz` shows success in Network tab
- Confirm no CORS errors in browser console

**User Test Prompt:**
"Start the backend server, open the frontend app, and verify the health check works by opening browser DevTools → Network tab and looking for successful `/healthz` requests."

**Post-sprint:**
Commit all setup files and push to `main` branch.

### S1 - Basic Auth (signup, login, logout)

**Objectives:**
- Implement user registration, login, and logout functionality
- Set up JWT token-based authentication
- Protect at least one API endpoint and one frontend page
- Create user management in MongoDB

**User Stories:**
- As a new user, I want to create an account so I can save my movie collection
- As a returning user, I want to log in so I can access my saved data
- As a user, I want to log out so I can secure my account
- As a user, I want protected pages to require authentication

**Endpoints:**
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/logout` - Token invalidation
- `GET /api/v1/auth/me` - Current user info

**Tasks:**
- Create User Pydantic model and MongoDB collection
- Implement password hashing with Argon2
- Set up JWT token generation and validation
- Create authentication middleware for protected routes
- Build signup/login/logout endpoints
- Add authentication to at least one existing endpoint
- Update frontend to handle authentication flow
- Add login/signup forms to frontend
- Implement token storage and automatic logout

**Definition of Done:**
- Users can register new accounts via frontend
- Users can log in and receive JWT tokens
- Protected endpoints require valid authentication
- Users can log out and tokens are invalidated
- Frontend handles authentication state properly

**Manual Test Checklist (Frontend):**
- Register a new user account
- Log in with created credentials
- Access a protected page/feature
- Log out and verify access is blocked
- Try accessing protected content without login
- Verify token expiration handling

**User Test Prompt:**
"Create a new account, log in, access your collection, log out, and try to access the collection again to verify authentication works."

**Post-sprint:**
Commit authentication system and push to `main`.

### S2 - Collection Management

**Objectives:**
- Implement movie collection CRUD operations
- Support collection metadata (name, shelf images)
- Enable basic movie management within collections

**User Stories:**
- As a user, I want to create collections so I can organize my movies
- As a user, I want to name my collections so I can identify them
- As a user, I want to associate shelf photos with collections
- As a user, I want to view my collection details

**Endpoints:**
- `GET /api/v1/collections` - List user collections
- `POST /api/v1/collections` - Create collection
- `GET /api/v1/collections/{id}` - Get collection details
- `PUT /api/v1/collections/{id}` - Update collection
- `DELETE /api/v1/collections/{id}` - Delete collection

**Tasks:**
- Create Collection Pydantic model and MongoDB operations
- Implement collection CRUD endpoints with user ownership
- Add collection management to frontend
- Update existing frontend components to work with collections
- Handle default collection creation for new users

**Definition of Done:**
- Users can create and manage multiple collections
- Collections are properly associated with users
- Frontend displays collection information
- Collection metadata can be updated

**Manual Test Checklist (Frontend):**
- Create a new collection
- Update collection name
- View collection details
- Delete a collection
- Verify collections are user-specific

**User Test Prompt:**
"Create a new collection, give it a name, and verify it appears in your collection list."

**Post-sprint:**
Commit collection management and push to `main`.

### S3 - Movie CRUD Operations

**Objectives:**
- Implement complete movie management within collections
- Support all movie metadata fields from frontend
- Enable search and filtering capabilities
- Add bulk operations support

**User Stories:**
- As a user, I want to add movies to my collection so I can track them
- As a user, I want to edit movie details so I can correct information
- As a user, I want to delete movies so I can remove unwanted entries
- As a user, I want to search my movies so I can find specific titles
- As a user, I want to delete multiple movies at once for efficiency

**Endpoints:**
- `GET /api/v1/collections/{id}/movies` - Get movies with search/filter
- `POST /api/v1/collections/{id}/movies` - Add movie
- `GET /api/v1/movies/{id}` - Get movie details
- `PUT /api/v1/movies/{id}` - Update movie
- `DELETE /api/v1/movies/{id}` - Delete movie
- `DELETE /api/v1/collections/{id}/movies/bulk` - Bulk delete

**Tasks:**
- Create Movie Pydantic model with all metadata fields
- Implement movie CRUD operations with collection association
- Add search and filtering logic
- Build bulk operations support
- Integrate with frontend movie management components
- Add metadata enrichment from internal database

**Definition of Done:**
- Users can add movies with full metadata
- Movie details can be viewed and edited
- Search and filtering work properly
- Bulk delete operations function correctly
- Metadata enrichment enhances movie data

**Manual Test Checklist (Frontend):**
- Add a new movie to collection
- Edit movie details and save changes
- Search for movies by title
- Select multiple movies and bulk delete
- View detailed movie information
- Verify metadata enrichment works

**User Test Prompt:**
"Add several movies to your collection, edit one movie's details, search for a specific title, and delete multiple movies at once."

**Post-sprint:**
Commit movie management system and push to `main`.

### S4 - Photo Upload & Storage

**Objectives:**
- Implement photo upload functionality
- Set up file storage system
- Handle photo metadata and associations
- Support photo management operations

**User Stories:**
- As a user, I want to upload shelf photos so I can process them for movies
- As a user, I want my photos stored securely so I can access them later
- As a user, I want to associate photos with collections

**Endpoints:**
- `POST /api/v1/photos/upload` - Upload photo file
- `GET /api/v1/photos/{id}` - Get photo details
- `DELETE /api/v1/photos/{id}` - Delete photo

**Tasks:**
- Set up file upload handling with size/type validation
- Implement local file storage system
- Create Photo model and database operations
- Add photo upload to frontend integration
- Handle photo-collection associations
- Add photo management UI components

**Definition of Done:**
- Users can upload photos through frontend
- Photos are stored securely with proper validation
- Photo metadata is tracked in database
- Photos can be associated with collections

**Manual Test Checklist (Frontend):**
- Upload a shelf photo using camera capture
- Upload a photo using file selection
- Verify photo appears in collection
- Check photo file is stored properly
- Test upload validation (file size, type)

**User Test Prompt:**
"Take a photo of your movie shelf or upload an existing image and verify it's stored in your collection."

**Post-sprint:**
Commit photo upload system and push to `main`.

### S5 - AI Vision Processing

**Objectives:**
- Integrate Anthropic Claude Vision API
- Add Google Cloud Vision as fallback
- Implement background processing for AI analysis
- Handle detected titles and confidence scores

**User Stories:**
- As a user, I want AI to detect movie titles from my photos automatically
- As a user, I want backup processing if the primary AI fails
- As a user, I want to see processing status and results
- As a user, I want detected titles added to my collection

**Endpoints:**
- `POST /api/v1/photos/{id}/process` - Start AI processing
- `GET /api/v1/photos/{id}/status` - Get processing status
- `GET /api/v1/photos/{id}/results` - Get detected titles

**Tasks:**
- Integrate Anthropic Claude Vision API client
- Add Google Cloud Vision API as fallback
- Implement background task processing
- Create title detection and confidence scoring
- Add processing status tracking
- Update frontend to handle AI processing flow
- Implement retry logic and error handling

**Definition of Done:**
- AI vision successfully detects movie titles from photos
- Fallback processing works when primary fails
- Processing status is tracked and displayed
- Detected titles can be added to collections
- Error handling provides useful feedback

**Manual Test Checklist (Frontend):**
- Upload a photo and start AI processing
- Monitor processing status updates
- Review detected movie titles
- Add detected titles to collection
- Test with photos that should trigger fallback
- Verify error handling for failed processing

**User Test Prompt:**
"Upload a clear photo of your movie shelf, start AI processing, wait for results, and add the detected titles to your collection."

**Post-sprint:**
Commit AI vision integration and push to `main`.

### S6 - Sharing & Export

**Objectives:**
- Implement collection sharing functionality
- Generate shareable catalog images
- Support collection export formats
- Add social sharing capabilities

**User Stories:**
- As a user, I want to generate shareable images of my collection
- As a user, I want to export my collection data
- As a user, I want to share my collection on social media
- As a user, I want customizable sharing formats

**Endpoints:**
- `POST /api/v1/collections/{id}/share` - Generate share image
- `GET /api/v1/collections/{id}/export` - Export collection data
- `GET /api/v1/collections/{id}/share/{format}` - Get share in format

**Tasks:**
- Implement image generation for collection catalogs
- Add export functionality for collection data
- Create sharing templates and formats
- Integrate with frontend sharing components
- Add social media optimization
- Handle large collections in sharing

**Definition of Done:**
- Users can generate shareable collection images
- Collection data can be exported in useful formats
- Sharing integrates with social platforms
- Generated images are high quality and branded

**Manual Test Checklist (Frontend):**
- Generate a shareable image of your collection
- Download the generated image
- Export collection data
- Test sharing on social media
- Verify image quality and branding
- Test with large collections

**User Test Prompt:**
"Create a shareable image of your movie collection, download it, and share it on social media to show off your collection."

**Post-sprint:**
Commit sharing system and push to `main`.