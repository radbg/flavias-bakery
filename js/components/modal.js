var FB = window.FB || {};

FB.Modal = (function() {
  var activeModal = null;

  function closeModal() {
    if (!activeModal) return;
    activeModal.classList.remove('open');
    var m = activeModal;
    activeModal = null;
    setTimeout(function() { m.remove(); }, 250);
  }

  function openModal(html, onConfirm, options) {
    options = options || {};
    closeModal();
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true">' +
      '<div class="modal-body">' + html + '</div>' +
      (options.hideFooter ? '' :
        '<div class="modal-footer">' +
          '<button class="btn btn-ghost modal-cancel">' + (options.cancelLabel || 'Cancelar') + '</button>' +
          '<button class="btn btn-primary modal-confirm">' + (options.confirmLabel || 'Guardar') + '</button>' +
        '</div>') +
      '</div>';

    var cancelBtn = overlay.querySelector('.modal-cancel');
    var confirmBtn = overlay.querySelector('.modal-confirm');
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (confirmBtn) confirmBtn.addEventListener('click', function() { if (onConfirm) onConfirm(overlay); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });

    document.body.appendChild(overlay);
    activeModal = overlay;
    requestAnimationFrame(function() { overlay.classList.add('open'); });
    return overlay;
  }

  function confirmDialog(message, onYes, yesLabel, yesClass) {
    yesLabel = yesLabel || 'Eliminar'; yesClass = yesClass || 'btn-danger';
    var overlay = openModal('<p class="modal-confirm-text">' + message + '</p>', null, { hideFooter: true });
    overlay.querySelector('.modal-body').insertAdjacentHTML('beforeend',
      '<div class="modal-footer">' +
        '<button class="btn btn-ghost modal-cancel2">Cancelar</button>' +
        '<button class="btn ' + yesClass + ' modal-yes">' + yesLabel + '</button>' +
      '</div>');
    overlay.querySelector('.modal-cancel2').addEventListener('click', closeModal);
    overlay.querySelector('.modal-yes').addEventListener('click', function() { closeModal(); onYes(); });
  }

  return { open: openModal, close: closeModal, confirm: confirmDialog };
})();

window.FB = FB;
