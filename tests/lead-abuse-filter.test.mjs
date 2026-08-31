import assert from "node:assert/strict";
import test from "node:test";
import { assessLeadAbuse } from "../supabase/functions/entrol-submit-lead/anti-spam.mjs";
import fs from "node:fs";

test("homepage catalog quote form includes the server-side honeypot and requires a contact name", () => {
  const html = fs.readFileSync("index.html", "utf8");
  assert.match(html, /name="website"[^>]*tabindex="-1"[^>]*autocomplete="off"/);
  assert.match(html, /name="name"[^>]*autocomplete="name"[^>]*required/);
});

test("quarantines the observed random LLC, gibberish quantity and numeric message pattern", () => {
  const result = assessLeadAbuse({
    name: "Hytwx Almrgjwm",
    email: "u.k.u.v.i.bo.b96.0@gmail.com",
    contact: null,
    company: "Azmmibark LLC",
    product_interest: "Cat Trees",
    quantity: "QnheBOnPcpxZQHpssKV",
    target_market: null,
    message: "2358041132",
  });
  assert.equal(result.quarantined, true);
  assert.ok(result.riskScore >= 4);
});

test("quarantines repeated near-empty random company submissions", () => {
  const result = assessLeadAbuse({
    name: null,
    email: "repeat@example.com",
    contact: null,
    company: "Jemrer LLC",
    product_interest: null,
    quantity: null,
    target_market: null,
    message: null,
  }, { recentDuplicateEmail: true });
  assert.equal(result.quarantined, true);
});

test("quarantines the newly observed unnamed sparse catalog LLC submission", () => {
  const result = assessLeadAbuse({
    submission_type: "catalog",
    name: null,
    email: "jos.hna.m@gmail.com",
    contact: null,
    company: "Aalyhuruj LLC",
    product_interest: "Cat Trees",
    quantity: null,
    target_market: null,
    message: null,
  });
  assert.equal(result.quarantined, true);
  assert.equal(result.riskScore, 4);
  assert.match(result.reasons.join("; "), /observed random LLC campaign/);
});

test("quarantines an email hidden in contact combined with a numeric-only message", () => {
  const result = assessLeadAbuse({
    submission_type: "inquiry",
    name: "Ilqb Adtstoawu",
    email: null,
    contact: "rym_21@hotmail.co.uk",
    company: null,
    product_interest: "Cat Tree",
    quantity: null,
    target_market: null,
    message: "2483384716",
  });
  assert.equal(result.quarantined, true);
  assert.equal(result.riskScore, 4);
  assert.match(result.reasons.join("; "), /email address was placed in contact/);
  assert.match(result.reasons.join("; "), /phone-like number/);
});

test("does not quarantine a buyer solely for placing an email address in contact", () => {
  const result = assessLeadAbuse({
    submission_type: "inquiry",
    name: "Marie Laurent",
    email: null,
    contact: "marie@example.com",
    company: "Maison du Chat",
    product_interest: "Cat Trees",
    quantity: "300 pcs",
    target_market: "France",
    message: "Please quote three cat tree models with private label packaging and consolidated delivery to Lyon.",
  });
  assert.equal(result.quarantined, false);
  assert.equal(result.riskScore, 2);
});

test("does not quarantine a named catalog buyer solely for using an LLC company name", () => {
  const result = assessLeadAbuse({
    submission_type: "catalog",
    name: "Anna Lee",
    email: "anna@example.com",
    contact: null,
    company: "Amazon LLC",
    product_interest: "Cat Trees",
    quantity: null,
    target_market: null,
    message: null,
  });
  assert.equal(result.quarantined, false);
  assert.equal(result.riskScore, 2);
});

test("does not penalize a detailed Gmail buyer inquiry", () => {
  const result = assessLeadAbuse({
    name: "Marie Laurent",
    email: "marie.laurent@gmail.com",
    contact: "+33 6 12 34 56 78",
    company: "Maison du Chat",
    product_interest: "Cat trees and scratching posts",
    quantity: "300 pcs",
    target_market: "France",
    message: "We operate an online pet store and need a quotation for several models, private label packaging, and consolidated delivery to Lyon.",
  });
  assert.equal(result.quarantined, false);
  assert.equal(result.riskScore, 0);
});

test("one repeat signal alone does not quarantine a legitimate follow-up", () => {
  const result = assessLeadAbuse({
    name: "Marie Laurent",
    email: "marie.laurent@gmail.com",
    contact: null,
    company: "Maison du Chat",
    product_interest: "Cat trees",
    quantity: "500 pcs",
    target_market: "France",
    message: "Following up with the destination postal code and revised quantities for our first wholesale order.",
  }, { recentDuplicateEmail: true });
  assert.equal(result.quarantined, false);
  assert.equal(result.riskScore, 2);
});
