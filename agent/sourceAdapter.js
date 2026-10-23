
const ALLOWED_MODES = new Set(["simulation", "organizer"]);

function validateOrderInput({ orderId, promisedDate }) {
  if (typeof orderId !== "string" || !orderId.trim()) {
    throw new Error("Order ID is required.");
  }

  if (!/^[A-Za-z0-9_-]{1,64}$/.test(orderId.trim())) {
    throw new Error("Order ID contains invalid characters.");
  }

  if (
    typeof promisedDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(promisedDate) ||
    !Number.isFinite(Date.parse(`${promisedDate}T00:00:00Z`)) ||
    new Date(`${promisedDate}T00:00:00Z`)
      .toISOString()
      .slice(0, 10) !== promisedDate
  ) {
    throw new Error("Promised date must be a valid YYYY-MM-DD date.");
  }

  return {
    orderId: orderId.trim(),
    promisedDate
  };
}

function createEvidence({
  order,
  events,
  sourceName,
  sourceUrl = null,
  retrievedAt = new Date().toISOString(),
  mode
}) {
  if (!ALLOWED_MODES.has(mode)) {
    throw new Error("Choose simulation or organizer mode.");
  }

  if (!Array.isArray(events)) {
    throw new Error("Tracking events must be an array.");
  }

  return {
    mode,
    sourceName,
    sourceUrl,
    retrievedAt,
    order,
    events: events.map((event, index) => ({
      eventId: String(event.eventId || `${event.time}|${event.status}|${index}`),
      status: String(event.status || ""),
      time: String(event.time || ""),
      sourceUrl: event.sourceUrl || sourceUrl
    }))
  };
}

// Explicitly labelled local examples; these are not live order records.
function getSimulationEvidence(scenario = "late") {
  const examples = {
    late: {
      order: {
        orderId: "DEMO-1001",
        promisedDate: "2026-10-15",
        status: "In Transit"
      },
      events: [
        {
          eventId: "EV-101",
          status: "Order Dispatched",
          time: "2026-10-13T09:00:00Z"
        },
        {
          eventId: "EV-102",
          status: "In Transit",
          time: "2026-10-17T12:00:00Z"
        }
      ]
    },
    disputed: {
      order: {
        orderId: "DEMO-1002",
        promisedDate: "2026-10-18",
        status: "Delivered"
      },
      events: [
        {
          eventId: "EV-201",
          status: "Delivered",
          time: "2026-10-18T14:00:00Z"
        }
      ]
    },
    repeated: {
      order: {
        orderId: "DEMO-1003",
        promisedDate: "2026-10-25",
        status: "In Transit"
      },
      events: [
        {
          eventId: "EV-301",
          status: "In Transit",
          time: "2026-10-19T10:00:00Z"
        },
        {
          eventId: "EV-301",
          status: "In Transit",
          time: "2026-10-19T10:00:00Z"
        }
      ]
    }
  };

  const selected = examples[scenario];

  if (!selected) {
    throw new Error(`Unknown simulation scenario: ${scenario}`);
  }

  return createEvidence({
    ...selected,
    sourceName: "Local simulation data",
    sourceUrl: null,
    mode: "simulation"
  });
}

module.exports = {
  validateOrderInput,
  createEvidence,
  getSimulationEvidence
};
