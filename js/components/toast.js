var FB = window.FB || {};

FB.Toast = (function() {
  var container;
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }
  return {
    show: function(message, type, duration) {
      type = type || 'success'; duration = duration || 3000;
      var c = getContainer();
      var toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      toast.textContent = message;
      c.appendChild(toast);
      requestAnimationFrame(function() { toast.classList.add('show'); });
      setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
      }, duration);
    }
  };
})();

window.FB = FB;
