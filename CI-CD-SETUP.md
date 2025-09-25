# JBIT Form Testing CI/CD Setup Guide

This guide covers the basic CI/CD infrastructure setup for automated daily testing of JBIT forms.

## Overview

The CI/CD infrastructure includes:
- **GitHub Actions**: Daily scheduled testing workflow
- **Docker**: Containerized test execution
- **Basic Alerting**: Email and Slack notifications on failures
- **GitHub Pages**: Automated report deployment
- **Simple Monitoring**: Basic pass/fail status tracking

## Quick Start

### 1. GitHub Actions Setup

The workflow is automatically configured in `.github/workflows/jbit-tests.yml`. It will:
- Run daily at 6 AM UTC
- Execute smoke tests across all browsers (Chromium, Firefox, WebKit)
- Generate and deploy HTML reports to GitHub Pages
- Send notifications on failures

### 2. Docker Setup

**⚠️ Docker Installation Required**

Before running Docker-based tests, ensure Docker Desktop is installed:

**macOS Installation:**
```bash
# Option 1: Download from https://docker.com/products/docker-desktop
# Option 2: Using Homebrew (requires admin rights)
brew install --cask docker

# Start Docker Desktop application
open -a Docker
```

**Verify Installation:**
```bash
# Check Docker is running
docker --version
docker-compose --version

# Test Docker connectivity
docker info
```

#### Local Testing
```bash
# Build and run smoke tests
./scripts/run-docker-tests.sh

# Run full tests on all browsers
./scripts/run-docker-tests.sh -t full -b all

# Run tests with report server
./scripts/run-docker-tests.sh -r

# Run with cleanup
./scripts/run-docker-tests.sh -c
```

#### Docker Compose
```bash
# Run tests with docker-compose
docker-compose up jbit-form-tests

# Run tests with report server
docker-compose --profile reports up

# Clean shutdown
docker-compose down
```

## Configuration

### GitHub Secrets and Variables

#### Required Secrets (for notifications):
```
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-app-password
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook
```

#### Required Variables:
```
NOTIFICATION_EMAIL=alerts@jbit.com
FROM_EMAIL=noreply@jbit.com
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

#### Optional Variables:
```
SLACK_CHANNEL=#jbit-alerts
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/url
```

### Email Configuration

1. **Gmail Setup** (recommended):
   - Enable 2FA on your Gmail account
   - Generate an App Password
   - Set `SMTP_USERNAME` to your Gmail address
   - Set `SMTP_PASSWORD` to the App Password

2. **Other SMTP Providers**:
   - Update `SMTP_SERVER` and `SMTP_PORT` variables
   - Configure authentication in secrets

### Slack Configuration

1. Create a Slack App in your workspace
2. Add Incoming Webhooks feature
3. Copy the webhook URL to `SLACK_WEBHOOK_URL` secret
4. Optionally set `SLACK_CHANNEL` variable for specific channel targeting

### GitHub Pages Setup

1. Go to repository Settings → Pages
2. Select "GitHub Actions" as source
3. The workflow will automatically deploy reports after each run
4. Reports will be available at: `https://yourusername.github.io/yourrepo/`

## Workflow Triggers

### Automatic Triggers:
- **Daily Schedule**: 6 AM UTC every day
- **Push to main**: On commits to main branch
- **Pull Requests**: On PR creation/updates

### Manual Triggers:
- **Workflow Dispatch**: Manual trigger with options
  - Test Type: smoke (default) or full
  - Browser: specific browser or all

## Test Execution Strategy

### Browser Matrix:
- **Chromium**: Desktop Chrome simulation
- **Firefox**: Desktop Firefox simulation
- **WebKit**: Desktop Safari simulation

### Test Types:
- **Smoke Tests**: Basic form functionality (`simple-smoke-test.spec.js`)
- **Full Tests**: Complete test suite (all files in `customers/jbit/tests/`)

### Parallel Execution:
- Tests run in parallel across browsers
- Each browser gets its own job for faster execution
- Failure in one browser doesn't stop others

## Alerting and Notifications

### Email Notifications:
- **Trigger**: Test failures on scheduled or manual runs
- **Content**: Test summary, failure details, links to reports
- **Recipients**: Configured in `NOTIFICATION_EMAIL` variable

### Slack Notifications:
- **Trigger**: Test failures with formatted messages
- **Content**: Rich formatting with test status and links
- **Channels**: Configurable via variables

### Notification Rules:
- **Scheduled Runs**: Always notify on failure
- **Manual Runs**: Notify on failure
- **Push/PR**: Notify only on critical failures (all browsers fail)

## Reports and Artifacts

### HTML Reports:
- **Location**: `customers/jbit/reports/html-report/`
- **Deployment**: Automatic to GitHub Pages
- **Retention**: 7 days in GitHub Actions, permanent on Pages
- **Content**: Detailed test results with screenshots and traces

### Test Artifacts:
- **Screenshots**: Captured on test failures
- **Videos**: Recorded for failed tests
- **Traces**: Full execution traces for debugging
- **JSON Results**: Machine-readable test results

### Local Report Server:
```bash
# Start local report server on port 8080
./scripts/run-docker-tests.sh -r

# Or with docker-compose
docker-compose --profile reports up report-server
```

## Maintenance

### Regular Tasks:

#### Weekly:
- Review test results and failure patterns
- Update dependencies if needed
- Check artifact storage usage

#### Monthly:
- Review and rotate secrets
- Update browser versions
- Analyze test performance metrics

### Monitoring:
- **GitHub Actions**: Monitor workflow runs
- **Email**: Check for delivery issues
- **Reports**: Ensure GitHub Pages deployment
- **Performance**: Watch for execution time increases

### Troubleshooting:

#### Common Issues:

1. **Tests Failing Unexpectedly**:
   - Check recent commits for breaking changes
   - Verify target website availability
   - Review reCAPTCHA bypass configuration

2. **Notifications Not Working**:
   - Verify secrets are set correctly
   - Check SMTP credentials and permissions
   - Test webhook URLs manually

3. **Reports Not Deploying**:
   - Ensure GitHub Pages is enabled
   - Check workflow permissions
   - Verify artifact generation

4. **Docker Issues**:
   - Update base image versions
   - Check resource constraints
   - Verify volume mounts

### Scaling Considerations:

#### Adding More Customers:
- Duplicate workflow for new customer
- Update customer-specific configurations
- Modify Docker setup for multi-customer support

#### Adding More Tests:
- Update test execution timeout
- Consider resource allocation
- Monitor artifact storage growth

## Security Considerations

### Secrets Management:
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Never commit credentials to repository

### Container Security:
- Regular base image updates
- Non-root user execution
- Resource limits and isolation

### Access Control:
- Limit workflow permissions
- Secure report server if publicly accessible
- Monitor access logs

## Performance Optimization

### Current Settings:
- **Workers**: 1 (CI environment)
- **Retries**: 2 attempts on failure
- **Timeouts**: 60s test, 30s navigation
- **Parallel**: Browser-level parallelization

### Optimization Tips:
- Monitor execution times
- Adjust worker count based on runner capacity
- Use test sharding for large test suites
- Implement smart test selection

## Cost Management

### GitHub Actions:
- Current usage: ~30 minutes/day for smoke tests
- Optimization: Use matrix strategy efficiently
- Monitor: Monthly usage in billing dashboard

### Artifact Storage:
- Retention: 7 days for artifacts
- Cleanup: Automatic via GitHub policies
- Monitoring: Storage usage in repository insights

## Support and Escalation

### Contact Information:
- **Development Team**: dev-team@jbit.com
- **QA Team**: qa-team@jbit.com
- **DevOps Support**: devops@jbit.com

### Escalation Process:
1. **Level 1**: Automated notifications via email/Slack
2. **Level 2**: Manual investigation by development team
3. **Level 3**: DevOps team involvement for infrastructure issues

### Documentation:
- **Repository**: All configuration files and documentation
- **Wiki**: Extended troubleshooting guides
- **Issues**: Track problems and solutions

---

## File Structure

```
├── .github/workflows/jbit-tests.yml    # Main CI/CD workflow
├── Dockerfile                          # Container definition
├── docker-compose.yml                  # Container orchestration
├── config/
│   ├── nginx.conf                      # Report server configuration
│   └── alerting-config.yml             # Alerting templates
├── scripts/
│   └── run-docker-tests.sh             # Local Docker runner
├── .env.ci                             # CI environment variables
└── CI-CD-SETUP.md                      # This documentation
```

This setup provides a solid foundation for automated form testing with basic alerting and reporting capabilities.