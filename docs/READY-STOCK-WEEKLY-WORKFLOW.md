# Ready Stock Weekly Publishing Workflow

## Purpose

This workflow publishes only products whose price, availability, packaging data and image rights have been verified. The long-term PDF catalog remains separate.

## Weekly sequence

1. Collect candidate products from current suppliers and market-research sources.
2. Record each candidate in `Entrol-Ready-Stock-Product-Data-Template.xlsx`.
3. Confirm supplier SKU, procurement cost, MOQ, stock, lead time, unit packaging, carton data and dropshipping capability.
4. Provide one main image and exactly three detail images in this order:
   - `SKU-main.jpg`
   - `SKU-detail-1.jpg`
   - `SKU-detail-2.jpg`
   - `SKU-detail-3.jpg`
5. Confirm each image is owned by Entrol or authorized for publication.
6. Management reviews the USD selling price and decides whether the item is `In Stock` or `Available to Source`.
7. Convert approved rows into `data/ready-stock-products.json` and approved freight rules into `data/shipping-rates.json`.
8. Run `node scripts/validate-ready-stock.mjs` and the Ready Stock tests.
9. Review the desktop and mobile page locally.
10. Commit, push and verify the live page only after the checks pass.

## Publication rules

- A row is public only when `publish_status` is `Published`.
- `image_authorization` must be `Authorized` or `Own Photo`.
- `stock_verified_at` must be within the configured verification window, currently seven days.
- Expired stock records disappear automatically until verified again.
- Missing freight rules must display `To be quoted`.
- Platform stock displays, including 1688, are candidate evidence only. Supplier confirmation is required.
- Do not copy marketplace descriptions or images without permission.

## Customer-facing meaning

The page creates a non-binding purchase intent. It is not a paid order. Final price, stock, freight, duties, taxes and delivery terms require an Entrol quotation.
