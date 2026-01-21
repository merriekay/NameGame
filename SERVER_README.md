# Student Name Flashcards - Server Setup

Backend API for the Student Name Flashcards application.

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account and cluster (free tier M0)
3. Create database user
4. Get connection string from "Connect" → "Connect your application"

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your MongoDB URI and JWT secret:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/namegame
JWT_SECRET=generate_a_random_secret_here
PORT=5000
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run Server
```bash
npm start
# Or with auto-reload:
npm run dev  # requires: npm install -D nodemon
```

Server runs on http://localhost:5000

## API Documentation

All endpoints return JSON.

### Auth Routes

**POST /api/auth/signup**
```json
{
  "email": "prof@university.edu",
  "password": "secure123",
  "name": "Professor Smith"
}
```
Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "prof@university.edu",
    "name": "Professor Smith"
  }
}
```

**POST /api/auth/login**
```json
{
  "email": "prof@university.edu",
  "password": "secure123"
}
```

**GET /api/auth/me** (requires Bearer token)

### Deck Routes

All require `Authorization: Bearer <token>` header

**GET /api/decks**
Returns all decks for authenticated user

**POST /api/decks**
```json
{
  "name": "CS178_S1",
  "cards": []
}
```

**PUT /api/decks/:id**
```json
{
  "name": "Updated Name",
  "cards": [...]
}
```

**DELETE /api/decks/:id**

**POST /api/decks/:id/cards**
```json
{
  "name": "John Doe",
  "image": "data:image/jpeg;base64,..."
}
```

**PUT /api/decks/:deckId/cards/:cardId/progress**
```json
{
  "progress": 2
}
```

**DELETE /api/decks/:deckId/cards/:cardId**

## MongoDB Atlas Setup (Detailed)

1. **Create Account**: https://www.mongodb.com/cloud/atlas/register
2. **Create Cluster**:
   - Choose FREE tier (M0)
   - Select cloud provider & region
   - Cluster name: keep default or customize
3. **Create Database User**:
   - Security → Database Access → Add New User
   - Choose password authentication
   - Save username/password
4. **Whitelist IP**:
   - Security → Network Access → Add IP Address
   - For development: "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IPs
5. **Get Connection String**:
   - Deployment → Database → Connect
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password

## Troubleshooting

**"MongoServerError: bad auth"**
- Check username/password in connection string
- Ensure database user exists

**"connect ECONNREFUSED"**
- Check MongoDB Atlas is accessible
- Verify IP whitelist settings

**"JWT malformed"**
- Token might be missing/invalid
- Check Authorization header format: `Bearer <token>`

## Security Notes

- Never commit `.env` file
- Use strong JWT_SECRET (32+ characters)
- In production, use HTTPS only
- Set NODE_ENV=production
- Implement rate limiting (e.g., express-rate-limit)
