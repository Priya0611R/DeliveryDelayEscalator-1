/**
 * Delivery Delay Escalator — Client Application
 * Enterprise Logistics Intelligence Dashboard
 */

document.addEventListener("DOMContentLoaded", () => {
  // --------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------
  const state = {
    currentPage: "dashboard",
    currentAnalysisRun: null,
    pendingAction: null, // { action: 'approve' | 'reject', proposalId: string }
    presets: {
      "DEMO-1001": {
        orderId: "DEMO-1001",
        promisedDate: "2026-10-18",
        dispute: false,
        desc: "TC1: Promise date missed (2026-10-18). Order delayed at regional hub."
      },
      "DEMO-1002": {
        orderId: "DEMO-1002",
        promisedDate: "2026-10-19",
        dispute: true,
        desc: "TC2: Carrier marked delivered, but recipient disputes receipt."
      },
      "DEMO-1003": {
        orderId: "DEMO-1003",
        promisedDate: "2026-10-25",
        dispute: false,
        desc: "TC3: Contains repeated duplicate tracking events. Promise is on time."
      },
      "DEMO-1004": {
        orderId: "DEMO-1004",
        promisedDate: "2026-10-15",
        dispute: false,
        desc: "TC4: Severe delivery delay (promised 2026-10-15). Immediate ticket proposal for human approval."
      }
    }
  };

  // --------------------------------------------------
  // DOM ELEMENT REFERENCES
  // --------------------------------------------------
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const pageTitle = document.getElementById("pageTitle");
  const pageBreadcrumb = document.getElementById("pageBreadcrumb");
  const navItems = document.querySelectorAll(".sidebar-nav .nav-item");
  const pageSections = document.querySelectorAll(".page-section");
  const toastContainer = document.getElementById("toastContainer");

  // Dashboard Stats Elements
  const statTotalAnalyzed = document.getElementById("stat-total-analyzed");
  const statTotalRuns = document.getElementById("stat-total-runs");
  const statConfirmedDelays = document.getElementById("stat-confirmed-delays");
  const statDiscrepancies = document.getElementById("stat-discrepancies");
  const statPendingApprovals = document.getElementById("stat-pending-approvals");
  const statTicketsCreated = document.getElementById("stat-tickets-created");
  const sidebarApprovalsCount = document.getElementById("sidebar-approvals-count");
  const dashboardRecentTbody = document.getElementById("dashboard-recent-tbody");
  const dashboardTicketsTbody = document.getElementById("dashboard-tickets-tbody");

  // Analysis Form Elements
  const analysisForm = document.getElementById("analysisForm");
  const inputScenarioPreset = document.getElementById("inputScenarioPreset");
  const inputOrderId = document.getElementById("inputOrderId");
  const inputPromisedDate = document.getElementById("inputPromisedDate");
  const inputDisputeReceipt = document.getElementById("inputDisputeReceipt");
  const presetDescription = document.getElementById("presetDescription");
  const btnAnalyzeSubmit = document.getElementById("btnAnalyzeSubmit");
  const btnResetForm = document.getElementById("btnResetForm");
  const workflowStepper = document.getElementById("workflowStepper");
  const workflowOverallStatus = document.getElementById("workflowOverallStatus");
  const analysisResultCard = document.getElementById("analysisResultCard");

  // Analysis Results Elements
  const resultDecisionBanner = document.getElementById("resultDecisionBanner");
  const resultDecisionIcon = document.getElementById("resultDecisionIcon");
  const resultDecisionTitle = document.getElementById("resultDecisionTitle");
  const resultDecisionReason = document.getElementById("resultDecisionReason");
  const resultRecommendation = document.getElementById("resultRecommendation");
  const resultBadgesGroup = document.getElementById("resultBadgesGroup");
  const resOrderId = document.getElementById("res-order-id");
  const resPromisedDate = document.getElementById("res-promised-date");
  const resLatestStatus = document.getElementById("res-latest-status");
  const resDuplicatesRemoved = document.getElementById("res-duplicates-removed");
  const resRunId = document.getElementById("res-run-id");
  const resRetrievedAt = document.getElementById("res-retrieved-at");
  const resultTimeline = document.getElementById("resultTimeline");
  const resultApprovalGateway = document.getElementById("resultApprovalGateway");

  // Approvals View Elements
  const filterApprovalStatus = document.getElementById("filterApprovalStatus");
  const btnRefreshApprovals = document.getElementById("btnRefreshApprovals");
  const proposalsContainer = document.getElementById("proposalsContainer");

  // Tickets View Elements
  const ticketsTbody = document.getElementById("ticketsTbody");
  const btnRefreshTickets = document.getElementById("btnRefreshTickets");

  // Audit View Elements
  const auditTbody = document.getElementById("auditTbody");
  const btnRefreshAudit = document.getElementById("btnRefreshAudit");

  // History View Elements
  const historySearchInput = document.getElementById("historySearchInput");
  const historyScenarioFilter = document.getElementById("historyScenarioFilter");
  const btnSearchHistory = document.getElementById("btnSearchHistory");
  const historyTbody = document.getElementById("historyTbody");

  // Diagnostics View Elements
  const btnExecuteDiagnostics = document.getElementById("btnExecuteDiagnostics");
  const diagTotal = document.getElementById("diag-total");
  const diagPassed = document.getElementById("diag-passed");
  const diagFailed = document.getElementById("diag-failed");
  const diagTimestamp = document.getElementById("diag-timestamp");
  const diagnosticsTbody = document.getElementById("diagnosticsTbody");

  // Modals
  const runDetailModal = document.getElementById("runDetailModal");
  const btnCloseRunModal = document.getElementById("btnCloseRunModal");
  const btnCloseRunModalBottom = document.getElementById("btnCloseRunModalBottom");
  const modalRunTitle = document.getElementById("modalRunTitle");
  const modalRunSubtitle = document.getElementById("modalRunSubtitle");
  const modalOverviewContent = document.getElementById("modalOverviewContent");
  const modalEvidenceJson = document.getElementById("modalEvidenceJson");
  const modalResultJson = document.getElementById("modalResultJson");

  const confirmActionModal = document.getElementById("confirmActionModal");
  const confirmModalTitle = document.getElementById("confirmModalTitle");
  const confirmModalMessage = document.getElementById("confirmModalMessage");
  const rejectReasonGroup = document.getElementById("rejectReasonGroup");
  const inputRejectReason = document.getElementById("inputRejectReason");
  const btnCloseConfirmModal = document.getElementById("btnCloseConfirmModal");
  const btnCancelConfirm = document.getElementById("btnCancelConfirm");
  const btnExecuteConfirm = document.getElementById("btnExecuteConfirm");

  // --------------------------------------------------
  // TOAST NOTIFICATIONS
  // --------------------------------------------------
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const text = document.createElement("span");
    text.textContent = message;

    const closeBtn = document.createElement("button");
    closeBtn.className = "toast-close";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => toast.remove();

    toast.appendChild(text);
    toast.appendChild(closeBtn);
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // --------------------------------------------------
  // NAVIGATION ROUTING
  // --------------------------------------------------
  const pageMeta = {
    dashboard: { title: "Operations Dashboard", breadcrumb: "Overview & Real-time Metrics" },
    analyze: { title: "Order Analysis & Evidence", breadcrumb: "Workflow Automation & Pipeline" },
    approvals: { title: "Pending Approvals", breadcrumb: "Human-in-the-Loop Decision Gateway" },
    tickets: { title: "Support Ticket Records", breadcrumb: "Verified Escalation Registry" },
    audit: { title: "Evidence & Cryptographic Audit", breadcrumb: "SHA-256 Hash Verification & Provenance" },
    history: { title: "Analysis History Repository", breadcrumb: "Historical Runs & Audit Trail" },
    diagnostics: { title: "System Tests & Diagnostics", breadcrumb: "Automated Acceptance Criteria" }
  };

  function switchPage(pageId) {
    if (!pageMeta[pageId]) return;

    state.currentPage = pageId;

    navItems.forEach((item) => {
      item.classList.toggle("active", item.getAttribute("data-page") === pageId);
    });

    pageSections.forEach((section) => {
      section.classList.toggle("active", section.id === `view-${pageId}`);
    });

    pageTitle.textContent = pageMeta[pageId].title;
    pageBreadcrumb.textContent = pageMeta[pageId].breadcrumb;

    if (window.innerWidth <= 768) {
      sidebar.classList.remove("open");
    }

    // Trigger page-specific data load
    if (pageId === "dashboard") loadDashboardData();
    if (pageId === "approvals") loadProposals();
    if (pageId === "tickets") loadTickets();
    if (pageId === "audit") loadAuditTrail();
    if (pageId === "history") loadHistory();
    if (pageId === "diagnostics") loadPastTestRuns();
  }

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => switchPage(btn.getAttribute("data-page")));
  });

  document.querySelectorAll("[data-goto]").forEach((el) => {
    el.addEventListener("click", () => switchPage(el.getAttribute("data-goto")));
  });

  document.getElementById("btnStartAnalysisShortcut")?.addEventListener("click", () => switchPage("analyze"));
  document.getElementById("btnRunTestsShortcut")?.addEventListener("click", () => switchPage("diagnostics"));
  document.getElementById("btnQuickRefresh")?.addEventListener("click", () => {
    showToast("Refreshing workspace data...", "info");
    switchPage(state.currentPage);
  });

  sidebarToggle?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // --------------------------------------------------
  // API UTILITY
  // --------------------------------------------------
  async function apiFetch(endpoint, options = {}) {
    try {
      const res = await fetch(endpoint, options);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP error ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  function copyToClipboard(text, label = "Copied to clipboard") {
    navigator.clipboard.writeText(text).then(
      () => showToast(label, "success"),
      () => showToast("Failed to copy to clipboard", "error")
    );
  }

  function formatDate(isoString) {
    if (!isoString) return "-";
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return isoString;
    }
  }

  // --------------------------------------------------
  // 1. DASHBOARD OVERVIEW DATA
  // --------------------------------------------------
  async function loadDashboardData() {
    try {
      const stats = await apiFetch("/api/dashboard/stats");

      statTotalAnalyzed.textContent = stats.totalAnalyzed ?? 0;
      statTotalRuns.textContent = `${stats.totalRuns ?? 0} runs processed`;
      statConfirmedDelays.textContent = stats.confirmedDelays ?? 0;
      statDiscrepancies.textContent = stats.deliveryDiscrepancies ?? 0;
      statPendingApprovals.textContent = stats.pendingApprovals ?? 0;
      statTicketsCreated.textContent = stats.ticketsCreated ?? 0;
      sidebarApprovalsCount.textContent = stats.pendingApprovals ?? 0;
      if (document.getElementById("badgePendingCount")) {
        document.getElementById("badgePendingCount").textContent = stats.pendingApprovals ?? 0;
      }

      // Render Recent Runs Table
      if (!stats.recentRuns || stats.recentRuns.length === 0) {
        dashboardRecentTbody.innerHTML = `<tr><td colspan="6" class="table-empty">No analysis runs recorded yet. Analyze an order to begin.</td></tr>`;
      } else {
        dashboardRecentTbody.innerHTML = stats.recentRuns.map((r) => `
          <tr>
            <td><code>${r.run_id}</code></td>
            <td><strong>${escapeHtml(r.order_id)}</strong></td>
            <td>${renderScenarioBadge(r.scenario)}</td>
            <td>${renderStatusBadge(r.status)}</td>
            <td><small>${formatDate(r.created_at)}</small></td>
            <td>
              <button class="btn btn-outline btn-sm btn-inspect-run" data-run-id="${r.run_id}">Inspect</button>
            </td>
          </tr>
        `).join("");

        dashboardRecentTbody.querySelectorAll(".btn-inspect-run").forEach((b) => {
          b.addEventListener("click", () => inspectRunDetails(b.getAttribute("data-run-id")));
        });
      }

      // Render Recent Tickets Table
      if (!stats.recentTickets || stats.recentTickets.length === 0) {
        dashboardTicketsTbody.innerHTML = `<tr><td colspan="5" class="table-empty">No tickets created yet. Approved proposals will appear here.</td></tr>`;
      } else {
        dashboardTicketsTbody.innerHTML = stats.recentTickets.map((t) => `
          <tr>
            <td><code>${t.ticket_id}</code></td>
            <td><strong>${escapeHtml(t.order_id)}</strong></td>
            <td>${renderScenarioBadge(t.scenario)}</td>
            <td><span class="badge badge-success">${escapeHtml(t.status)}</span></td>
            <td><small>${formatDate(t.created_at)}</small></td>
          </tr>
        `).join("");
      }
    } catch (err) {
      showToast(`Failed to load dashboard metrics: ${err.message}`, "error");
    }
  }

  // --------------------------------------------------
  // 2. ORDER ANALYSIS & STEPPER PIPELINE
  // --------------------------------------------------
  inputScenarioPreset.addEventListener("change", () => {
    const val = inputScenarioPreset.value;
    if (state.presets[val]) {
      const p = state.presets[val];
      inputOrderId.value = p.orderId;
      inputPromisedDate.value = p.promisedDate;
      inputDisputeReceipt.checked = p.dispute;
      presetDescription.textContent = p.desc;
    } else {
      presetDescription.textContent = "Custom order parameters. Provide order ID and promised delivery date.";
    }
  });

  btnResetForm.addEventListener("click", () => {
    inputScenarioPreset.value = "DEMO-1001";
    inputScenarioPreset.dispatchEvent(new Event("change"));
    resetStepper();
    analysisResultCard.classList.add("hidden");
  });

  function resetStepper() {
    workflowOverallStatus.className = "badge";
    workflowOverallStatus.textContent = "Ready";
    for (let i = 1; i <= 7; i++) {
      const step = document.getElementById(`step-${i}`);
      if (step) {
        step.className = "step-item";
        const circle = step.querySelector(".step-circle");
        if (circle) circle.textContent = i;
      }
    }
    if (document.getElementById("step-7-title")) {
      document.getElementById("step-7-title").textContent = "Human Approval Gateway";
      document.getElementById("step-7-desc").textContent = "Awaiting human sign-off before demo ticket creation";
    }
  }

  function setStepState(stepNumber, status) {
    const step = document.getElementById(`step-${stepNumber}`);
    if (!step) return;

    step.className = `step-item ${status}`;
    const circle = step.querySelector(".step-circle");

    if (status === "completed") {
      circle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (status === "active") {
      circle.textContent = stepNumber;
    }
  }

  analysisForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const orderId = inputOrderId.value.trim();
    const promisedDate = inputPromisedDate.value;
    const receiptDisputed = inputDisputeReceipt.checked;

    if (!orderId) {
      showToast("Order ID is required.", "error");
      return;
    }

    // Begin Pipeline
    btnAnalyzeSubmit.disabled = true;
    btnAnalyzeSubmit.innerHTML = `<span class="pulse-dot"></span> <span>Analyzing Evidence...</span>`;
    analysisResultCard.classList.add("hidden");
    resetStepper();

    workflowOverallStatus.className = "badge badge-info";
    workflowOverallStatus.textContent = "In Progress";

    try {
      // Step 1: Input Validation
      setStepState(1, "active");
      await new Promise((r) => setTimeout(r, 120));
      setStepState(1, "completed");

      // Step 2: Evidence Acquisition
      setStepState(2, "active");
      await new Promise((r) => setTimeout(r, 120));

      // Make Real API Request
      const sourceMode = document.getElementById("inputSourceMode")?.value || "simulation";
      const payload = {
        orderId,
        promisedDate,
        receiptDisputed,
        sourceMode
      };

      const response = await apiFetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setStepState(2, "completed");

      // Step 3: Parse & SHA-256 Hash
      setStepState(3, "active");
      await new Promise((r) => setTimeout(r, 100));
      setStepState(3, "completed");

      // Step 4: Deduplication
      setStepState(4, "active");
      await new Promise((r) => setTimeout(r, 100));
      setStepState(4, "completed");

      // Step 5: Decision Engine
      setStepState(5, "active");
      await new Promise((r) => setTimeout(r, 100));
      setStepState(5, "completed");

      // Step 6: Proposal Generation
      setStepState(6, "active");
      await new Promise((r) => setTimeout(r, 100));
      setStepState(6, "completed");

      // Step 7: Human Approval Gateway
      const requiresApproval = response.result?.humanApprovalRequired && 
        (!response.proposal || response.proposal.status === "PENDING_APPROVAL");

      if (requiresApproval) {
        setStepState(7, "active");
        if (document.getElementById("step-7-title")) document.getElementById("step-7-title").textContent = "Human Approval Required";
        if (document.getElementById("step-7-desc")) document.getElementById("step-7-desc").textContent = "Action required: review proposal below";
        workflowOverallStatus.className = "badge badge-warning";
        workflowOverallStatus.textContent = "Awaiting Human Decision";
      } else if (response.proposal?.status === "ALREADY_APPROVED" || response.proposal?.ticketId) {
        setStepState(7, "completed");
        if (document.getElementById("step-7-title")) document.getElementById("step-7-title").textContent = "Ticket Created";
        if (document.getElementById("step-7-desc")) document.getElementById("step-7-desc").textContent = `Ticket ${response.proposal.ticketId || ""} active`;
        workflowOverallStatus.className = "badge badge-info";
        workflowOverallStatus.textContent = "Ticket Active";
      } else {
        setStepState(7, "completed");
        if (document.getElementById("step-7-title")) document.getElementById("step-7-title").textContent = "No Escalation Needed";
        if (document.getElementById("step-7-desc")) document.getElementById("step-7-desc").textContent = "Delivery on schedule";
        workflowOverallStatus.className = "badge badge-success";
        workflowOverallStatus.textContent = "Analysis Complete";
      }

      state.currentAnalysisRun = response;
      renderAnalysisResult(response);
      showToast("Order analysis completed successfully.", "success");

      // Smooth scroll directly to the approval gateway
      setTimeout(() => {
        resultApprovalGateway.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);

      // Refresh background stats
      loadDashboardData();
    } catch (err) {
      workflowOverallStatus.className = "badge badge-danger";
      workflowOverallStatus.textContent = "Failed";
      showToast(`Analysis Error: ${err.message}`, "error");
    } finally {
      btnAnalyzeSubmit.disabled = false;
      btnAnalyzeSubmit.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><span>Run Agentic Analysis</span>`;
    }
  });

  function renderAnalysisResult(data) {
    const { orderId, scenario, status, evidence, result, proposal, runId } = data;

    analysisResultCard.classList.remove("hidden");

    // Badges
    resultBadgesGroup.innerHTML = `
      ${renderScenarioBadge(scenario)}
      ${renderStatusBadge(status)}
      <span class="badge badge-neutral">${escapeHtml(evidence.sourceMode || "simulation")}</span>
    `;

    // Decision Banner
    resultDecisionBanner.className = "decision-banner";
    if (scenario === "DELIVERY_DELAY") {
      resultDecisionBanner.classList.add("delay");
      resultDecisionIcon.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
      resultDecisionTitle.textContent = "Delivery Delay Confirmed — Escalation Required";
    } else if (scenario === "DELIVERY_DISPUTED") {
      resultDecisionBanner.classList.add("dispute");
      resultDecisionIcon.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      resultDecisionTitle.textContent = "Delivery Disputed — Review & Investigation Required";
    } else {
      resultDecisionBanner.classList.add("ontime");
      resultDecisionIcon.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      resultDecisionTitle.textContent = "On Schedule / Fulfilled — No Escalation";
    }

    resultDecisionReason.textContent = result.reason;
    resultRecommendation.textContent = `Recommended Action: ${result.recommendation}`;

    // Summary Grid
    resOrderId.textContent = orderId;
    resPromisedDate.textContent = evidence.order?.promisedDate || "-";
    resDuplicatesRemoved.textContent = `${evidence.duplicateEventsRemoved ?? 0} duplicate(s) removed`;
    resRunId.textContent = runId;
    resRetrievedAt.textContent = formatDate(evidence.retrievedAt);

    const latestEv = evidence.events && evidence.events.length > 0
      ? evidence.events[evidence.events.length - 1]
      : null;
    resLatestStatus.textContent = latestEv ? latestEv.status : "Unknown";

    // Tracking Timeline
    if (!evidence.events || evidence.events.length === 0) {
      resultTimeline.innerHTML = `<p class="table-empty">No tracking events recorded in evidence.</p>`;
    } else {
      resultTimeline.innerHTML = evidence.events.map((ev) => {
        const isDelivered = String(ev.status).toUpperCase().includes("DELIVERED");
        const isDisputed = evidence.receiptDisputed && isDelivered;
        const eventClass = isDisputed ? "dispute" : (isDelivered ? "delivered" : "");

        return `
          <div class="timeline-event ${eventClass}">
            <div class="timeline-header">
              <span class="timeline-time">${formatDate(ev.timestamp)}</span>
              <span class="timeline-status">${escapeHtml(ev.status)}</span>
            </div>
            <div class="timeline-location">
              ${escapeHtml(ev.location || "Carrier Network")} &mdash; <em>${escapeHtml(ev.description || "")}</em>
            </div>
          </div>
        `;
      }).join("");
    }

    // Human Approval Gateway
    renderApprovalGateway(proposal, result);
  }

  function renderApprovalGateway(proposal, result) {
    if (!proposal || result.scenario === "NO_ESCALATION" || !result.humanApprovalRequired) {
      resultApprovalGateway.className = "approval-gateway no-escalation";
      resultApprovalGateway.innerHTML = `
        <div class="gateway-header">
          <div class="gateway-icon success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div>
            <h4 class="gateway-title">No Ticket Escalation Proposed</h4>
            <p class="gateway-subtitle">On-schedule tracking verified &bull; No support ticket or human sign-off needed</p>
          </div>
          <span class="badge badge-success">On Schedule</span>
        </div>
        <div class="gateway-body">
          <p>The tracking evidence confirms delivery or normal carrier transit within promise windows. No support proposal was generated.</p>
        </div>
      `;
      return;
    }

    const isAlreadyApproved = proposal.status === "ALREADY_APPROVED" || proposal.status === "APPROVED" || Boolean(proposal.ticketId);
    const isRejected = proposal.status === "REJECTED";

    if (isAlreadyApproved) {
      const activeTicketId = proposal.ticketId || result.existingTicketId || "ACTIVE-TICKET";
      resultApprovalGateway.className = "approval-gateway approved";
      resultApprovalGateway.innerHTML = `
        <div class="gateway-header">
          <div class="gateway-icon info">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div>
            <h4 class="gateway-title">Verified Demo Ticket Active</h4>
            <p class="gateway-subtitle">Proposal approved &bull; Idempotency locked: duplicate creation prevented</p>
          </div>
          <span class="badge badge-info">Ticket Issued</span>
        </div>
        <div class="gateway-body">
          <p>A verified demo ticket (<code>${escapeHtml(activeTicketId)}</code>) has been recorded in the database for Order <strong>${escapeHtml(proposal.orderId || result.orderId)}</strong>.</p>
          <div class="gateway-actions">
            <button class="btn btn-primary btn-sm" id="btnGatewayViewTickets">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              <span>View in Ticket Records</span>
            </button>
            <button class="btn btn-outline btn-sm" id="btnResetOrderApproval" data-order-id="${escapeHtml(proposal.orderId || result.orderId)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
              <span>Reset Order for Re-Testing Approval</span>
            </button>
          </div>
        </div>
      `;

      document.getElementById("btnGatewayViewTickets")?.addEventListener("click", () => {
        switchPage("tickets");
      });

      document.getElementById("btnResetOrderApproval")?.addEventListener("click", async () => {
        const orderIdToReset = proposal.orderId || result.orderId;
        try {
          const res = await apiFetch("/api/demo/reset-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: orderIdToReset })
          });
          showToast(res.message, "success");
          loadDashboardData();
          btnAnalyzeSubmit.click();
        } catch (e) {
          showToast(`Reset failed: ${e.message}`, "error");
        }
      });
      return;
    }

    if (isRejected) {
      resultApprovalGateway.className = "approval-gateway rejected";
      resultApprovalGateway.innerHTML = `
        <div class="gateway-header">
          <div class="gateway-icon danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <div>
            <h4 class="gateway-title">Proposal Rejected by Operator</h4>
            <p class="gateway-subtitle">No support ticket was generated &bull; Decision logged in audit trail</p>
          </div>
          <span class="badge badge-danger">Rejected</span>
        </div>
        <div class="gateway-body">
          <p>This proposal was rejected during human review. The order remains flagged for observation without a support ticket.</p>
          <div class="gateway-actions">
            <button class="btn btn-outline btn-sm" id="btnResetOrderApproval" data-order-id="${escapeHtml(proposal.orderId || result.orderId)}">
              <span>Reset Order for Re-Testing</span>
            </button>
          </div>
        </div>
      `;

      document.getElementById("btnResetOrderApproval")?.addEventListener("click", async () => {
        const orderIdToReset = proposal.orderId || result.orderId;
        try {
          const res = await apiFetch("/api/demo/reset-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: orderIdToReset })
          });
          showToast(res.message, "success");
          loadDashboardData();
          btnAnalyzeSubmit.click();
        } catch (e) {
          showToast(`Reset failed: ${e.message}`, "error");
        }
      });
      return;
    }

    // Default: PENDING_APPROVAL - Prominent Human Decision Gateway
    resultApprovalGateway.className = "approval-gateway pending";
    resultApprovalGateway.innerHTML = `
      <div class="gateway-header">
        <div class="gateway-icon pulse">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <div class="gateway-title-area">
          <div class="gateway-title-row">
            <h4 class="gateway-title">Human-in-the-Loop Approval Required</h4>
            <span class="badge badge-warning pulse-badge">Awaiting Decision</span>
          </div>
          <p class="gateway-subtitle">Autonomous agent generated a support escalation proposal &bull; Independent human authorization required before ticket creation</p>
        </div>
      </div>

      <div class="gateway-body">
        <div class="gateway-proposal-box">
          <div class="proposal-field">
            <span class="field-label">Proposed Support Action:</span>
            <div class="field-value action-highlight">
              ${escapeHtml(proposal.proposedSupportAction || proposal.recommendation || "Expedited Carrier Trace & Customer Update")}
            </div>
          </div>
          <div class="proposal-field">
            <span class="field-label">Agent Reasoning:</span>
            <div class="field-value">${escapeHtml(proposal.reason || result.reason || "Delivery delay or discrepancy identified")}</div>
          </div>
          <div class="proposal-guardrails">
            <span class="guardrail-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Idempotency Guardrail Active</span>
            <span class="guardrail-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Zero Auto-Refunds Guardrail</span>
            <span class="guardrail-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Verifiable Local Record</span>
          </div>
        </div>

        <div class="gateway-footer">
          <div class="gateway-actions">
            <button class="btn btn-success btn-lg" id="btnGatewayApprove">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Approve Proposal & Create Demo Ticket</span>
            </button>
            <button class="btn btn-danger btn-outline btn-lg" id="btnGatewayReject">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>Reject Proposal</span>
            </button>
          </div>
          <div class="gateway-queue-link">
            <span>Or manage centrally in <a href="#approvals" id="linkToApprovalsQueue">Pending Approvals Queue</a></span>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btnGatewayApprove")?.addEventListener("click", () => {
      promptConfirmation("approve", proposal.proposalId);
    });

    document.getElementById("btnGatewayReject")?.addEventListener("click", () => {
      promptConfirmation("reject", proposal.proposalId);
    });

    document.getElementById("linkToApprovalsQueue")?.addEventListener("click", (e) => {
      e.preventDefault();
      switchPage("approvals");
    });
  }

  // --------------------------------------------------
  // 3. PENDING APPROVALS QUEUE
  // --------------------------------------------------
  async function loadProposals() {
    try {
      const statusFilter = filterApprovalStatus.value;
      const url = statusFilter === "ALL" ? "/api/proposals" : `/api/proposals?status=${statusFilter}`;
      const data = await apiFetch(url);

      if (!data.proposals || data.proposals.length === 0) {
        proposalsContainer.innerHTML = `<div class="table-empty">No proposals found matching the filter "${statusFilter}".</div>`;
        return;
      }

      proposalsContainer.innerHTML = data.proposals.map((p) => {
        const isPending = p.status === "PENDING_APPROVAL";
        const details = p.proposal || {};

        return `
          <div class="proposal-card">
            <div class="proposal-info">
              <h4>
                <span>Order ${escapeHtml(p.order_id)}</span>
                ${renderScenarioBadge(p.scenario)}
                ${renderProposalStatusBadge(p.status)}
              </h4>
              <p class="proposal-reason">${escapeHtml(details.reason || "Escalation suggested by decision engine")}</p>
              <div class="proposal-action-box">
                <strong>Proposed Action:</strong> ${escapeHtml(details.proposedSupportAction || details.recommendation || "Review courier trace")}
              </div>
              <div class="proposal-meta">
                Proposal ID: <code>${p.proposal_id}</code> &bull;
                Run ID: <code>${p.run_id}</code> &bull;
                Created: ${formatDate(p.created_at)}
                ${p.ticket_id ? `&bull; Linked Ticket: <code>${p.ticket_id}</code>` : ""}
              </div>
            </div>
            ${isPending ? `
              <div class="proposal-actions">
                <button class="btn btn-success btn-sm btn-approve-prop" data-prop-id="${p.proposal_id}">Approve</button>
                <button class="btn btn-danger btn-outline btn-sm btn-reject-prop" data-prop-id="${p.proposal_id}">Reject</button>
              </div>
            ` : ""}
          </div>
        `;
      }).join("");

      proposalsContainer.querySelectorAll(".btn-approve-prop").forEach((btn) => {
        btn.addEventListener("click", () => promptConfirmation("approve", btn.getAttribute("data-prop-id")));
      });

      proposalsContainer.querySelectorAll(".btn-reject-prop").forEach((btn) => {
        btn.addEventListener("click", () => promptConfirmation("reject", btn.getAttribute("data-prop-id")));
      });
    } catch (err) {
      showToast(`Failed to load proposals: ${err.message}`, "error");
    }
  }

  filterApprovalStatus?.addEventListener("change", loadProposals);
  btnRefreshApprovals?.addEventListener("click", () => {
    showToast("Refreshing proposals...", "info");
    loadProposals();
  });

  // --------------------------------------------------
  // CONFIRMATION MODAL WORKFLOW
  // --------------------------------------------------
  function promptConfirmation(action, proposalId) {
    state.pendingAction = { action, proposalId };

    if (action === "approve") {
      confirmModalTitle.textContent = "Confirm Proposal Approval";
      confirmModalMessage.textContent = `Are you sure you want to approve proposal ${proposalId}? This will issue a verified local demo ticket record and lock the decision.`;
      rejectReasonGroup.classList.add("hidden");
      btnExecuteConfirm.className = "btn btn-success";
      btnExecuteConfirm.textContent = "Yes, Approve";
    } else {
      confirmModalTitle.textContent = "Confirm Proposal Rejection";
      confirmModalMessage.textContent = `Are you sure you want to reject proposal ${proposalId}? No support ticket will be created.`;
      rejectReasonGroup.classList.remove("hidden");
      inputRejectReason.value = "";
      btnExecuteConfirm.className = "btn btn-danger";
      btnExecuteConfirm.textContent = "Yes, Reject";
    }

    confirmActionModal.classList.remove("hidden");
  }

  function closeConfirmModal() {
    confirmActionModal.classList.add("hidden");
    state.pendingAction = null;
  }

  btnCloseConfirmModal?.addEventListener("click", closeConfirmModal);
  btnCancelConfirm?.addEventListener("click", closeConfirmModal);

  btnExecuteConfirm?.addEventListener("click", async () => {
    if (!state.pendingAction) return;

    const { action, proposalId } = state.pendingAction;
    btnExecuteConfirm.disabled = true;

    try {
      if (action === "approve") {
        const res = await apiFetch("/api/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalId, approved: true })
        });
        showToast(res.message || "Proposal approved successfully.", "success");
      } else {
        const reason = inputRejectReason.value.trim() || "Rejected by human operator";
        const res = await apiFetch("/api/reject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ proposalId, reason })
        });
        showToast(res.message || "Proposal rejected.", "warning");
      }

      closeConfirmModal();
      loadDashboardData();
      if (state.currentPage === "approvals") loadProposals();
      if (state.currentPage === "analyze" && state.currentAnalysisRun) {
        // Re-render current analysis gateway if it matches
        if (state.currentAnalysisRun.proposal?.proposalId === proposalId) {
          state.currentAnalysisRun.proposal.status = action === "approve" ? "APPROVED" : "REJECTED";
          renderApprovalGateway(state.currentAnalysisRun.proposal, state.currentAnalysisRun.result);
        }
      }
    } catch (err) {
      showToast(`Action failed: ${err.message}`, "error");
    } finally {
      btnExecuteConfirm.disabled = false;
    }
  });

  // --------------------------------------------------
  // 4. TICKET MANAGEMENT
  // --------------------------------------------------
  async function loadTickets() {
    try {
      const data = await apiFetch("/api/tickets");

      if (!data.tickets || data.tickets.length === 0) {
        ticketsTbody.innerHTML = `<tr><td colspan="7" class="table-empty">No ticket records in database.</td></tr>`;
        return;
      }

      ticketsTbody.innerHTML = data.tickets.map((t) => {
        const details = t.details || {};
        return `
          <tr>
            <td>
              <code>${t.ticket_id}</code>
              <button class="copy-btn" onclick="navigator.clipboard.writeText('${t.ticket_id}')">Copy</button>
            </td>
            <td><strong>${escapeHtml(t.order_id)}</strong></td>
            <td>${renderScenarioBadge(t.scenario)}</td>
            <td><span class="badge badge-success">${escapeHtml(t.status)}</span></td>
            <td><small>${formatDate(t.created_at)}</small></td>
            <td><span class="badge badge-info">${escapeHtml(details.verificationStatus || "VERIFIED_RECORD")}</span></td>
            <td>
              <button class="btn btn-outline btn-sm btn-ticket-detail" data-ticket-id="${t.ticket_id}">Details</button>
            </td>
          </tr>
        `;
      }).join("");

      ticketsTbody.querySelectorAll(".btn-ticket-detail").forEach((b) => {
        b.addEventListener("click", async () => {
          const tId = b.getAttribute("data-ticket-id");
          try {
            const ticket = await apiFetch(`/api/tickets/${tId}`);
            alert(`Ticket ${ticket.ticket_id}\nOrder: ${ticket.order_id}\nScenario: ${ticket.scenario}\nStatus: ${ticket.status}\nCreated: ${ticket.created_at}\n\nNotice: Verified local demo ticket.`);
          } catch (e) {
            showToast(`Could not fetch ticket details: ${e.message}`, "error");
          }
        });
      });
    } catch (err) {
      showToast(`Failed to load tickets: ${err.message}`, "error");
    }
  }

  btnRefreshTickets?.addEventListener("click", () => {
    showToast("Refreshing tickets...", "info");
    loadTickets();
  });

  // --------------------------------------------------
  // 5. EVIDENCE & SOURCE AUDIT
  // --------------------------------------------------
  async function loadAuditTrail() {
    try {
      const data = await apiFetch("/api/audit");

      if (!data.audits || data.audits.length === 0) {
        auditTbody.innerHTML = `<tr><td colspan="6" class="table-empty">No evidence audit records available. Run an order analysis to generate audit hashes.</td></tr>`;
        return;
      }

      auditTbody.innerHTML = data.audits.map((a) => {
        const shortHash = a.contentHash ? `${a.contentHash.slice(0, 16)}...` : "-";
        return `
          <tr>
            <td><strong>${escapeHtml(a.sourceName)}</strong></td>
            <td>
              <a href="${a.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(a.url)}</a>
            </td>
            <td><span class="badge ${a.httpStatus === 200 ? 'badge-success' : 'badge-danger'}">${a.httpStatus}</span></td>
            <td><small>${formatDate(a.retrievedAt)}</small></td>
            <td>
              <code>${shortHash}</code>
              <button class="copy-btn" onclick="navigator.clipboard.writeText('${a.contentHash}')">Copy SHA-256</button>
            </td>
            <td><span class="badge badge-neutral">VERIFIED_SYNTHETIC</span></td>
          </tr>
        `;
      }).join("");
    } catch (err) {
      showToast(`Failed to load audit trail: ${err.message}`, "error");
    }
  }

  btnRefreshAudit?.addEventListener("click", () => {
    showToast("Refreshing audit trail...", "info");
    loadAuditTrail();
  });

  // --------------------------------------------------
  // 6. ANALYSIS HISTORY
  // --------------------------------------------------
  async function loadHistory() {
    try {
      const q = historySearchInput.value.trim();
      const scenario = historyScenarioFilter.value;

      let url = "/api/history";
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (scenario) params.append("scenario", scenario);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const data = await apiFetch(url);

      if (!data.runs || data.runs.length === 0) {
        historyTbody.innerHTML = `<tr><td colspan="6" class="table-empty">No analysis history matches your query.</td></tr>`;
        return;
      }

      historyTbody.innerHTML = data.runs.map((r) => `
        <tr>
          <td><code>${r.run_id}</code></td>
          <td><strong>${escapeHtml(r.order_id)}</strong></td>
          <td>${renderScenarioBadge(r.scenario)}</td>
          <td>${renderStatusBadge(r.status)}</td>
          <td><small>${formatDate(r.created_at)}</small></td>
          <td>
            <button class="btn btn-outline btn-sm btn-inspect-history" data-run-id="${r.run_id}">Inspect Run</button>
          </td>
        </tr>
      `).join("");

      historyTbody.querySelectorAll(".btn-inspect-history").forEach((b) => {
        b.addEventListener("click", () => inspectRunDetails(b.getAttribute("data-run-id")));
      });
    } catch (err) {
      showToast(`Failed to load history: ${err.message}`, "error");
    }
  }

  btnSearchHistory?.addEventListener("click", loadHistory);
  historySearchInput?.addEventListener("keyup", (e) => {
    if (e.key === "Enter") loadHistory();
  });
  historyScenarioFilter?.addEventListener("change", loadHistory);

  // --------------------------------------------------
  // RUN DETAIL MODAL (Fixed Bug A: Safe JSON Display)
  // --------------------------------------------------
  async function inspectRunDetails(runId) {
    try {
      const data = await apiFetch(`/api/history/${runId}`);

      modalRunTitle.textContent = `Analysis Run: ${data.run_id}`;
      modalRunSubtitle.textContent = `Order: ${data.order_id} &bull; Recorded: ${formatDate(data.created_at)}`;

      modalOverviewContent.innerHTML = `
        <div class="order-summary-grid">
          <div class="summary-item"><span class="label">Scenario:</span><strong>${escapeHtml(data.scenario)}</strong></div>
          <div class="summary-item"><span class="label">Decision Status:</span><strong>${escapeHtml(data.status)}</strong></div>
          <div class="summary-item"><span class="label">Reason:</span><span>${escapeHtml(data.result?.reason || "-")}</span></div>
          <div class="summary-item"><span class="label">Recommendation:</span><span>${escapeHtml(data.result?.recommendation || "-")}</span></div>
        </div>
      `;

      modalEvidenceJson.textContent = JSON.stringify(data.evidence, null, 2);
      modalResultJson.textContent = JSON.stringify(data.result, null, 2);

      // Reset modal tab to overview
      document.querySelectorAll(".tab-btn").forEach((t) => t.classList.toggle("active", t.getAttribute("data-tab") === "tab-overview"));
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.toggle("active", p.id === "tab-overview"));

      runDetailModal.classList.remove("hidden");
    } catch (err) {
      showToast(`Error retrieving run details: ${err.message}`, "error");
    }
  }

  btnCloseRunModal?.addEventListener("click", () => runDetailModal.classList.add("hidden"));
  btnCloseRunModalBottom?.addEventListener("click", () => runDetailModal.classList.add("hidden"));

  // Modal Tabs Navigation
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(targetTab)?.classList.add("active");
    });
  });

  // --------------------------------------------------
  // 7. SYSTEM TESTING & DIAGNOSTICS (TC1, TC2, TC3, TC4)
  // --------------------------------------------------
  async function loadPastTestRuns() {
    try {
      const data = await apiFetch("/api/tests");
      if (data.tests && data.tests.length > 0) {
        renderDiagnosticsTable(data.tests.slice(0, 12).map((t) => ({
          testId: t.test_id,
          testName: t.test_name,
          expected: t.details?.expected || t.details?.expectedResult || "Expected match",
          actual: t.details?.actual || t.details?.actualResult || "Passed",
          passed: t.status === "PASS",
          durationMs: t.details?.durationMs ?? 1
        })));
        diagTimestamp.textContent = formatDate(data.tests[0].created_at);
      }
    } catch {
      // Non-fatal
    }
  }

  btnExecuteDiagnostics?.addEventListener("click", async () => {
    btnExecuteDiagnostics.disabled = true;
    btnExecuteDiagnostics.innerHTML = `<span class="pulse-dot"></span> <span>Running Test Runner...</span>`;

    try {
      const suite = await apiFetch("/api/tests/run", { method: "POST" });

      diagTotal.textContent = suite.total;
      diagPassed.textContent = suite.passed;
      diagFailed.textContent = suite.failed;
      diagTimestamp.textContent = formatDate(suite.timestamp);

      renderDiagnosticsTable(suite.results);
      showToast(`Diagnostic completed: ${suite.passed}/${suite.total} tests passed!`, suite.ok ? "success" : "warning");
    } catch (err) {
      showToast(`Test execution failed: ${err.message}`, "error");
    } finally {
      btnExecuteDiagnostics.disabled = false;
      btnExecuteDiagnostics.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Run Real Test Suite</span>`;
    }
  });

  function renderDiagnosticsTable(results) {
    if (!results || results.length === 0) {
      diagnosticsTbody.innerHTML = `<tr><td colspan="6" class="table-empty">No test records available. Click run.</td></tr>`;
      return;
    }

    diagnosticsTbody.innerHTML = results.map((r) => `
      <tr>
        <td><code>${escapeHtml(r.testId || "-")}</code></td>
        <td><strong>${escapeHtml(r.testName || "-")}</strong></td>
        <td><small>${escapeHtml(r.expected || "-")}</small></td>
        <td><small>${escapeHtml(r.actual || "-")}</small></td>
        <td><code>${r.durationMs ?? 0}ms</code></td>
        <td>
          <span class="badge ${r.passed ? 'badge-success' : 'badge-danger'}">
            ${r.passed ? 'PASS' : 'FAIL'}
          </span>
        </td>
      </tr>
    `).join("");
  }

  // --------------------------------------------------
  // BADGE HELPERS
  // --------------------------------------------------
  function renderScenarioBadge(scenario) {
    switch (scenario) {
      case "DELIVERY_DELAY":
      case "late":
        return `<span class="badge badge-danger">DELIVERY_DELAY</span>`;
      case "DELIVERY_DISPUTED":
      case "discrepancy":
        return `<span class="badge badge-warning">DELIVERY_DISPUTED</span>`;
      case "NO_ESCALATION":
      case "ON_TIME":
        return `<span class="badge badge-success">NO_ESCALATION</span>`;
      default:
        return `<span class="badge badge-neutral">${escapeHtml(scenario || "UNKNOWN")}</span>`;
    }
  }

  function renderStatusBadge(status) {
    switch (status) {
      case "ESCALATION_REQUIRED":
        return `<span class="badge badge-danger">ESCALATION_REQUIRED</span>`;
      case "REVIEW_REQUIRED":
        return `<span class="badge badge-warning">REVIEW_REQUIRED</span>`;
      case "NO_ACTION_REQUIRED":
        return `<span class="badge badge-success">NO_ACTION_REQUIRED</span>`;
      case "CREATED":
        return `<span class="badge badge-info">CREATED</span>`;
      default:
        return `<span class="badge badge-neutral">${escapeHtml(status || "UNKNOWN")}</span>`;
    }
  }

  function renderProposalStatusBadge(status) {
    switch (status) {
      case "PENDING_APPROVAL":
        return `<span class="badge badge-purple">PENDING_APPROVAL</span>`;
      case "APPROVED":
        return `<span class="badge badge-success">APPROVED</span>`;
      case "REJECTED":
        return `<span class="badge badge-danger">REJECTED</span>`;
      default:
        return `<span class="badge badge-neutral">${escapeHtml(status || "UNKNOWN")}</span>`;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }

  // --------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------
  loadDashboardData();
});
