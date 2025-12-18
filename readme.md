# WorkLune Backend Core


## Features

- 🚀 **Express.js** - Fast, minimalist web framework
- 🔒 **Authentication** - Secure authentication system with middleware
- ⚡ **Redis** - High-performance caching and session management
- 🛡️ **Rate Limiting** - Multi-level rate limiting (global, user, anomaly detection)
- 📚 **Swagger Documentation** - Auto-generated API documentation
- 🐳 **Docker Support** - Containerized Redis setup with Docker Compose
- 📝 **TypeScript** - Full type safety and modern JavaScript features

## Prerequisites

- Node.js (v18 or higher recommended)
- Docker & Docker Compose
- Redis (via Docker or local installation)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend-core-worklune
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create `.env.development` and `.env.prod` files in the root directory:

```env
# Example environment variables
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=abc$1289
```

4. Start Redis using Docker Compose:
```bash
docker-compose up -d
```

## Development

Run the development server with hot-reload:

```bash
npm run dev
```

The server will automatically restart when you make changes to the code.

## Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
backend-core-worklune/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   └── swagger.ts         # Swagger/OpenAPI configuration
│   ├── controllers/
│   │   └── auth.controllers.ts # Authentication controllers
│   ├── lib/
│   │   ├── redis.shutdown.ts  # Redis graceful shutdown handler
│   │   └── middleware/
│   │       ├── auth/          # Authentication middleware
│   │       └── limiters/      # Rate limiting middleware
│   ├── routes/
│   │   └── auth.routes.ts     # Authentication routes
│   ├── services/
│   │   └── redis.service.ts   # Redis client service
│   └── types/
│       └── express.d.ts       # Express type extensions
├── docker-compose.yaml         # Docker Compose configuration
├── package.json
├── tsconfig.json
└── readme.md
```

## Rate Limiting

The application includes three types of rate limiters:

- **Global Limiter** - Applies to all requests using Leaky Bucket Algorithm
- **User Limiter** - Per-user rate limiting using Token Bucket Algorithm
- **Anomaly Limiter** - Detects and prevents abnormal request patterns using Token Bucket Algorithm

## API Documentation

Once the server is running, visit the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## Docker Services

### Redis

The project uses Redis 7 Alpine for caching and session management:

- **Port:** 6379
- **Password:** abc$1289 (change in production!)
- **Data Persistence:** Enabled with AOF (Append-Only File)

Start Redis:
```bash
docker-compose up -d worklune-redis
```

Stop Redis:
```bash
docker-compose down
```

View Redis logs:
```bash
docker-compose logs -f worklune-redis
```

## Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

## Technologies

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Cache/Session Store:** Redis (ioredis)
- **Rate Limiting:** rate-limiter-flexible
- **API Documentation:** Swagger (swagger-jsdoc, swagger-ui-express)
- **Development:** ts-node-dev with path aliases

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

ISC

## Security Notes

⚠️ **Important:** Change the default Redis password in production environments!

- Update the password in `docker-compose.yaml`
- Update the corresponding environment variable
- Use strong, randomly generated passwords
- Consider using environment variables for sensitive data
