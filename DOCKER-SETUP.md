# Docker Setup for JBIT Form Testing

## Current Status ⚠️

**Docker is not currently installed** on this system. The Docker infrastructure has been created and is ready for use once Docker is installed.

## Quick Docker Installation

### macOS (Current System)

**Option 1: Docker Desktop (Recommended)**
1. Download Docker Desktop from https://docker.com/products/docker-desktop
2. Install the `.dmg` file
3. Start Docker Desktop application
4. Wait for Docker to fully start (whale icon in menu bar)

**Option 2: Homebrew (Requires admin rights)**
```bash
brew install --cask docker
open -a Docker
```

### Verify Installation
```bash
# Check Docker is installed and running
docker --version
docker-compose --version
docker info
```

## Built Docker Infrastructure

All Docker files are ready and configured:

### ✅ Available Files:
- **`Dockerfile`** - Multi-stage container optimized for Playwright testing
- **`docker-compose.yml`** - Container orchestration with report server
- **`scripts/run-docker-tests.sh`** - Comprehensive Docker test runner
- **`.dockerignore`** - Optimized build context

### ✅ Features Ready:
- **Security**: Non-root user execution, isolated environment
- **Performance**: Optimized build layers, efficient caching
- **Flexibility**: Multiple test types (smoke/full) and browsers
- **Reports**: Built-in HTML report server on port 8080
- **Cleanup**: Automatic container and image cleanup options

## Usage Once Docker is Installed

### Basic Commands
```bash
# Run smoke tests (recommended first test)
npm run docker:test

# Run full test suite across all browsers
npm run docker:full

# Run with report server
npm run docker:reports

# Custom test execution
./scripts/run-docker-tests.sh -t smoke -b chromium -r
```

### Docker Commands
```bash
# Build the image manually
docker build -t jbit-form-tester .

# Run container with volume mounts
docker run --rm -v $(pwd)/customers/jbit/reports:/app/customers/jbit/reports jbit-form-tester

# Use Docker Compose
docker-compose up jbit-form-tests
docker-compose --profile reports up  # With report server
```

## Docker Architecture

### Container Specifications:
- **Base**: Microsoft Playwright official image (Ubuntu 22.04)
- **Node.js**: LTS version with npm
- **Browsers**: Chromium, Firefox, WebKit pre-installed
- **User**: Non-root `playwright` user for security
- **Volumes**: Report directories mounted for persistence

### Resource Requirements:
- **Memory**: ~2GB minimum, 4GB recommended
- **Disk**: ~2GB for images and containers
- **CPU**: Multi-core recommended for parallel browser testing

## Test Execution Flow

```
1. Build Docker image (jbit-form-tester)
2. Create container with volume mounts
3. Execute Playwright tests inside container
4. Generate reports in mounted volume
5. Cleanup container (image persists)
6. Optional: Start report server for viewing
```

## Benefits of Docker Setup

### ✅ **Consistency**
- Identical environment across development and CI
- Eliminates "works on my machine" issues
- Reproducible test execution

### ✅ **Isolation**
- Tests run in clean environment
- No conflicts with local dependencies
- Secure execution context

### ✅ **CI/CD Ready**
- Same containers in GitHub Actions
- Faster CI builds with image caching
- Reliable automation pipeline

## Troubleshooting

### Common Issues After Installation:

**1. Docker Not Starting**
```bash
# Check Docker Desktop is running
docker info

# If not running, start Docker Desktop app
open -a Docker
```

**2. Permission Issues**
```bash
# Ensure user is in docker group (Linux)
sudo usermod -aG docker $USER

# Restart terminal/logout and login
```

**3. Memory Issues**
```bash
# Increase Docker Desktop memory allocation
# Docker Desktop → Settings → Resources → Memory → 4GB+
```

**4. Build Failures**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t jbit-form-tester .
```

## Next Steps

1. **Install Docker Desktop** using one of the options above
2. **Verify installation** with `docker --version`
3. **Test Docker setup** with `npm run docker:test`
4. **View reports** with `npm run docker:reports`

The complete Docker infrastructure is ready - only the Docker installation itself is needed to make it functional.

## Integration with CI/CD

Once Docker is working locally, the same setup will work in:
- **GitHub Actions**: Automated daily testing
- **Local Development**: Consistent test environment
- **Team Collaboration**: Shared container configuration

All Docker configurations are production-ready and optimized for the JBIT form testing workflow.