#!/bin/bash

# JBIT Form Testing Docker Runner Script
# This script simplifies running tests in Docker containers

set -e  # Exit on any error

# Configuration
CUSTOMER="jbit"
DEFAULT_TEST_TYPE="smoke"
DEFAULT_BROWSER="chromium"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "JBIT Form Testing Docker Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --test-type TYPE    Test type to run (smoke|full) [default: smoke]"
    echo "  -b, --browser BROWSER   Browser to test (chromium|firefox|webkit|all) [default: chromium]"
    echo "  -c, --cleanup           Clean up containers and images after run"
    echo "  -r, --reports           Start report server after tests"
    echo "  -v, --verbose           Enable verbose output"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run smoke tests in chromium"
    echo "  $0 -t full -b all                    # Run full tests in all browsers"
    echo "  $0 -t smoke -b firefox -r            # Run smoke tests in Firefox and start report server"
    echo "  $0 --cleanup                         # Run tests and clean up after"
}

# Parse command line arguments
TEST_TYPE="$DEFAULT_TEST_TYPE"
BROWSER="$DEFAULT_BROWSER"
CLEANUP=false
REPORTS=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--test-type)
            TEST_TYPE="$2"
            shift 2
            ;;
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -c|--cleanup)
            CLEANUP=true
            shift
            ;;
        -r|--reports)
            REPORTS=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate test type
if [[ "$TEST_TYPE" != "smoke" && "$TEST_TYPE" != "full" ]]; then
    print_error "Invalid test type: $TEST_TYPE. Must be 'smoke' or 'full'"
    exit 1
fi

# Validate browser
if [[ "$BROWSER" != "chromium" && "$BROWSER" != "firefox" && "$BROWSER" != "webkit" && "$BROWSER" != "all" ]]; then
    print_error "Invalid browser: $BROWSER. Must be 'chromium', 'firefox', 'webkit', or 'all'"
    exit 1
fi

print_status "Starting JBIT Form Testing Docker Runner"
print_status "Customer: $CUSTOMER"
print_status "Test Type: $TEST_TYPE"
print_status "Browser: $BROWSER"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
print_status "Creating report directories..."
mkdir -p customers/jbit/reports/html-report
mkdir -p test-results

# Build the Docker image
print_status "Building Docker image..."
if [ "$VERBOSE" = true ]; then
    docker build -t jbit-form-tester .
else
    docker build -t jbit-form-tester . > /dev/null 2>&1
fi

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Function to run tests for a specific browser
run_tests_for_browser() {
    local browser_name=$1
    print_status "Running $TEST_TYPE tests for $browser_name..."

    local container_name="jbit-tests-$browser_name-$(date +%s)"

    if [ "$TEST_TYPE" = "smoke" ]; then
        local test_command="npx playwright test customers/jbit/tests/simple-smoke-test.spec.js --project=$browser_name"
    else
        local test_command="npx playwright test customers/jbit/tests/ --project=$browser_name"
    fi

    # Run the container
    local docker_cmd="docker run --rm --name $container_name \
        -e CUSTOMER=$CUSTOMER \
        -e CI=true \
        -v $(pwd)/customers/jbit/reports:/app/customers/jbit/reports \
        -v $(pwd)/test-results:/app/test-results \
        jbit-form-tester $test_command"

    if [ "$VERBOSE" = true ]; then
        print_status "Running: $docker_cmd"
        eval $docker_cmd
    else
        eval $docker_cmd > /dev/null 2>&1
    fi

    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        print_success "Tests passed for $browser_name"
        return 0
    else
        print_error "Tests failed for $browser_name (exit code: $exit_code)"
        return $exit_code
    fi
}

# Run tests
if [ "$BROWSER" = "all" ]; then
    print_status "Running tests for all browsers..."

    overall_result=0
    for browser in chromium firefox webkit; do
        run_tests_for_browser $browser
        if [ $? -ne 0 ]; then
            overall_result=1
        fi
        echo ""
    done

    if [ $overall_result -eq 0 ]; then
        print_success "All browser tests completed successfully!"
    else
        print_error "Some browser tests failed!"
    fi
else
    run_tests_for_browser $BROWSER
    overall_result=$?
fi

# Start report server if requested
if [ "$REPORTS" = true ]; then
    print_status "Starting report server..."

    # Stop any existing report server
    docker-compose -f docker-compose.yml --profile reports stop report-server > /dev/null 2>&1 || true

    # Start report server
    docker-compose -f docker-compose.yml --profile reports up -d report-server

    if [ $? -eq 0 ]; then
        print_success "Report server started at http://localhost:8080"
        print_status "Press Ctrl+C to stop the server"

        # Wait for interrupt
        trap 'docker-compose -f docker-compose.yml --profile reports stop report-server; exit 0' INT

        # Keep the script running
        while true; do
            sleep 1
        done
    else
        print_error "Failed to start report server"
    fi
fi

# Cleanup if requested
if [ "$CLEANUP" = true ]; then
    print_status "Cleaning up Docker containers and images..."

    # Stop and remove containers
    docker ps -a | grep jbit-tests | awk '{print $1}' | xargs -r docker rm -f > /dev/null 2>&1 || true

    # Remove the built image
    docker rmi jbit-form-tester > /dev/null 2>&1 || true

    print_success "Cleanup completed"
fi

print_status "Test run completed with exit code: $overall_result"
exit $overall_result