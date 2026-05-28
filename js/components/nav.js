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
        '<button data-view="monthly-report">📈 Resumen mensual</button>' +
        '<div class="more-divider"></div>' +
        '<button data-action="export">📤 Exportar datos</button>' +
        '<button data-action="import">📥 Importar datos</button>';

      // input oculto para seleccionar archivo JSON
      var fileInput = document.createElement('input');
      fileInput.type    = 'file';
      fileInput.accept  = '.json';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      document.body.appendChild(menu);

      // Navegación normal
      menu.querySelectorAll('button[data-view]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          fileInput.remove();
          menu.remove();
          navigate(btn.dataset.view);
        });
      });

      // Exportar
      menu.querySelector('[data-action="export"]').addEventListener('click', function() {
        menu.remove();
        fileInput.remove();
        FB.Storage.exportBackup();
        FB.Toast.show('Datos exportados ✅');
      });

      // Importar
      menu.querySelector('[data-action="import"]').addEventListener('click', function() {
        menu.remove();
        fileInput.click();
      });

      fileInput.addEventListener('change', function() {
        if (!fileInput.files.length) { fileInput.remove(); return; }
        FB.Storage.importBackup(
          fileInput.files[0],
          function() {
            fileInput.remove();
            FB.Toast.show('Datos importados ✅ Recargando...');
            setTimeout(function() { window.location.reload(); }, 1200);
          },
          function(msg) {
            fileInput.remove();
            FB.Toast.show('Error al importar: ' + msg, 'error');
          }
        );
      });

      // Cerrar al tocar afuera
      setTimeout(function() {
        document.addEventListener('click', function close(ev) {
          if (!menu.contains(ev.target)) {
            menu.remove();
            fileInput.remove();
            document.removeEventListener('click', close);
          }
        });
      }, 50);
    }
  };
})();

window.FB = FB;
