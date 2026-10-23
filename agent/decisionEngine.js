
function decideDeliveryStatus({
  promisedDate,
  events,
  retrievedAt,
  retrievalFailed = false,
  receiptDisputed = false
}) {
  if (retrievalFailed) {
    return {
      decision: "SOURCE_RETRIEVAL_FAILED",
      reason: "Could not retrieve the tracking source."
    };
  }

  // Require a real calendar date in YYYY-MM-DD format.
  const validDate = value => {
    if (
      typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  };

  if (
    !validDate(promisedDate) ||
    typeof retrievedAt !== "string" ||
    !Number.isFinite(Date.parse(retrievedAt)) ||
    !Array.isArray(events) ||
    events.length === 0
  ) {
    return {
      decision: "INSUFFICIENT_EVIDENCE",
      reason: "Required date or tracking evidence is missing."
    };
  }

  const validEvents = events.filter(event =>
    event &&
    typeof event.status === "string" &&
    event.status.trim() !== "" &&
    typeof event.time === "string" &&
    Number.isFinite(Date.parse(event.time))
  );

  if (validEvents.length === 0) {
    return {
      decision: "INSUFFICIENT_EVIDENCE",
      reason: "No valid tracking events were found."
    };
  }

  // Remove duplicate events while retaining the original event records.
  const uniqueEvents = [
    ...new Map(
      validEvents.map(event => [
        event.eventId
          ? `id:${event.eventId}`
          : `fallback:${event.time}|${event.status.toLowerCase().trim()}`,
        event
      ])
    ).values()
  ];

  uniqueEvents.sort(
    (a, b) => Date.parse(a.time) - Date.parse(b.time)
  );

  const latest = uniqueEvents[uniqueEvents.length - 1];
  const latestStatus = latest.status.toLowerCase().trim();

  const isDisputed =
    receiptDisputed ||
    (/delivered/.test(latestStatus) &&
      /not received|never received/.test(latestStatus));

  if (isDisputed) {
    return {
      decision: "DELIVERY_DISPUTED",
      reason: "Delivery is disputed and requires investigation.",
      latestEvent: latest,
      events: uniqueEvents
    };
  }

  const saysNotDelivered =
    /\bnot delivered\b|\bdelivery failed\b|\bdelivery attempted\b/.test(
      latestStatus
    );

  const saysDelivered =
    /\bdelivered\b/.test(latestStatus) && !saysNotDelivered;

  if (saysDelivered) {
    return {
      decision: "DELIVERED",
      reason: "The latest tracking event reports delivery.",
      latestEvent: latest,
      events: uniqueEvents
    };
  }

  const today = retrievedAt.slice(0, 10);

  if (today > promisedDate) {
    return {
      decision: "DELAY_CONFIRMED",
      reason:
        "The promised date has passed and tracking does not report delivery.",
      latestEvent: latest,
      events: uniqueEvents
    };
  }

  return {
    decision: "ON_TIME",
    reason: "The promised date has not passed.",
    latestEvent: latest,
    events: uniqueEvents
  };
}

module.exports = { decideDeliveryStatus };
