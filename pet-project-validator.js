(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EntrolPetProjectValidator = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function clean(value) {
    return String(value || '').trim().toLowerCase();
  }

  function productGroup(value) {
    var product = clean(value);
    if (/cat tree|cat furniture/.test(product)) return 'cat_tree';
    if (/toy/.test(product)) return 'toy';
    if (/apparel|clothing|knitwear|sweater/.test(product)) return 'apparel';
    if (/bed|bedding|cushion|sofa/.test(product)) return 'bedding';
    if (/leash|collar|harness|training line/.test(product)) return 'walking';
    if (/feeding|bowl|mat/.test(product)) return 'feeding';
    if (/groom|clean/.test(product)) return 'grooming';
    if (/travel|carrier/.test(product)) return 'travel';
    return 'other';
  }

  function assess(fields) {
    fields = fields || {};
    var group = productGroup(fields.product);
    var pet = clean(fields.pet_type);
    var size = clean(fields.pet_size);
    var age = clean(fields.pet_age);
    var material = clean(fields.material_preference);
    var use = clean(fields.intended_use);
    var packaging = clean(fields.packaging_format);
    var dimensions = clean(fields.dimensions);
    var message = clean(fields.message);
    var risks = [];

    function add(level, code, messageText, fix) {
      risks.push({ level: level, code: code, message: messageText, fix: fix || null });
    }

    if (group === 'cat_tree' && pet === 'dog') add('red', 'cat-tree-dog', 'A cat tree selected for dogs needs a different stability and use assessment.', { pet_type: 'cat' });
    if (use === 'chewing' && ['apparel', 'bedding', 'walking', 'cat_tree'].includes(group)) add('red', 'chew-use-mismatch', 'The selected product is not a chew product. Material, construction and test scope require engineering confirmation.', { intended_use: group === 'bedding' ? 'sleeping' : group === 'apparel' ? 'wearing' : 'other' });
    if (use === 'climbing' && group !== 'cat_tree') add('red', 'climbing-use-mismatch', 'Climbing use requires a purpose-designed structure and cannot be assumed for this product category.', { intended_use: 'other' });
    if (/medical|therapeutic|treat|cure|heal|veterinary/.test(message)) add('red', 'medical-claim', 'Medical or therapeutic claims are not confirmed by this quotation form and require specialist review.', null);
    if (/guaranteed|100% safe|child safe|food grade|fda approved|certified/.test(message)) add('red', 'compliance-claim', 'Safety or compliance claims must be verified for the exact product, material, market and current documents.', null);
    if (['puppy_kitten', 'senior'].includes(age) && ['toy', 'walking', 'cat_tree'].includes(group)) add('amber', 'age-review', 'Age-specific sizing, strength and supervision guidance should be reviewed before sampling.');
    if (size === 'xl' && ['apparel', 'walking', 'travel', 'cat_tree'].includes(group) && !dimensions) add('amber', 'xl-dimensions', 'Extra-large pet projects need actual body or product dimensions before pattern or load review.');
    if (material === 'to_confirm') add('amber', 'material-open', 'Material remains open and will be confirmed against use, target market and price point.');
    if (packaging === 'retail' && !dimensions) add('amber', 'retail-packaging', 'Retail packaging dimensions and labeling space should be confirmed after the product size is fixed.');
    if (!dimensions && ['apparel', 'bedding', 'walking', 'travel', 'cat_tree'].includes(group)) add('amber', 'dimensions-missing', 'Dimensions or a size chart are recommended for an accurate engineering review.');

    var severity = risks.some(function (risk) { return risk.level === 'red'; }) ? 'red'
      : risks.some(function (risk) { return risk.level === 'amber'; }) ? 'amber'
      : 'green';
    return { severity: severity, risks: risks, product_group: group };
  }

  function summarize(fields, assessment) {
    var parts = [
      'Pet: ' + (fields.pet_type || 'not specified'),
      'Size: ' + (fields.pet_size || 'not specified'),
      'Age: ' + (fields.pet_age || 'not specified'),
      'Material: ' + (fields.material_preference || 'not specified'),
      'Use: ' + (fields.intended_use || 'not specified'),
      'Dimensions: ' + (fields.dimensions || 'not specified'),
      'Packaging: ' + (fields.packaging_format || 'not specified'),
      'Risk: ' + assessment.severity.toUpperCase()
    ];
    if (assessment.risks.length) parts.push('Review: ' + assessment.risks.map(function (risk) { return risk.message; }).join(' | '));
    return parts.join('\n');
  }

  function applySafeFix(fields, assessment) {
    var fixed = Object.assign({}, fields);
    assessment.risks.forEach(function (risk) {
      if (!risk.fix) return;
      Object.keys(risk.fix).forEach(function (name) { fixed[name] = risk.fix[name]; });
    });
    return fixed;
  }

  function fingerprint(fields) {
    return JSON.stringify({
      product: fields.product || '', pet_type: fields.pet_type || '', pet_size: fields.pet_size || '',
      pet_age: fields.pet_age || '', material_preference: fields.material_preference || '',
      intended_use: fields.intended_use || '', dimensions: fields.dimensions || '',
      packaging_format: fields.packaging_format || '', message: fields.message || ''
    });
  }

  function canProceed(assessment, acknowledged) {
    return assessment.severity !== 'red' || acknowledged === true;
  }

  return { assess: assess, summarize: summarize, applySafeFix: applySafeFix, fingerprint: fingerprint, canProceed: canProceed, productGroup: productGroup };
});
