# Deployment Guide for Truth or Dare Game

## Overview
This guide explains how to deploy the Truth or Dare game with database storage to production.

## Prerequisites
- Node.js 18+
- Docker (optional but recommended)
- SQLite database support

## Environment Variables

### Development (.env)
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

### Production (.env.production)
```
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
DATABASE_URL=file:/app/data/database.db
```

## Deployment Options

### Option 1: Direct Node.js Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Set production environment:**
   ```bash
   export NODE_ENV=production
   export PORT=3000
   export HOSTNAME=0.0.0.0
   export DATABASE_URL=file:/app/data/database.db
   ```

3. **Create data directory:**
   ```bash
   mkdir -p /app/data
   ```

4. **Seed the database:**
   ```bash
   npm run db:seed
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

### Option 2: Docker Deployment (Recommended)

1. **Build Docker image:**
   ```bash
   docker build -t truth-or-dare .
   ```

2. **Run container:**
   ```bash
   docker run -d \
     --name truth-or-dare \
     -p 3000:3000 \
     -v $(pwd)/data:/app/data \
     -e NODE_ENV=production \
     -e DATABASE_URL=file:/app/data/database.db \
     truth-or-dare
   ```

3. **Seed the database (first time only):**
   ```bash
   docker exec -it truth-or-dare npm run db:seed
   ```

### Option 3: Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/database.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
docker-compose exec app npm run db:seed
```

## Health Check

The application includes a health check endpoint:
- **URL:** `/api/health`
- **Method:** GET
- **Response:** 
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "database": "connected",
    "environment": "production"
  }
  ```

## Troubleshooting

### 502 Bad Gateway Issues

1. **Check if the application is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check application logs:**
   ```bash
   docker logs truth-or-dare
   # or
   journalctl -u your-service-name
   ```

3. **Verify database connection:**
   - Ensure the database file exists
   - Check file permissions
   - Verify the DATABASE_URL is correct

4. **Check port availability:**
   ```bash
   netstat -tlnp | grep :3000
   ```

5. **Verify environment variables:**
   ```bash
   env | grep -E "(NODE_ENV|PORT|DATABASE_URL)"
   ```

### Common Issues

1. **Database connection failed:**
   - Ensure the database directory exists
   - Check file permissions
   - Verify the SQLite file path

2. **Port already in use:**
   - Change the PORT environment variable
   - Kill the process using the port

3. **Build failures:**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

## Performance Considerations

1. **Database:** SQLite is suitable for small to medium applications
2. **Memory:** The application uses approximately 100-200MB RAM
3. **CPU:** Minimal CPU requirements
4. **Storage:** Database grows with added truths/dares

## Scaling

For larger deployments, consider:
1. Migrating to PostgreSQL or MySQL
2. Adding a reverse proxy (nginx)
3. Implementing caching
4. Load balancing

## Security

1. **Environment Variables:** Never commit `.env` files
2. **Database:** Ensure proper file permissions
3. **Network:** Use HTTPS in production
4. **Updates:** Regularly update dependencies

## Monitoring

Monitor the following metrics:
1. Application uptime (use `/api/health`)
2. Database size and performance
3. Memory usage
4. Error rates

## Backup

For SQLite, regularly backup the database file:
```bash
cp /app/data/database.db /backup/database-$(date +%Y%m%d).db
```