# Flashcard App

A modern, full-stack spaced repetition flashcard application designed for language learning with Chinese/Mandarin support. Built with an offline-first architecture featuring FSRS algorithm, neural TTS, and comprehensive user management.

## Overview

This application combines cutting-edge spaced repetition learning with powerful language learning features. It provides an offline-first experience with automatic cloud synchronization, making it perfect for consistent language study anywhere.

**Key Highlights:**
- FSRS (Free Spaced Repetition Scheduler) algorithm for optimized review scheduling
- Microsoft Edge Neural TTS for high-quality Chinese pronunciation
- Bidirectional flashcards (Chinese→English and English→Chinese)
- Offline-first with IndexedDB, automatic PostgreSQL sync
- Secure authentication with OAuth support
- Admin dashboard for user management
- Dark/light theme support
- Rate limiting and brute force protection

## Features

### Learning Features
- **FSRS Algorithm**: State-of-the-art spaced repetition using [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) for optimal retention
- **Bidirectional Cards**: Automatically create card pairs for studying in both directions (中→EN and EN→中)
- **Chinese TTS**: Microsoft Edge Neural voices with 8+ voice options including regional dialects
- **Deck Management**: Organize cards into decks with customizable settings
- **Study Statistics**: Track progress, retention rates, and study streaks
- **Review Logs**: Complete history of all card reviews for analysis

### Technical Features
- **Offline-First**: Full functionality without internet using IndexedDB (via Dexie.js)
- **Auto-Sync**: Background synchronization with PostgreSQL backend
- **User Authentication**: Secure login/register with JWT cookies
- **OAuth Support**: GitHub and Google OAuth integration
- **Admin Dashboard**: User management, statistics, and system monitoring
- **Rate Limiting**: Brute force protection with IP-based lockouts
- **Responsive UI**: Built with shadcn/ui and Tailwind CSS
- **Docker Deployment**: Single-command deployment with Docker Compose

## Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - High-quality component library based on Radix UI
- **Dexie.js** - IndexedDB wrapper for offline storage
- **ts-fsrs** - FSRS spaced repetition algorithm
- **date-fns** - Date utilities

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL 16** - Primary database
- **SQLAlchemy** - ORM and database toolkit
- **edge-tts** - Microsoft Edge Neural TTS engine
- **python-jose** - JWT token handling
- **Authlib** - OAuth 2.0 integration
- **Alembic** - Database migrations

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Frontend web server and reverse proxy
- **GitHub Actions** - CI/CD for building and releasing images
- **GHCR** - GitHub Container Registry for image hosting

## Getting Started

### Prerequisites
- Docker and Docker Compose
- (Optional) Node.js 18+ and Python 3.11+ for local development

### Quick Start with Docker Compose

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flashcard-app
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure at minimum:
   ```env
   POSTGRES_PASSWORD=your_secure_password_here
   SECRET_KEY=your_secret_key_change_in_production
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=your_admin_password
   FRONTEND_URL=http://localhost:3100
   ```

3. **Start the application**
   ```bash
   # Using pre-built images from GHCR (recommended)
   docker compose up -d

   # Or build from source for local development
   docker compose -f docker-compose.local.yml up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3100
   - Backend API: http://localhost:3100/api (proxied via nginx)
   - API Docs: http://localhost:3100/docs

5. **Login**
   - Use the admin credentials from your `.env` file
   - Or register a new account if `REGISTRATION_ENABLED=true`

### Development Setup

#### Frontend Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

#### Backend Development
```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL database password | `flashcard_secret` | `mySecureP@ss123` |
| `SECRET_KEY` | JWT signing key (generate with `openssl rand -hex 32`) | `your-secret-key-change-in-production` | `a1b2c3d4e5f6...` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `FRONTEND_URL` | Frontend URL for CORS and OAuth redirects | `http://10.0.10.180:3100` | `https://cards.example.com` |
| `REGISTRATION_ENABLED` | Allow new user registration | `true` | `false` |
| `ADMIN_EMAIL` | Admin user email (auto-created on startup) | `Hello@Apinant.dev` | `admin@example.com` |
| `ADMIN_PASSWORD` | Admin user password | `admin123` | `SecureAdmin123!` |
| `SECURE_COOKIES` | Use secure cookies (HTTPS only) | `false` | `true` |

### OAuth Configuration

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `OAUTH_ENABLED` | Enable OAuth authentication | Set to `true` to enable |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | https://github.com/settings/developers |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | https://github.com/settings/developers |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | https://console.cloud.google.com/apis/credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | https://console.cloud.google.com/apis/credentials |

### Rate Limiting

| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_LOGIN_ATTEMPTS` | Max failed login attempts before lockout | `5` |
| `LOCKOUT_DURATION_MINUTES` | Account lockout duration | `15` |

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │   Dexie.js   │  │  API Client  │      │
│  │  (shadcn/ui) │──│  (IndexedDB) │──│  (sync)      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          │                  │                  ▼
          │                  │          ┌──────────────┐
          │                  │          │    nginx     │
          │                  │          │  (reverse    │
          │                  │          │   proxy)     │
          │                  │          └──────────────┘
          │                  │                  │
          │                  │                  ▼
┌─────────┼──────────────────┼──────────────────────────────────┐
│         │                  │          Backend                 │
│         ▼                  ▼                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   FastAPI    │  │  PostgreSQL  │  │  edge-tts    │        │
│  │  (REST API)  │──│  (Database)  │  │   (TTS)      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │     Auth     │  │    Admin     │  │     Sync     │        │
│  │  (JWT/OAuth) │  │  Dashboard   │  │   Service    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input** → React UI components
2. **Local Storage** → Dexie.js writes to IndexedDB
3. **Background Sync** → Auto-sync hook periodically syncs to backend
4. **API Request** → FastAPI processes and validates
5. **Database** → PostgreSQL stores user-scoped data
6. **Response** → Client updates local state and IndexedDB

### Offline-First Strategy

- All reads happen from IndexedDB (instant)
- All writes go to IndexedDB first (optimistic UI)
- Background sync pushes changes to PostgreSQL
- On login, client syncs from server if local DB is empty
- Conflict resolution: server wins (last-write-wins)

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/auth/config` | Get auth configuration (registration, OAuth status) | No |
| `POST` | `/auth/register` | Register new user | No |
| `POST` | `/auth/login` | Login with email/password | No |
| `POST` | `/auth/logout` | Logout current user | Yes |
| `GET` | `/auth/me` | Get current user info | Yes |
| `POST` | `/auth/refresh` | Refresh JWT token | Yes |
| `PUT` | `/auth/password` | Change password | Yes |

### OAuth (`/oauth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/oauth/github` | Initiate GitHub OAuth flow | No |
| `GET` | `/oauth/github/callback` | GitHub OAuth callback | No |
| `GET` | `/oauth/google` | Initiate Google OAuth flow | No |
| `GET` | `/oauth/google/callback` | Google OAuth callback | No |

### Flashcard Data (`/api`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/decks` | List all user's decks | Yes |
| `POST` | `/api/decks` | Create new deck | Yes |
| `GET` | `/api/decks/{id}` | Get deck details | Yes |
| `PUT` | `/api/decks/{id}` | Update deck | Yes |
| `DELETE` | `/api/decks/{id}` | Delete deck and all cards | Yes |
| `GET` | `/api/cards` | List all user's cards | Yes |
| `GET` | `/api/cards/due` | Get cards due for review | Yes |
| `POST` | `/api/cards` | Create new card | Yes |
| `GET` | `/api/cards/{id}` | Get card details | Yes |
| `PUT` | `/api/cards/{id}` | Update card | Yes |
| `DELETE` | `/api/cards/{id}` | Delete card | Yes |
| `GET` | `/api/review-logs` | Get review history | Yes |
| `POST` | `/api/review-logs` | Record card review | Yes |
| `GET` | `/api/study-sessions` | Get study sessions | Yes |
| `POST` | `/api/study-sessions` | Create study session | Yes |
| `PUT` | `/api/study-sessions/{id}` | Update study session | Yes |

### Sync (`/api`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/sync` | Upload all local data to server | Yes |
| `GET` | `/api/sync` | Download all user data from server | Yes |

### Text-to-Speech

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/tts?text={text}&voice={voice}` | Generate Chinese TTS audio | No |
| `POST` | `/tts` | Generate TTS with full options | No |
| `GET` | `/voices` | List available Chinese voices | No |
| `GET` | `/voices/all` | List all Edge TTS voices | No |
| `DELETE` | `/cache` | Clear TTS audio cache | No |

### Admin (`/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/admin/users` | List all users (paginated) | Admin |
| `GET` | `/admin/users/{id}` | Get user details | Admin |
| `POST` | `/admin/users` | Create new user | Admin |
| `PUT` | `/admin/users/{id}` | Update user (activate/deactivate, admin status) | Admin |
| `DELETE` | `/admin/users/{id}` | Delete user and all data | Admin |
| `GET` | `/admin/stats` | Get system-wide statistics | Admin |

### Health & Status

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | API health check | No |
| `GET` | `/health` | Detailed health status | No |

## Database Schema

### Users Table
```sql
- id (UUID, PK)
- email (String, unique)
- username (String, unique)
- password_hash (String, nullable for OAuth users)
- oauth_provider (String, nullable)
- oauth_id (String, nullable)
- is_active (Boolean)
- is_admin (Boolean)
- created_at (DateTime)
- updated_at (DateTime)
```

### Decks Table
```sql
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- name (String)
- description (Text)
- parent_id (UUID, FK → decks.id, nullable)
- settings (JSONB)
- created_at (DateTime)
- updated_at (DateTime)
```

### Cards Table
```sql
- id (UUID, PK)
- deck_id (UUID, FK → decks.id)
- type (String: 'basic', 'cloze', etc.)
- direction (String: 'normal', 'reverse')
- pair_id (UUID, nullable, links bidirectional cards)
- front (Text)
- back (Text)
- audio (Text, nullable)
- tags (ARRAY[String])
- media_urls (ARRAY[String])
- fsrs_* (FSRS algorithm fields)
- created_at (DateTime)
- updated_at (DateTime)
```

### ReviewLogs Table
```sql
- id (UUID, PK)
- card_id (UUID, FK → cards.id)
- rating (Integer: 1-4)
- state (Integer: FSRS state)
- due (DateTime)
- stability (Float)
- difficulty (Float)
- elapsed_days (Integer)
- scheduled_days (Integer)
- review (DateTime)
```

### StudySessions Table
```sql
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- deck_id (UUID, FK → decks.id)
- start_time (DateTime)
- end_time (DateTime, nullable)
- cards_studied (Integer)
- again_count (Integer)
- hard_count (Integer)
- good_count (Integer)
- easy_count (Integer)
```

## Chinese TTS Voices

The app includes 8 Microsoft Edge Neural voices for Chinese:

| Voice ID | Gender | Description |
|----------|--------|-------------|
| `xiaoxiao` | Female | Warm and cheerful (recommended) |
| `xiaoyi` | Female | Lively |
| `yunjian` | Male | Professional |
| `yunxi` | Male | Cheerful |
| `yunxia` | Male | Calm |
| `yunyang` | Male | Professional news style |
| `liaoning` | Female | Liaoning dialect |
| `shaanxi` | Female | Shaanxi dialect |

### TTS Parameters
- **Rate**: `-50%` to `+100%` (speech speed)
- **Pitch**: Adjustable with `+NHz` format
- **Caching**: Automatic MD5-based caching for repeated phrases

## Security Features

### Authentication
- JWT tokens with configurable expiry (default: 7 days)
- HTTP-only cookies for token storage
- CSRF protection via SameSite cookies
- Password hashing with bcrypt
- Password strength validation (min 8 chars)

### Rate Limiting
- IP-based brute force protection
- Configurable max attempts (default: 5)
- Automatic lockout duration (default: 15 minutes)
- Tracking of failed login attempts
- Clear attempts on successful login

### Authorization
- User-scoped data access (users can only access their own data)
- Admin-only endpoints for user management
- OAuth provider verification
- Active user status checks

### OAuth Security
- State parameter for CSRF protection
- Secure token exchange
- Provider verification
- Automatic account linking by email

## Project Structure

```
flashcard-app/
├── src/                      # Frontend source
│   ├── components/           # React components
│   ├── contexts/             # React contexts (Auth, etc.)
│   ├── db/                   # Dexie.js database
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and API client
│   ├── pages/                # Page components
│   ├── types/                # TypeScript types
│   └── App.tsx               # Main app component
├── server/                   # Backend source
│   ├── main.py               # FastAPI app and TTS endpoints
│   ├── database.py           # SQLAlchemy models
│   ├── api.py                # Flashcard CRUD endpoints
│   ├── auth.py               # Authentication routes
│   ├── oauth.py              # OAuth integration
│   ├── admin.py              # Admin routes
│   ├── middleware.py         # Auth middleware
│   └── requirements.txt      # Python dependencies
├── .github/
│   └── workflows/
│       └── release.yml       # CI/CD for GHCR releases
├── docker-compose.yml        # Production (uses GHCR images)
├── docker-compose.local.yml  # Development (builds from source)
├── Dockerfile.frontend       # Frontend container
├── Dockerfile.backend        # Backend container
├── nginx.conf                # Nginx configuration
├── package.json              # Frontend dependencies
└── .env.example              # Environment template
```

## Deployment

### Docker Images

Pre-built images are available on GitHub Container Registry:

```bash
docker pull ghcr.io/loneexile/flashcard-frontend:latest
docker pull ghcr.io/loneexile/flashcard-backend:latest
```

**Available Tags:**
- `latest` - Latest stable release
- `x.y.z` - Specific version (e.g., `1.0.0`)
- `x.y` - Minor version (e.g., `1.0`)
- `x` - Major version (e.g., `1`)

Images are automatically built and pushed via GitHub Actions when a new release is published.

### Production Considerations

1. **Environment Variables**
   - Set a strong `SECRET_KEY` (use `openssl rand -hex 32`)
   - Use strong `POSTGRES_PASSWORD`
   - Set `SECURE_COOKIES=true` when using HTTPS
   - Configure `FRONTEND_URL` to your domain

2. **HTTPS/SSL**
   - Use a reverse proxy (nginx, Caddy, Traefik) with SSL
   - Update `SECURE_COOKIES=true`
   - Configure OAuth redirect URLs for HTTPS

3. **Database**
   - Uncomment volume mounts in `docker-compose.yml` for persistence
   - Regular backups of PostgreSQL data
   - Consider connection pooling for high traffic

4. **Scaling**
   - Backend is stateless and can be horizontally scaled
   - Use external session storage for multi-instance deployments
   - Configure load balancer for frontend/backend

5. **Monitoring**
   - Health endpoints: `/health` and `/`
   - Monitor PostgreSQL performance
   - Track TTS cache size
   - Review login attempt logs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) - FSRS algorithm implementation
- [edge-tts](https://github.com/rany2/edge-tts) - Microsoft Edge TTS API
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
