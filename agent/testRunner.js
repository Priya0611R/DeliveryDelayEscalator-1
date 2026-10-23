
const { decideDeliveryStatus } = require("./decisionEngine");

const retrievedAt = "2026-10-19T12:00:00Z";

const tests = [
  {
    name: "TC1 - Promise missed",
    input: {
      promisedDate: "2026-10-15",
      retrievedAt,
      events: [
        {
          eventId: "EV-1",
          status: "In Transit",
          time: "2026-10-17T12:00:00Z"
        }
      ]
    },
    expected: "DELAY_CONFIRMED"
  },
  {
    name: "TC2 - Delivered but not received",
    input: {
      promisedDate: "2026-10-18",
      retrievedAt,
      receiptDisputed: true,
      events: [
        {
          eventId: "EV-2",
          status: "Delivered",
          time: "2026-10-18T14:00:00Z"
        }
      ]
    },
    expected: "DELIVERY_DISPUTED"
  },
  {
    name: "TC3 - Repeated tracking events",
    input: {
      promisedDate: "2026-10-25",
      retrievedAt,
      events: [
        {
          eventId: "EV-3",
          status: "In Transit",
          time: "2026-10-19T10:00:00Z"
        },
        {
          eventId: "EV-3",
          status: "In Transit",
          time: "2026-10-19T10:00:00Z"
        }
      ]
    },
    expected: "ON_TIME",
    expectedUniqueEvents: 1
  },
  {
    name: "TC4 - Missing evidence is not treated as success",
    input: {
      promisedDate: "2026-10-18",
      retrievedAt,
      events: []
    },
    expected: "INSUFFICIENT_EVIDENCE"
  }
];

function runAllTests() {
  const results = [];
  let passed = 0;

  for (const test of tests) {
    const startTime = Date.now();
    const result = decideDeliveryStatus(test.input);
    const durationMs = Date.now() - startTime;

    let success = result.decision === test.expected;

    if (test.expectedUniqueEvents !== undefined) {
      success =
        success &&
        result.events?.length === test.expectedUniqueEvents;
    }

    if (success) passed++;

    results.push({
      name: test.name,
      expected: test.expected,
      actual: result.decision,
      reason: result.reason || null,
      passed: success,
      durationMs,
      details: result
    });
  }

  return {
    total: tests.length,
    passed,
    failed: tests.length - passed,
    results
  };
}

if (require.main === module) {
  const outcome = runAllTests();
  for (const res of outcome.results) {
    console.log(`${res.passed ? "PASS" : "FAIL"}: ${res.name}`);
    console.log(`  Expected: ${res.expected}`);
    console.log(`  Actual:   ${res.actual}`);
    if (res.reason) {
      console.log(`  Reason:   ${res.reason}`);
    }
  }
  console.log(`\nDecision tests: ${outcome.passed}/${outcome.total} passed.`);
  console.log(
    "Note: TC4 here is a temporary missing-evidence unit test, not the official ticket-creation test."
  );

  if (outcome.failed > 0) {
    process.exitCode = 1;
  }
}

module.exports = {
  runAllTests,
  tests
};
