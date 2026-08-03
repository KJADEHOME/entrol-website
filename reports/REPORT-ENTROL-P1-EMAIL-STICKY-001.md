# REPORT-ENTROL-P1-EMAIL-STICKY-001

## Result

PASS with one environment limitation noted below.

## Modified files

- index.html - Mobile Sticky Conversion Bar markup and component-scoped styles only.
- reports/REPORT-ENTROL-P1-EMAIL-STICKY-001.md - This validation report.

No product pages, SEO content, FormSubmit logic, or other CTA components were changed.

## Functionality

- CTA priority/order at standard mobile width: WhatsApp -> Get Quote -> Email Us -> Catalog.
- Email Us uses the site's existing public inquiry address:
  mailto:wangyan@entrol.com?subject=OEM%20Pet%20Products%20Inquiry
- Get Quote remains the gold primary conversion CTA.
- At widths up to 480px, Catalog is hidden so WhatsApp, Get Quote, and Email Us retain usable space.
- At desktop widths (769px and above), the mobile Sticky Bar remains hidden.

## Test results

| Check | Result | Evidence |
| --- | --- | --- |
| Chrome Desktop, 1280px | PASS | Chrome computed the Sticky Bar display as none. |
| Chrome responsive, 600px | PASS | Bar display flex; all four CTAs visible in the required priority order. |
| Chrome responsive, 390px | PASS | WhatsApp, Get Quote, and Email Us visible; Catalog hidden; no Sticky Bar child crossed the bar boundary. |
| Email Us target | PASS | Chrome resolved the exact mailto address and percent-encoded subject. |
| Default mail client launch | NOT VERIFIED | Chrome Headless suppresses external application handoff; the protocol URL is correct, but an OS mail-client window was not asserted. |
| WhatsApp | PASS | Existing wa.me/8615263130999 URL and _blank target remained unchanged in Chrome DOM. |
| Get Quote | PASS | Chrome click triggered the existing smooth-scroll handler; scrollY changed from 0 to 7504 toward #rfq-form-anchor. |
| HTML/static regression | PASS | Email CTA occurs once; RFQ anchor and WhatsApp target exist; git diff --check passed. |

Chrome Desktop and responsive checks used the installed Google Chrome executable and Chrome DevTools Protocol against the local index.html.

## Commit hash

Feature commit: 0df785dd8a6d8e9e8dc18bdbb766224a38890dfe

The report is committed separately because a Git commit cannot contain its own final hash.