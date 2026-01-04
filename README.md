# Coffee Agent - Agora Conversational AI with Groq

A Next.js application demonstrating Agora's Conversational AI Engine with real-time voice communication powered by **Groq's ultra-fast LLM inference**. This interactive coffee shop assistant showcases how to build voice-enabled AI agents using Agora RTC, Groq LLMs, and modern web technologies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Build and Test](https://github.com/Alderson-dev/Coffee-Shop-AI-Voice-Agent/actions/workflows/docker-build.yml/badge.svg)](https://github.com/Alderson-dev/Coffee-Shop-AI-Voice-Agent/actions/workflows/docker-build.yml)

## ✨ Features

- 🎙️ **Real-time Voice Communication** - Low-latency audio streaming with Agora RTC SDK
- ⚡ **Powered by Groq** - Ultra-fast LLM inference with gpt-oss-20b (default) or OpenAI GPT-4
- 🤖 **AI-Powered Assistant** - Intelligent conversations with sub-second response times
- 🎯 **Simple REST API** - Easy-to-use endpoints for agent management
- 🐳 **Container Ready** - Full Docker and Podman support with docker-compose
- 🔒 **Secure by Default** - Environment-based configuration, no hardcoded secrets
- 💚 **Health Monitoring** - Built-in health check endpoints
- 🚀 **Production Ready** - HTTPS support with Caddy reverse proxy
- 📦 **Easy Deployment** - One-command setup with multiple deployment options

## 🏗️ Architecture

```
┌─────────────────┐
│  User Browser   │
│ (Agora RTC SDK) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Next.js API    │
│   Routes        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Agora Conv.   │
│   AI Engine v2  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Groq LLM API   │
│ (gpt-oss-20b) │
│  + OpenAI TTS   │
└─────────────────┘
```

## 📋 Prerequisites

**Required:**
- Docker/Podman (recommended) OR Node.js 20+
- [Agora Account](https://console.agora.io/) (free tier available)
- [Groq API Key](https://console.groq.com/) (free tier available - **recommended for best performance**)
- [OpenAI API Key](https://platform.openai.com/api-keys) (required for TTS, optional for LLM)

**Optional:**
- Make (for convenient commands)

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

The fastest way to get started:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd coffee-agent

# 2. Create environment file
cp .env.example .env

# 3. Edit .env with your credentials
nano .env  # or use your preferred editor

# 4. Start the application
docker-compose up -d

# 5. Verify it's running
curl http://localhost:3000/api/health
```

Access the application at: **http://localhost:3000**

With HTTPS (via Caddy): **https://localhost** (ports 3100/3443)

### Option 2: Using the Makefile

```bash
# One command to set everything up
make init

# Or step by step
make setup      # Create .env file
make build      # Build Docker image
make run        # Start application
make logs       # View logs
make health     # Check health status
```

### Option 3: Node.js Development

```bash
# Install dependencies
npm install

# Create and configure .env
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev

# Or build for production
npm run build
npm start
```

## 🔑 Environment Configuration

### 1. Get Your Credentials

**Agora Credentials** ([Get them here](https://console.agora.io/)):
- Log in to Agora Console
- Create a project (or use existing)
- Enable "App Certificate" under project settings
- Note down: App ID, App Certificate, Customer ID, Customer Secret

**Groq API Key** ([Get it here](https://console.groq.com/)) - **Recommended**:
- Create a free account at Groq
- Generate a new API key
- Note down the key (starts with `gsk_`)
- ⚡ **Why Groq?** Ultra-fast inference (~200-500ms response time vs 800-2000ms)

**OpenAI API Key** ([Get it here](https://platform.openai.com/api-keys)):
- Required for Text-to-Speech (TTS)
- Optional for LLM (if you want to use GPT instead of Groq)
- Create an account at OpenAI
- Generate a new API key
- Note down the key (starts with `sk-`)

### 2. Configure Environment Variables

Edit your `.env` file:

```env
# LLM Provider Selection
LLM_PROVIDER=groq  # Use 'groq' (recommended) or 'openai'

# Agora Configuration
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here
AGORA_CUSTOMER_ID=your_customer_id_here
AGORA_CUSTOMER_SECRET=your_customer_secret_here

# Groq Configuration (Recommended - Ultra-fast inference)
GROQ_API_KEY=your_groq_api_key_here

# OpenAI Configuration (Required for TTS, Optional for LLM)
OPENAI_API_KEY=your_openai_api_key_here
```

⚠️ **Security Note:** Never commit the `.env` file to version control. It's already in `.gitignore`.

## 📡 API Documentation

### Health Check

Check if the service is running and configured correctly.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "message": "Service is running",
  "timestamp": "2025-01-03T10:30:00.000Z",
  "environment": {
    "AGORA_APP_ID": true,
    "AGORA_APP_CERTIFICATE": true,
    "AGORA_CUSTOMER_ID": true,
    "AGORA_CUSTOMER_SECRET": true,
    "OPENAI_API_KEY": true
  }
}
```

### Start Agent

Start a conversational AI agent in a channel.

**Endpoint:** `POST /api/agents/start`

**Request Body:**
```json
{
  "channelName": "coffee-shop",
  "userUid": 0
}
```

**Response:**
```json
{
  "success": true,
  "agentId": "1NT29X10YHxxxxxWJOXLYHNYB",
  "channelName": "coffee-shop",
  "userToken": "rtc_token_here...",
  "appId": "your_app_id",
  "userUid": 0,
  "agentUid": 1
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/agents/start \
  -H "Content-Type: application/json" \
  -d '{"channelName": "test-channel", "userUid": 0}'
```

### Stop Agent

Stop a running conversational AI agent.

**Endpoint:** `POST /api/agents/stop`

**Request Body:**
```json
{
  "agentId": "1NT29X10YHxxxxxWJOXLYHNYB"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent stopped successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/agents/stop \
  -H "Content-Type: application/json" \
  -d '{"agentId": "YOUR_AGENT_ID"}'
```

## 🐳 Docker & Container Support

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild and start
docker-compose up -d --build

# Check status
docker-compose ps
```

### Podman Support

This project fully supports Podman as a Docker alternative:

```bash
# Podman 4.0+ (built-in compose)
podman-compose up -d

# Or use docker-compose command with Podman
docker-compose up -d  # works with Podman socket

# Manual Podman commands
podman build -t coffee-agent .
podman run -d --name coffee-agent -p 3000:3000 --env-file .env coffee-agent
```

### Standalone Docker

```bash
# Build
docker build -t coffee-agent:latest .

# Run
docker run -d \
  --name coffee-agent \
  -p 3000:3000 \
  --env-file .env \
  coffee-agent:latest

# View logs
docker logs -f coffee-agent

# Stop
docker stop coffee-agent

# Remove
docker rm coffee-agent
```

## 🔧 Configuration

### Agent Configuration

The AI agent is configured in `/app/api/agents/start/route.ts` with:

- **ASR (Speech Recognition)**: Agora ARES (English)
- **LLM**: Groq Llama 3.3 70B (default) or OpenAI GPT-4o-mini
- **TTS (Text-to-Speech)**: OpenAI TTS with Alloy voice
- **Idle Timeout**: 120 seconds
- **System Prompt**: Coffee shop order-taking assistant
- **Max History**: 32 messages

You can customize the agent behavior by modifying the `agentConfig` object in the start endpoint.

#### Switching LLM Providers

Set `LLM_PROVIDER` in your `.env` file:

```bash
# Use Groq (recommended for lowest latency)
LLM_PROVIDER=groq

# Use OpenAI (alternative)
LLM_PROVIDER=openai
```

**Performance Comparison:**
- **Groq (Llama 3.3 70B)**: ~200-500ms first response time ⚡
- **OpenAI (GPT-4o-mini)**: ~800-2000ms first response time

See `LLM_TESTING.md` for detailed latency testing guide.

### Port Configuration

Default ports in `docker-compose.yml`:

- **Application**: 3000 (internal)
- **HTTP (Caddy)**: 3100
- **HTTPS (Caddy)**: 3443

To change ports, edit `docker-compose.yml`:

```yaml
services:
  caddy:
    ports:
      - "8080:80"    # Change HTTP port
      - "8443:443"   # Change HTTPS port
```

### HTTPS with Caddy

The project includes Caddy reverse proxy for automatic HTTPS:

- Automatically generates self-signed certificates for local development
- Supports HTTP/2 and HTTP/3
- Auto-redirects HTTP to HTTPS

**Note:** Browsers will show a certificate warning for self-signed certificates. This is normal for local development.

## 🛠️ Development

### Project Structure

```
coffee-agent/
├── app/
│   ├── api/
│   │   ├── agents/
│   │   │   ├── start/route.ts      # Start agent endpoint
│   │   │   └── stop/route.ts       # Stop agent endpoint
│   │   └── health/route.ts         # Health check endpoint
│   ├── page.tsx                    # Main application page
│   └── layout.tsx                  # Root layout
├── public/                         # Static assets
├── Dockerfile                      # Docker image definition
├── Dockerfile.caddy                # Caddy reverse proxy image
├── docker-compose.yml              # Multi-container orchestration
├── Caddyfile                       # Caddy configuration
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore patterns
├── Makefile                        # Convenient commands
├── package.json                    # Node.js dependencies
└── README.md                       # This file
```

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

### Makefile Commands

```bash
make help          # Show all available commands
make init          # Full setup (create .env, build, run)
make setup         # Create .env from example
make build         # Build Docker images
make run           # Start containers
make stop          # Stop containers
make restart       # Restart containers
make logs          # View logs (tail)
make logs-follow   # Follow logs in real-time
make health        # Check application health
make rebuild       # Rebuild and restart
make clean         # Stop and remove everything
```

## 🐛 Troubleshooting

### Issue: "Missing required environment variables"

**Solution:** Ensure all variables are set in `.env`

```bash
# Check health endpoint to see which variables are missing
curl http://localhost:3000/api/health
```

### Issue: Container won't start

**Solution:** Check logs for details

```bash
docker-compose logs -f coffee-agent

# Or with Docker
docker logs coffee-agent
```

Common causes:
- Missing or invalid environment variables
- Port already in use
- Insufficient permissions

### Issue: Port already in use

**Solution:** Change the port mapping

Edit `docker-compose.yml`:
```yaml
services:
  coffee-agent:
    ports:
      - "8080:3000"  # Use port 8080 instead
```

### Issue: "Failed to start agent" or API errors

**Possible causes:**
1. Invalid Agora credentials
2. Invalid OpenAI API key
3. Network connectivity issues
4. Insufficient API credits

**Solution:**
1. Verify credentials in respective consoles
2. Check API key permissions and quotas
3. Review logs: `docker-compose logs -f`
4. Test health endpoint: `curl http://localhost:3000/api/health`

### Issue: Docker build fails

**Solution:** Clean and rebuild

```bash
# With Docker Compose
docker-compose down
docker system prune -a --volumes
docker-compose build --no-cache
docker-compose up -d

# With standalone Docker
docker stop coffee-agent
docker rm coffee-agent
docker system prune -a
docker build --no-cache -t coffee-agent:latest .
docker run -d --name coffee-agent -p 3000:3000 --env-file .env coffee-agent:latest
```

### Issue: Podman-specific errors

**Solution:** Ensure Podman socket is running

```bash
# Start Podman socket (systemd)
systemctl --user start podman.socket

# Or manually
podman system service --time=0 unix:///var/run/podman/podman.sock &

# For Podman Desktop users
# Socket is managed automatically
```

## 🚀 Production Deployment

### Security Checklist

- [ ] Use environment-specific secrets (not `.env` files)
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Set up rate limiting on API endpoints
- [ ] Configure CORS policies appropriately
- [ ] Use a secrets management service (AWS Secrets Manager, Vault, etc.)
- [ ] Enable container health checks
- [ ] Set resource limits (CPU, memory)
- [ ] Configure log aggregation and monitoring
- [ ] Set up automated backups for critical data
- [ ] Enable security scanning for container images

### Deployment Options

#### Docker with Production Settings

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  coffee-agent:
    image: coffee-agent:v1.0.0
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

#### Cloud Platforms

**AWS ECS / Fargate:**
- Use AWS Secrets Manager for credentials
- Deploy with Application Load Balancer
- Enable CloudWatch logs

**Google Cloud Run:**
```bash
gcloud run deploy coffee-agent \
  --image gcr.io/PROJECT_ID/coffee-agent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Azure Container Instances:**
```bash
az container create \
  --resource-group myResourceGroup \
  --name coffee-agent \
  --image coffee-agent:latest \
  --dns-name-label coffee-agent \
  --ports 3000
```

**DigitalOcean App Platform:**
- Connect GitHub repository
- Configure environment variables in dashboard
- Deploy automatically on push

**Vercel / Netlify:**
- Connect GitHub repository
- Add environment variables
- Deploy serverless functions

### Monitoring

Add health monitoring with tools like:
- **Uptime monitoring**: UptimeRobot, Pingdom, StatusCake
- **Application monitoring**: DataDog, New Relic, Sentry
- **Log aggregation**: ELK Stack, Splunk, Papertrail
- **Metrics**: Prometheus + Grafana

## 📚 Resources

### Official Documentation
- [Agora Conversational AI Documentation](https://docs.agora.io/en/conversational-ai/)
- [Agora RTC SDK Documentation](https://docs.agora.io/en/video-calling/)
- [Groq API Documentation](https://console.groq.com/docs)
- [Groq Models Overview](https://console.groq.com/docs/models)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Caddy Documentation](https://caddyserver.com/docs/)

### Support
- **Agora Support**: https://www.agora.io/en/support/
- **Agora Community**: https://www.agora.io/en/community/
- **Groq Discord**: https://groq.com/discord
- **GitHub Issues**: [Create an issue](../../issues)
- **OpenAI Community**: https://community.openai.com/

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Important Notes

- This is a demonstration project intended for learning and testing
- Ensure you comply with Agora and OpenAI terms of service
- API usage will incur costs based on your usage with both services
- Never commit API keys or secrets to version control
- Use environment variables or secrets management for production

## 🙏 Acknowledgments

- [Agora.io](https://www.agora.io/) for the Conversational AI Engine
- [Groq](https://groq.com/) for ultra-fast LLM inference
- [OpenAI](https://openai.com/) for TTS capabilities
- [Meta](https://www.meta.com/) for the Llama 3.3 model
- [Vercel](https://vercel.com/) for Next.js framework

---

**Built with ❤️ using Agora Conversational AI, Groq, and Next.js**

For questions or support, please [open an issue](../../issues) or contact the maintainers.
