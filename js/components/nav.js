var FB = window.FB || {};

FB.Nav = (function() {
  var NAV_ITEMS = [
    { id: 'dashboard', icon: '📊', label: 'Inicio' },
    { id: 'register',  icon: '🧾', label: 'Venta' },
    { id: 'history',   icon: '📅', label: 'Historial' },
    { id: 'catalog',   icon: '📦', label: 'Catálogo' },
    { id: 'more',      icon: '•••', label: 'Más' }
  ];

  return {
    render: function(activeId, navigate) {
      var nav = document.getElementById('bottom-nav');
      if (!nav) return;
      nav.innerHTML = NAV_ITEMS.map(function(item) {
        return '<button class="nav-item' + (item.id === activeId ? ' active' : '') +
          '" data-view="' + item.id + '" aria-label="' + item.label + '">' +
          '<span class="nav-icon">' + item.icon + '</span>' +
          '<span class="nav-label">' + item.label + '</span></button>';
      }).join('');

      nav.querySelectorAll('.nav-item').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var view = btn.dataset.view;
          if (view === 'more') FB.Nav.toggleMoreMenu(navigate);
          else navigate(view);
        });
      });
    },

    toggleMoreMenu: function(navigate) {
      var existing = document.getElementById('more-menu');
      if (existing) { existing.remove(); return; }
      var menu = document.createElement('div');
      menu.id = 'more-menu';
      menu.innerHTML =
        '<button data-view="expenses">💸 Gastos extras</button>' +
        '<button data-view="monthly-report">📈 Resumen mensual</button>';
      document.body.appendChild(menu);
      menu.querySelectorAll('button').forEach(function(btn) {
        btn.addEventListener('click', function() { menu.remove(); navigate(btn.dataset.view); });
      });
      setTimeout(function() {
        document.addEventListener('click', function() { menu.remove(); }, { once: true });
      }, 50);
    }
  };
})();

window.FB = FB;
