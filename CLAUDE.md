# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **simplified functional testing project** for Elementor forms using Playwright. The primary focus is basic form functionality testing with simple alerting - no complex infrastructure or advanced features.

**Key Principle: ALWAYS USE AGENTS FIRST** - For any task, try using the available specialized agents before doing work directly.

## ✅ Project Status: OPERATIONAL

The E2E testing framework is **successfully configured and working**:
- ✅ **Form Testing**: Successfully submits forms and detects successful redirects
- ✅ **Cloudflare Turnstile Bypass**: Working with proper user agent + IP whitelisting
- ✅ **Customer Organization**: Tests organized by customer in `customers/{customer}/` structure
- ✅ **Docker Infrastructure**: Ready for CI/CD deployment
- ✅ **Test Validation**: Comprehensive success/failure detection with screenshots

**Current Configuration**:
- Customer: JBIT (`customers/jbit/`)
- Form URL: `https://jbit.be/contact-nl/`
- User Agent: `JBIT-Bot/1.0 (+https://jbit.be/bot)`
- Status: All tests passing ✅

**⚠️ CRITICAL REQUIREMENT**: Local IP addresses must be whitelisted in both Cloudflare WAF rules AND WordPress Turnstile plugin configuration for tests to work properly.

## Common Commands

### Initial Setup (if not already done)
```bash
npm init -y
npm install --save-dev @playwright/test
npx playwright install chromium
```

### Running Tests in Docker (Recommended)
```bash
# Using official Playwright Docker image
docker run --rm -v $(pwd):/work -w /work mcr.microsoft.com/playwright:latest npx playwright test

# Run with custom Dockerfile
docker build -t elementor-tests .
docker run --rm -v $(pwd):/tests elementor-tests

# Run with docker-compose
docker-compose up --abort-on-container-exit
```

### Running Tests Locally
```bash
# Run all tests
npm test

# Run specific customer tests
npm test customers/jbit/tests/simple-smoke-test.spec.js

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests with debugging
npx playwright test --debug

# Generate test report
npx playwright show-report

# View test results and artifacts
ls customers/jbit/reports/test-artifacts/
```

### Development Commands
```bash
# Generate selectors (opens Playwright Inspector)
npx playwright codegen [URL]

# Check test configuration
npx playwright test --list

# Run tests in specific browser
npx playwright test --project=chromium
```

## Project Architecture

### Expected Structure
```
/
├── tests/
│   ├── elementor-form.spec.js    # Main test file for form testing
│   └── test-data.json            # Test data for form inputs
├── playwright.config.js          # Playwright configuration
├── package.json                  # Node.js dependencies
├── Dockerfile                    # Docker configuration for tests
└── docker-compose.yml           # Docker Compose for orchestration
```

### Docker Setup Files

**Dockerfile** (recommended):
```dockerfile
FROM mcr.microsoft.com/playwright:latest
WORKDIR /tests
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npx", "playwright", "test"]
```

**docker-compose.yml** (for complex setups):
```yaml
version: '3.8'
services:
  tests:
    build: .
    volumes:
      - ./test-results:/tests/test-results
      - ./playwright-report:/tests/playwright-report
    environment:
      - CI=true
```

### Key Testing Patterns

1. **Form Element Selection**: Use data attributes or stable CSS selectors for Elementor form fields. Elementor typically uses classes like `.elementor-field` for inputs.

2. **Test Data Management**: Store test data in `test-data.json` including:
   - Valid form inputs
   - Invalid inputs for validation testing
   - Expected success/error messages

3. **Page Object Model** (if implemented): Consider creating page objects for reusable form interactions.

## Elementor Forms Testing Context

### Form Field Selectors
Elementor forms typically use these patterns:
- Input fields: `.elementor-field` or `input[name="form_fields[name]"]`
- Submit button: `.elementor-button` or `button[type="submit"]`
- Success message: `.elementor-message-success`
- Error messages: `.elementor-message-danger` or `.elementor-field-required`

### Test Scenarios to Implement
1. **Basic submission**: Fill all fields with valid data and verify success
2. **Required field validation**: Submit with empty required fields
3. **Email validation**: Test invalid email formats
4. **Form reset**: Verify form clears after successful submission

## Configuration Notes

When setting up `playwright.config.js`, consider:
- Set appropriate timeouts for form submissions (network delays)
- Configure viewport for desktop and mobile testing
- Set up retry logic for flaky tests
- Define base URL if testing single site
- Use `CI` environment variable to detect containerized environments
- Configure screenshot/video capture for debugging in containers

### Benefits of Container-Based Testing
- **Consistency**: Same environment across all machines and CI/CD
- **Isolation**: No browser dependencies on host machine
- **Parallel execution**: Easy to scale with container orchestration
- **CI/CD ready**: Works seamlessly in GitHub Actions, GitLab CI, etc.

## Test Implementation Guidelines

- Always wait for form elements to be visible before interaction
- Use `page.waitForSelector()` for success/error messages after submission
- Include cleanup in test teardown (clear cookies/storage if needed)
- Use descriptive test names that explain the scenario being tested

## Primary Implementation Plan

**Follow the simplified-implementation-plan.md** - This is the primary approach focusing on:
- Basic functional testing only (form works/doesn't work)
- Simple daily CI/CD runs
- Basic email/Slack alerting
- No complex monitoring or advanced features

## Agent-First Approach

### ALWAYS USE AGENTS FIRST
Before doing any work directly, always try using the available agents:

### Available Agents
- **wordpress-elementor-specialist**: Form discovery and test scenario generation
- **playwright-form-tester**: Simple test implementation and execution
- **devops-test-infrastructure**: Basic CI/CD setup and alerting

### Agent Selection Decision Tree
1. **Form analysis needed?** → Use `wordpress-elementor-specialist`
2. **Need test code written?** → Use `playwright-form-tester`
3. **Need CI/CD or Docker setup?** → Use `devops-test-infrastructure`
4. **General debugging/fixes?** → Use most relevant agent first, then escalate

### Agent Coordination Protocol
1. **Phase 1**: wordpress-elementor-specialist (form discovery - 30 min)
2. **Phase 2**: playwright-form-tester (test implementation - 45 min)
3. **Phase 3**: devops-test-infrastructure (CI/CD setup - 30 min)

### When NOT to Use Agents
Only work directly when:
- Agents have failed and you're debugging agent outputs
- Making minor configuration changes to existing agent-generated code
- Updating documentation based on agent work

## Error Handling & Learning

### When Things Go Wrong
1. **First**: Try using the appropriate agent to fix the issue
2. **Document the issue** in `lessons-learned.md`
3. **Update agent instructions** if the same issue repeats
4. **Commit learnings** to the GitHub repository for future reference

### Project Structure
- **Customer-based organization**: `customers/{customer-name}/`
- **Shared resources**: `/tests/shared/` and `/tests/utils/`
- **Documentation**: `/docs/` directory
- **Agent configurations**: `/.claude/agents/`
- See `docs/directory-structure.md` for complete structure

### GitHub Repository Management
- **Always commit agent outputs** to preserve work
- **Update lessons-learned.md** when issues are resolved
- **Tag releases** when major functionality is added
- **Use issues** to track recurring problems and improvements