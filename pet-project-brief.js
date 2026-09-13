(function () {
  'use strict';
  var validator = window.EntrolPetProjectValidator;
  if (!validator) return;

  var FIELD_OPTIONS = {
    pet_type: [['', 'Pet type *'], ['dog', 'Dog'], ['cat', 'Cat'], ['both', 'Dog and cat'], ['other', 'Other / confirm later']],
    pet_size: [['', 'Pet size *'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['xl', 'Extra large'], ['mixed', 'Mixed size range']],
    pet_age: [['', 'Pet age *'], ['puppy_kitten', 'Puppy / kitten'], ['adult', 'Adult'], ['senior', 'Senior'], ['mixed', 'Mixed ages']],
    material_preference: [['', 'Material preference *'], ['textile', 'Textile / knit'], ['plush', 'Plush'], ['rope', 'Rope / webbing'], ['rubber', 'Rubber / TPR'], ['wood', 'Wood / board'], ['metal', 'Metal components'], ['mixed', 'Mixed materials'], ['to_confirm', 'Recommend after review']],
    intended_use: [['', 'Primary use *'], ['wearing', 'Wearing'], ['sleeping', 'Sleeping / resting'], ['playing', 'Interactive play'], ['chewing', 'Chewing'], ['climbing', 'Climbing / scratching'], ['walking', 'Walking / restraint'], ['travel', 'Travel'], ['feeding', 'Feeding'], ['grooming', 'Grooming'], ['other', 'Other / confirm later']],
    packaging_format: [['', 'Packaging *'], ['retail', 'Retail-ready'], ['ecommerce', 'E-commerce shipping'], ['bulk', 'Bulk / master carton'], ['custom', 'Custom packaging'], ['to_confirm', 'Recommend after review']]
  };

  function productValue(form) {
    var field = form.querySelector('[name="product"], [name="product_interest"], [name="product-interest"], [name="product_type"]');
    return field ? field.value : '';
  }

  function values(form) {
    var result = { product: productValue(form), message: (form.querySelector('[name="message"]') || {}).value || '' };
    Object.keys(FIELD_OPTIONS).forEach(function (name) {
      var field = form.querySelector('[name="' + name + '"]');
      result[name] = field ? field.value : '';
    });
    var dimensions = form.querySelector('[name="dimensions"]');
    result.dimensions = dimensions ? dimensions.value : '';
    return result;
  }

  function select(name, label) {
    var element = document.createElement('select');
    element.name = name;
    element.required = true;
    element.setAttribute('aria-label', label);
    FIELD_OPTIONS[name].forEach(function (option) {
      var node = document.createElement('option');
      node.value = option[0];
      node.textContent = option[1];
      if (!option[0]) { node.disabled = true; node.selected = true; }
      element.appendChild(node);
    });
    return element;
  }

  function update(form) {
    var panel = form.querySelector('.pet-project-brief');
    if (!panel) return;
    var currentValues = values(form);
    var assessment = validator.assess(currentValues);
    var risk = panel.querySelector('.pet-project-risk');
    risk.className = 'pet-project-risk risk-' + assessment.severity;
    risk.textContent = assessment.severity === 'green'
      ? 'Green — no obvious combination conflict. Final specifications still require confirmation.'
      : assessment.severity === 'amber'
        ? 'Amber — review recommended: ' + assessment.risks.map(function (item) { return item.message; }).join(' ')
        : 'Red — engineering confirmation required: ' + assessment.risks.filter(function (item) { return item.level === 'red'; }).map(function (item) { return item.message; }).join(' ');
    var fix = panel.querySelector('.pet-project-fix');
    fix.hidden = !assessment.risks.some(function (item) { return Boolean(item.fix); });
    var acknowledgment = panel.querySelector('.pet-risk-ack');
    var acknowledgmentWrap = panel.querySelector('.pet-risk-ack-wrap');
    var fingerprint = validator.fingerprint(currentValues);
    if (panel.dataset.riskFingerprint !== fingerprint) acknowledgment.checked = false;
    panel.dataset.riskFingerprint = fingerprint;
    acknowledgmentWrap.hidden = assessment.severity !== 'red';
    panel.dataset.risk = assessment.severity;
    var summary = form.querySelector('[name="pet_project_summary"]');
    summary.value = validator.summarize(currentValues, assessment);
  }

  function enhance(form) {
    if (form.dataset.petBriefReady === 'true' || form.classList.contains('catalog-form') || form.querySelector('[name="catalog_request"]')) return;
    form.dataset.petBriefReady = 'true';
    var panel = document.createElement('fieldset');
    panel.className = 'pet-project-brief';
    var legend = document.createElement('legend');
    legend.textContent = 'Pet project brief';
    panel.appendChild(legend);
    var help = document.createElement('p');
    help.className = 'pet-project-help';
    help.textContent = 'These details improve sizing and engineering review. They do not constitute medical, safety or regulatory approval.';
    panel.appendChild(help);
    var grid = document.createElement('div');
    grid.className = 'pet-project-grid';
    Object.keys(FIELD_OPTIONS).forEach(function (name) { grid.appendChild(select(name, FIELD_OPTIONS[name][0][1])); });
    var dimensions = document.createElement('input');
    dimensions.name = 'dimensions';
    dimensions.placeholder = 'Dimensions / size chart (recommended)';
    dimensions.setAttribute('aria-label', 'Dimensions or size chart');
    grid.appendChild(dimensions);
    panel.appendChild(grid);
    var risk = document.createElement('p');
    risk.className = 'pet-project-risk';
    risk.setAttribute('role', 'status');
    risk.setAttribute('aria-live', 'polite');
    risk.setAttribute('tabindex', '-1');
    panel.appendChild(risk);
    var fix = document.createElement('button');
    fix.type = 'button';
    fix.className = 'pet-project-fix';
    fix.textContent = 'Apply compatible use';
    fix.addEventListener('click', function () {
      var current = values(form);
      var fixed = validator.applySafeFix(current, validator.assess(current));
      Object.keys(fixed).forEach(function (name) {
        var field = form.querySelector('[name="' + name + '"]');
        if (field && fixed[name] !== current[name]) field.value = fixed[name];
      });
      update(form);
    });
    panel.appendChild(fix);
    var ackWrap = document.createElement('div');
    ackWrap.className = 'pet-risk-ack-wrap';
    ackWrap.hidden = true;
    var ack = document.createElement('input');
    ack.type = 'checkbox';
    ack.className = 'pet-risk-ack';
    ack.id = 'pet-risk-ack-' + Math.random().toString(36).slice(2);
    ack.name = 'engineering_confirmation_acknowledged';
    ack.value = 'yes';
    ackWrap.appendChild(ack);
    var ackLabel = document.createElement('label');
    ackLabel.htmlFor = ack.id;
    ackLabel.textContent = 'I understand this combination requires engineering confirmation before sampling or production.';
    ackWrap.appendChild(ackLabel);
    panel.appendChild(ackWrap);
    var summary = document.createElement('input');
    summary.type = 'hidden';
    summary.name = 'pet_project_summary';
    panel.appendChild(summary);
    var submit = form.querySelector('button[type="submit"], input[type="submit"]');
    form.insertBefore(panel, submit || null);
    form.addEventListener('input', function (event) { if (!event.target.classList.contains('pet-risk-ack')) update(form); });
    form.addEventListener('change', function (event) { if (!event.target.classList.contains('pet-risk-ack')) update(form); });
    update(form);
  }

  function canSubmit(form) {
    var panel = form.querySelector('.pet-project-brief');
    if (!panel) return true;
    update(form);
    if (!validator.canProceed({ severity: panel.dataset.risk }, panel.querySelector('.pet-risk-ack').checked)) {
      var risk = panel.querySelector('.pet-project-risk');
      risk.textContent += ' Check the acknowledgment before submitting.';
      risk.focus();
      return false;
    }
    return true;
  }

  window.EntrolPetProjectBrief = { enhance: enhance, update: update, canSubmit: canSubmit, values: values };
  document.querySelectorAll('form[data-entrol-lead="true"], form[onsubmit*="submitInquiry"]').forEach(enhance);
})();
