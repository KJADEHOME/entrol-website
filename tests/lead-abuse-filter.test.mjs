import assert from "node:assert/strict";
import test from "node:test";
import { assessLeadAbuse } from "../supabase/functions/entrol-submit-lead/anti-spam.mjs";

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
