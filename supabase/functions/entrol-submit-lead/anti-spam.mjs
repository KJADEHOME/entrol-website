function isCompactGibberish(value) {
  if (!value || /\s/.test(value) || value.length < 14) return false;
  return /^[A-Za-z]+$/.test(value) && /[a-z]/.test(value) && /[A-Z]/.test(value);
}

export function assessLeadAbuse(lead, options = {}) {
  let riskScore = 0;
  const reasons = [];
  const add = (points, reason) => {
    riskScore += points;
    reasons.push(reason);
  };

  if (options.recentDuplicateEmail) add(2, "same email submitted recently");

  if (lead.quantity && isCompactGibberish(lead.quantity)) {
    add(2, "quantity is compact mixed-case gibberish");
  }

  if (lead.message && /^\d{7,15}$/.test(lead.message)) {
    add(2, "message contains only a phone-like number");
    if (!lead.email && !lead.name && !lead.company && !lead.quantity) {
      add(2, "numeric-only contact submission has no buyer details");
    }
  } else if (lead.message && isCompactGibberish(lead.message)) {
    add(2, "message is compact mixed-case gibberish");
  }

  if (lead.company && /^[A-Za-z]{5,12} LLC$/.test(lead.company)) {
    add(1, "company matches repeated random LLC pattern");
  }

  if (!lead.message && !lead.quantity && !lead.target_market && !lead.contact) {
    add(1, "submission has almost no qualification detail");
  }

  return {
    quarantined: riskScore >= 4,
    riskScore,
    reasons,
  };
}
