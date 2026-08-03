/* Entrol WeChat Floating Button — self-contained, mirrors WhatsApp widget.
   Injects styles, a WeChat float button (above the WhatsApp button), and a
   click-to-show popup with the WeChat ID. No external CSS dependency. */
(function () {
  if (document.getElementById('entrol-wechat-float')) return;

  var WECHAT_ID = '15263130999';

  var css = ''
    + '.entrol-wechat-float{position:fixed;bottom:96px;right:24px;width:60px;height:60px;'
    + 'background:#07C160;border-radius:50%;display:flex;align-items:center;justify-content:center;'
    + 'box-shadow:0 4px 12px rgba(7,193,96,0.4);z-index:9998;text-decoration:none;cursor:pointer;'
    + 'transition:transform .3s ease,box-shadow .3s ease;}'
    + '.entrol-wechat-float:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(7,193,96,0.6);}'
    + '.entrol-wechat-float svg{width:32px;height:32px;}'
    + '.entrol-wechat-float .ew-tooltip{position:absolute;right:72px;top:50%;transform:translateY(-50%);'
    + 'background:#1a1a2e;color:#fff;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:500;'
    + 'white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .3s ease,transform .3s ease;'
    + 'box-shadow:0 2px 8px rgba(0,0,0,.15);}'
    + '.entrol-wechat-float .ew-tooltip::after{content:"";position:absolute;right:-6px;top:50%;'
    + 'transform:translateY(-50%);border:6px solid transparent;border-left-color:#1a1a2e;}'
    + '.entrol-wechat-float:hover .ew-tooltip{opacity:1;transform:translateY(-50%) translateX(-4px);}'
    + '.entrol-wechat-popup{position:fixed;bottom:168px;right:24px;width:240px;background:#fff;'
    + 'border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.18);z-index:9999;padding:18px;'
    + 'display:none;font-family:inherit;}'
    + '.entrol-wechat-popup.open{display:block;}'
    + '.entrol-wechat-popup h4{margin:0 0 6px;font-size:15px;color:#07C160;}'
    + '.entrol-wechat-popup p{margin:0 0 10px;font-size:13px;color:#444;line-height:1.5;}'
    + '.entrol-wechat-popup .ew-id{font-size:18px;font-weight:700;color:#1a1a2e;letter-spacing:1px;}'
    + '.entrol-wechat-popup .ew-close{position:absolute;top:8px;right:12px;cursor:pointer;'
    + 'color:#999;font-size:18px;line-height:1;}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement('div');
  btn.id = 'entrol-wechat-float';
  btn.className = 'entrol-wechat-float';
  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-label', 'WeChat: ' + WECHAT_ID);
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>'
    + '<span class="ew-tooltip">WeChat: ' + WECHAT_ID + '</span>';

  var popup = document.createElement('div');
  popup.className = 'entrol-wechat-popup';
  popup.innerHTML = '<span class="ew-close" aria-label="Close">&times;</span>'
    + '<h4>WeChat</h4>'
    + '<p>Scan or add us on WeChat for fast replies:</p>'
    + '<div class="ew-id">' + WECHAT_ID + '</div>';

  document.body.appendChild(btn);
  document.body.appendChild(popup);

  function openPopup(e) { e.stopPropagation(); popup.classList.add('open'); }
  function closePopup() { popup.classList.remove('open'); }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (popup.classList.contains('open')) { closePopup(); }
    else { openPopup(e); }
  });
  popup.querySelector('.ew-close').addEventListener('click', function (e) { e.stopPropagation(); closePopup(); });
  document.addEventListener('click', function (e) {
    if (!popup.contains(e.target) && e.target !== btn) closePopup();
  });
})();
