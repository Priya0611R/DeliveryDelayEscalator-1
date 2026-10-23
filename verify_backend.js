const http = require("http");

async function runVerification() {
  console.log("=== STARTING BACKEND VERIFICATION SUITE ===");

  const fetchJson = async (url, options = {}) => {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  };

  const BASE = "http://127.0.0.1:3000";

  // 1. Health check
  const health = await fetchJson(`${BASE}/api/health`);
  console.log(`[1] Health Check: Status ${health.status}, OK: ${health.data.ok}`);

  // 2. Dashboard Stats
  const stats = await fetchJson(`${BASE}/api/dashboard/stats`);
  console.log(`[2] Dashboard Stats: Status ${stats.status}, Total Analyzed: ${stats.data.totalAnalyzed}, Pending: ${stats.data.pendingApprovals}`);

  // 3. TC1 Analyze DEMO-1001 (Promise Missed)
  const tc1 = await fetchJson(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: "DEMO-1001", promisedDate: "2026-10-18" })
  });
  console.log(`[3] Analyze DEMO-1001: Status ${tc1.status}, Scenario: ${tc1.data.scenario}, Decision: ${tc1.data.status}`);
  if (tc1.data.scenario !== "DELIVERY_DELAY") throw new Error("TC1 failed scenario expectation");

  // 4. TC2 Analyze DEMO-1002 (Disputed Receipt)
  const tc2 = await fetchJson(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: "DEMO-1002", receiptDisputed: true })
  });
  console.log(`[4] Analyze DEMO-1002: Status ${tc2.status}, Scenario: ${tc2.data.scenario}, Status: ${tc2.data.status}`);
  if (tc2.data.scenario !== "DELIVERY_DISPUTED") throw new Error("TC2 failed scenario expectation");

  // 5. TC3 Analyze DEMO-1003 (Deduplication)
  const tc3 = await fetchJson(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: "DEMO-1003" })
  });
  console.log(`[5] Analyze DEMO-1003: Status ${tc3.status}, Duplicates Removed: ${tc3.data.evidence.duplicateEventsRemoved}`);
  if (tc3.data.evidence.duplicateEventsRemoved !== 1) throw new Error("TC3 failed duplicate removal expectation");

  // 6. History single run retrieval (Bug A fix test)
  const runId = tc1.data.runId;
  const historyItem = await fetchJson(`${BASE}/api/history/${runId}`);
  console.log(`[6] History Get :runId: Status ${historyItem.status}, RunId: ${historyItem.data.run_id}, Ev parsed: ${typeof historyItem.data.evidence === 'object'}`);
  if (!historyItem.data.evidence || !historyItem.data.result) throw new Error("Bug A regression: evidence or result missing from parsed history");

  // 7. Non-existent run ID (404 test)
  const notFound = await fetchJson(`${BASE}/api/history/RUN-DOES-NOT-EXIST-9999`);
  console.log(`[7] Non-existent Run ID: Status ${notFound.status} (Expected 404), Message: ${notFound.data.error}`);
  if (notFound.status !== 404) throw new Error("Expected 404 for unknown run ID");

  // 8. Invalid order input test (400 validation error)
  const invalid = await fetchJson(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: "" })
  });
  console.log(`[8] Invalid Input: Status ${invalid.status} (Expected 400), Message: ${invalid.data.error}`);
  if (invalid.status !== 400) throw new Error("Expected 400 for empty orderId");

  // 9. Test Runner API (TC1, TC2, TC3, TC4 and Decision Engine Tests)
  const testSuite = await fetchJson(`${BASE}/api/tests/run`, { method: "POST" });
  console.log(`[9] Test Runner Suite: Status ${testSuite.status}, All OK: ${testSuite.data.ok}, Passed: ${testSuite.data.passed}/${testSuite.data.total}`);
  testSuite.data.results.forEach(r => console.log(`    - ${r.testName}: ${r.passed ? 'PASS' : 'FAIL'} (${r.durationMs}ms)`));
  if (!testSuite.data.ok) throw new Error("Test runner reported failed tests");

  // 10. Audit Trail
  const audit = await fetchJson(`${BASE}/api/audit`);
  console.log(`[10] Source Audit: Status ${audit.status}, Audits count: ${audit.data.count}, Sample Hash: ${audit.data.audits[0]?.contentHash?.slice(0, 16)}...`);

  // 11. Proposals and Approval Workflow
  const proposals = await fetchJson(`${BASE}/api/proposals?status=PENDING_APPROVAL`);
  console.log(`[11] Pending Proposals: Status ${proposals.status}, Count: ${proposals.data.count}`);

  if (proposals.data.count > 0) {
    const propToApprove = proposals.data.proposals[0];
    console.log(`    Attempting approval of proposal ${propToApprove.proposal_id}...`);
    const approveRes = await fetchJson(`${BASE}/api/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId: propToApprove.proposal_id, approved: true })
    });
    console.log(`    Approval response: Status ${approveRes.status}, Result status: ${approveRes.data.status}, Ticket: ${approveRes.data.ticket?.ticketId || approveRes.data.ticket?.ticket_id}`);

    // Idempotency check: approve again
    const approveAgain = await fetchJson(`${BASE}/api/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId: propToApprove.proposal_id, approved: true })
    });
    console.log(`    Idempotent re-approval: Status ${approveAgain.status}, Result status: ${approveAgain.data.status} (Expected ALREADY_PROCESSED)`);
    if (approveAgain.data.status !== "ALREADY_PROCESSED") throw new Error("Approval idempotency failed");
  }

  // 12. Tickets list
  const tickets = await fetchJson(`${BASE}/api/tickets`);
  console.log(`[12] Tickets List: Status ${tickets.status}, Tickets count: ${tickets.data.count}`);

  console.log("=== ALL BACKEND VERIFICATIONS COMPLETED SUCCESSFULLY ===");
}

runVerification().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
