#!/usr/bin/env node

/**
 * JBIT Form Testing Status Checker
 * Simple script to check test status and generate basic reports
 */

const fs = require('fs');
const path = require('path');

const CUSTOMER = 'jbit';
const REPORTS_DIR = path.join('customers', CUSTOMER, 'reports');
const RESULTS_FILE = path.join(REPORTS_DIR, 'test-results.json');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(title) {
  console.log('\n' + colorize('='.repeat(60), 'blue'));
  console.log(colorize(`  ${title}`, 'blue'));
  console.log(colorize('='.repeat(60), 'blue'));
}

function printSection(title) {
  console.log('\n' + colorize(`📊 ${title}`, 'cyan'));
  console.log(colorize('-'.repeat(40), 'cyan'));
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' UTC';
}

function formatDuration(ms) {
  if (!ms) return 'Unknown';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

function getStatusIcon(status) {
  switch (status.toLowerCase()) {
    case 'passed':
    case 'success':
      return '✅';
    case 'failed':
    case 'failure':
      return '❌';
    case 'timedout':
      return '⏰';
    case 'skipped':
      return '⏭️';
    default:
      return '❓';
  }
}

function checkTestStatus() {
  printHeader('JBIT Form Testing Status Check');

  // Check if results file exists
  if (!fs.existsSync(RESULTS_FILE)) {
    console.log(colorize('❌ No test results found!', 'red'));
    console.log(`   Expected file: ${RESULTS_FILE}`);
    console.log('   Run tests first: npm run test:smoke');
    return false;
  }

  try {
    const rawData = fs.readFileSync(RESULTS_FILE, 'utf8');
    const results = JSON.parse(rawData);

    // Basic information
    printSection('Basic Information');
    console.log(`Customer: ${colorize(CUSTOMER.toUpperCase(), 'magenta')}`);
    console.log(`Test Date: ${formatDate(results.config?.metadata?.actualWorkers?.[0]?.workerInfo?.testRunStarted)}`);
    console.log(`Results File: ${RESULTS_FILE}`);

    // Test Statistics
    printSection('Test Statistics');
    const stats = results.stats || {};
    const total = (stats.expected || 0) + (stats.unexpected || 0) + (stats.skipped || 0) + (stats.flaky || 0);

    console.log(`Total Tests: ${colorize(total, 'white')}`);
    console.log(`${getStatusIcon('passed')} Passed: ${colorize(stats.expected || 0, 'green')}`);
    console.log(`${getStatusIcon('failed')} Failed: ${colorize(stats.unexpected || 0, 'red')}`);
    console.log(`${getStatusIcon('skipped')} Skipped: ${colorize(stats.skipped || 0, 'yellow')}`);
    console.log(`🔄 Flaky: ${colorize(stats.flaky || 0, 'magenta')}`);

    // Success Rate
    const successRate = total > 0 ? ((stats.expected || 0) / total * 100).toFixed(1) : 0;
    const rateColor = successRate == 100 ? 'green' : successRate >= 80 ? 'yellow' : 'red';
    console.log(`Success Rate: ${colorize(successRate + '%', rateColor)}`);

    // Duration
    printSection('Execution Time');
    const duration = results.config?.metadata?.totalTime || 0;
    console.log(`Total Duration: ${colorize(formatDuration(duration), 'white')}`);

    // Browser Results
    if (results.suites && results.suites.length > 0) {
      printSection('Browser Results');

      const browserResults = {};

      // Process test results by project (browser)
      results.suites.forEach(suite => {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            test.results.forEach(result => {
              const projectName = result.workerIndex !== undefined ?
                results.config.projects?.[result.workerIndex]?.name || 'unknown' : 'unknown';

              if (!browserResults[projectName]) {
                browserResults[projectName] = {
                  passed: 0,
                  failed: 0,
                  skipped: 0,
                  duration: 0
                };
              }

              switch (result.status) {
                case 'passed':
                  browserResults[projectName].passed++;
                  break;
                case 'failed':
                case 'timedOut':
                  browserResults[projectName].failed++;
                  break;
                case 'skipped':
                  browserResults[projectName].skipped++;
                  break;
              }

              browserResults[projectName].duration += result.duration || 0;
            });
          });
        });
      });

      // Display browser results
      Object.entries(browserResults).forEach(([browser, stats]) => {
        const total = stats.passed + stats.failed + stats.skipped;
        const success = total > 0 ? (stats.passed / total * 100).toFixed(1) : 0;
        const statusColor = success == 100 ? 'green' : success >= 80 ? 'yellow' : 'red';

        console.log(`\n🌐 ${browser.toUpperCase()}:`);
        console.log(`   ${getStatusIcon('passed')} Passed: ${stats.passed}`);
        console.log(`   ${getStatusIcon('failed')} Failed: ${stats.failed}`);
        console.log(`   Success: ${colorize(success + '%', statusColor)}`);
        console.log(`   Duration: ${formatDuration(stats.duration)}`);
      });
    }

    // Recent Failures
    if (stats.unexpected > 0) {
      printSection('Recent Failures');

      const failures = [];
      results.suites.forEach(suite => {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            test.results.forEach(result => {
              if (result.status === 'failed' || result.status === 'timedOut') {
                failures.push({
                  title: test.title,
                  file: spec.title,
                  error: result.error?.message || 'Unknown error',
                  duration: result.duration
                });
              }
            });
          });
        });
      });

      failures.slice(0, 5).forEach((failure, index) => {
        console.log(`\n${index + 1}. ${colorize(failure.title, 'red')}`);
        console.log(`   File: ${failure.file}`);
        console.log(`   Error: ${failure.error.substring(0, 100)}...`);
        console.log(`   Duration: ${formatDuration(failure.duration)}`);
      });

      if (failures.length > 5) {
        console.log(`\n   ... and ${failures.length - 5} more failures`);
      }
    }

    // Recommendations
    printSection('Recommendations');

    if (stats.unexpected === 0) {
      console.log(colorize('✅ All tests are passing! Great job!', 'green'));
    } else if (stats.unexpected > 0) {
      console.log(colorize('❌ Some tests are failing. Please investigate:', 'red'));
      console.log('   - Check the HTML report for detailed failure information');
      console.log('   - Review recent changes that might have caused failures');
      console.log('   - Verify the target website is accessible');
    }

    if (duration > 300000) { // 5 minutes
      console.log(colorize('⚠️  Tests are taking longer than expected:', 'yellow'));
      console.log('   - Consider optimizing test selectors');
      console.log('   - Check for unnecessary waits');
      console.log('   - Review network conditions');
    }

    // Files and Reports
    printSection('Available Reports');

    const htmlReportPath = path.join(REPORTS_DIR, 'html-report', 'index.html');
    if (fs.existsSync(htmlReportPath)) {
      console.log(`📋 HTML Report: ${htmlReportPath}`);
    }

    const artifactsPath = path.join(REPORTS_DIR, 'test-artifacts');
    if (fs.existsSync(artifactsPath)) {
      const artifactCount = fs.readdirSync(artifactsPath).length;
      console.log(`📁 Test Artifacts: ${artifactCount} files in ${artifactsPath}`);
    }

    console.log('\n' + colorize('Status check completed!', 'green'));
    return stats.unexpected === 0; // Return true if all tests passed

  } catch (error) {
    console.error(colorize(`❌ Error reading test results: ${error.message}`, 'red'));
    return false;
  }
}

// Run the status check
if (require.main === module) {
  const success = checkTestStatus();
  process.exit(success ? 0 : 1);
}

module.exports = { checkTestStatus };