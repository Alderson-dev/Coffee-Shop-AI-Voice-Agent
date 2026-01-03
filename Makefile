.PHONY: help build run stop restart logs clean rebuild health test shell exec detect-runtime troubleshoot caddy-logs caddy-reload caddy-cert caddy-validate

# Detect container runtime (docker or podman)
CONTAINER_RUNTIME := $(shell command -v docker 2>/dev/null)
ifdef CONTAINER_RUNTIME
    RUNTIME := docker
    # Check if docker compose or docker-compose is available
    COMPOSE_CMD := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || echo "docker-compose")
else
    CONTAINER_RUNTIME := $(shell command -v podman 2>/dev/null)
    ifdef CONTAINER_RUNTIME
        RUNTIME := podman
        # Check if podman compose (built-in) or podman-compose (Python) is available
        COMPOSE_CMD := $(shell podman compose version >/dev/null 2>&1 && echo "podman compose" || (command -v podman-compose >/dev/null 2>&1 && echo "podman-compose"))
        ifndef COMPOSE_CMD
            $(error Podman is installed but neither 'podman compose' nor 'podman-compose' is available. Install podman-compose with: pip3 install podman-compose)
        endif
    else
        $(error Neither Docker nor Podman is installed. Please install one of them.)
    endif
endif

IMAGE_NAME := coffee-agent

# Default target
help:
	@echo "Coffee Agent - Docker/Podman Commands"
	@echo "======================================"
	@echo ""
	@echo "Detected runtime: $(RUNTIME)"
	@echo "Compose command:  $(COMPOSE_CMD)"
	@echo ""
	@echo "🔒 Access URLs:"
	@echo "  HTTPS (Recommended): https://localhost:3443"
	@echo "  HTTP:                http://localhost:3100 (redirects to HTTPS)"
	@echo "  Health Check:        https://localhost:3443/api/health"
	@echo ""
	@echo "Available commands:"
	@echo "  make build          - Build the container image"
	@echo "  make run            - Run the application"
	@echo "  make stop           - Stop the application"
	@echo "  make restart        - Restart the application"
	@echo "  make logs           - View application logs"
	@echo "  make logs-follow    - Follow application logs in real-time"
	@echo "  make clean          - Remove everything"
	@echo "  make rebuild        - Rebuild and restart"
	@echo "  make health         - Check application health status"
	@echo "  make shell          - Open a shell in the running container"
	@echo "  make ps             - Show running containers"
	@echo "  make prune          - Clean up container system (use with caution)"
	@echo "  make detect-runtime - Show detected container runtime"
	@echo "  make troubleshoot   - Run troubleshooting diagnostics"
	@echo ""
	@echo "Caddy (HTTPS) commands:"
	@echo "  make caddy-logs     - View Caddy logs"
	@echo "  make caddy-reload   - Reload Caddy configuration"
	@echo "  make caddy-cert     - Export Caddy root certificate"
	@echo "  make caddy-validate - Validate Caddyfile syntax"
	@echo ""
	@echo "📖 Documentation: See CADDY_HTTPS_GUIDE.md for HTTPS setup"
	@echo ""

# Detect and display runtime info
detect-runtime:
	@echo "Container Runtime Detection"
	@echo "==========================="
	@echo "Runtime: $(RUNTIME)"
	@echo "Compose: $(COMPOSE_CMD)"
	@echo ""
	@$(RUNTIME) --version
	@echo ""
	@$(COMPOSE_CMD) version || echo "Compose version unknown"

# Build the container image
build:
	@echo "Building container image with $(RUNTIME)..."
	$(COMPOSE_CMD) build

# Run the application
run:
	@echo "Starting Coffee Agent with $(RUNTIME)..."
	$(COMPOSE_CMD) up -d
	@echo "Application started! Access it at http://localhost:3000"

# Stop the application
stop:
	@echo "Stopping Coffee Agent..."
	$(COMPOSE_CMD) down

# Restart the application
restart:
	@echo "Restarting Coffee Agent..."
	$(COMPOSE_CMD) restart

# View logs
logs:
	$(COMPOSE_CMD) logs

# Follow logs in real-time
logs-follow:
	$(COMPOSE_CMD) logs -f

# Clean up everything
clean:
	@echo "Cleaning up containers, networks, and volumes..."
	$(COMPOSE_CMD) down -v
	@echo "Clean complete!"

# Rebuild and restart
rebuild:
	@echo "Rebuilding and restarting Coffee Agent with $(RUNTIME)..."
	$(COMPOSE_CMD) down
	$(COMPOSE_CMD) build --no-cache
	$(COMPOSE_CMD) up -d
	@echo "Rebuild complete! Application restarted."

# Check health
health:
	@echo "Checking application health..."
	@curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/health

# Open shell in container
shell:
	@echo "Opening shell in container..."
	$(COMPOSE_CMD) exec coffee-agent sh

# Show running containers
ps:
	$(COMPOSE_CMD) ps

# Prune container system
prune:
	@echo "WARNING: This will remove all unused container resources!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(RUNTIME) system prune -a; \
	fi

# Setup environment
setup:
	@if [ ! -f .env ]; then \
		echo "Creating .env file from .env.example..."; \
		cp .env.example .env; \
		echo ".env file created! Please edit it with your credentials."; \
	else \
		echo ".env file already exists."; \
	fi

# Full setup and run
init: setup detect-runtime build run
	@echo ""
	@echo "✅ Coffee Agent is initialized and running!"
	@echo "📝 Don't forget to update your .env file with real credentials"
	@echo "🔒 Access the app at: https://localhost:3443 (HTTPS with Caddy)"
	@echo "🌐 Or via HTTP: http://localhost:3100 (redirects to HTTPS)"
	@echo "💚 Health check: https://localhost:3443/api/health"
	@echo "🔧 Using: $(RUNTIME) with $(COMPOSE_CMD)"
	@echo ""
	@echo "💡 First time? Trust the certificate: make caddy-cert"
	@echo "📖 HTTPS guide: CADDY_HTTPS_GUIDE.md"
	@echo "📋 New ports: HTTP=3100, HTTPS=3443 (rootless compatible)"

# Run troubleshooting script
troubleshoot:
	@echo "Running troubleshooting diagnostics..."
	@./troubleshoot.sh

# Caddy commands
caddy-logs:
	@echo "Viewing Caddy logs..."
	$(COMPOSE_CMD) logs -f caddy

caddy-reload:
	@echo "Reloading Caddy configuration..."
	$(COMPOSE_CMD) restart caddy
	@echo "Caddy reloaded successfully!"

caddy-cert:
	@echo "Exporting Caddy root certificate..."
	@mkdir -p ./certs
	@$(RUNTIME) cp coffee-agent-caddy:/data/caddy/pki/authorities/local/root.crt ./certs/caddy-root.crt 2>/dev/null || \
		echo "Certificate not found. Make sure Caddy is running (make run)"
	@if [ -f ./certs/caddy-root.crt ]; then \
		echo "Certificate exported to: ./certs/caddy-root.crt"; \
		echo ""; \
		echo "To trust this certificate:"; \
		echo "  macOS:   sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./certs/caddy-root.crt"; \
		echo "  Linux:   sudo cp ./certs/caddy-root.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"; \
		echo "  Windows: Import into Trusted Root Certification Authorities"; \
	fi

caddy-validate:
	@echo "Validating Caddyfile..."
	@$(RUNTIME) exec coffee-agent-caddy caddy validate --config /etc/caddy/Caddyfile && \
		echo "✅ Caddyfile is valid!" || \
		echo "❌ Caddyfile has errors"
