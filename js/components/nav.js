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
        '<button data-action="link">🔗 Vincular dispositivo</button>' +
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

      // Vincular dispositivo
      menu.querySelector('[data-action="link"]').addEventListener('click', function() {
        menu.remove();
        fileInput.remove();
        var myId = localStorage.getItem('fb_bakery_id') || '(sin código aún)';
        FB.Modal.open(
          '<h3 class="modal-title">🔗 Vincular dispositivo</h3>' +
          '<p style="font-size:14px;color:var(--text-light);margin-bottom:16px">Para sincronizar datos entre dispositivos, usá el mismo código en ambos.</p>' +
          '<p style="font-size:12px;font-weight:600;color:var(--text-light);margin-bottom:6px">TU CÓDIGO</p>' +
          '<div class="link-code-box" id="link-code-display">' + myId + '</div>' +
          '<button class="btn btn-outline btn-full" id="copy-code-btn" style="margin-bottom:20px">Copiar código</button>' +
          '<p style="font-size:12px;font-weight:600;color:var(--text-light);margin-bottom:6px">CONECTAR CON OTRO CÓDIGO</p>' +
          '<input type="text" id="link-code-input" class="form-input" placeholder="Pegá el código del otro dispositivo">' +
          '<div class="modal-footer">' +
            '<button class="btn btn-ghost" id="link-cancel">Cancelar</button>' +
            '<button class="btn btn-primary" id="link-connect">Conectar</button>' +
          '</div>',
          null, { hideFooter: true }
        );
        document.getElementById('copy-code-btn').addEventListener('click', function() {
          navigator.clipboard.writeText(myId).then(function() {
            FB.Toast.show('Código copiado ✅');
          }).catch(function() {
            FB.Toast.show('Copiá manualmente: ' + myId);
          });
        });
        document.getElementById('link-cancel').addEventListener('click', function() { FB.Modal.close(); });
        document.getElementById('link-connect').addEventListener('click', function() {
          var newId = document.getElementById('link-code-input').value.trim();
          if (!newId || newId.length < 10) { FB.Toast.show('Código inválido', 'error'); return; }
          FB.Modal.confirm(
            '¿Reemplazar datos con los del otro dispositivo?',
            function() {
              localStorage.setItem('fb_bakery_id', newId);
              FB.Toast.show('Vinculando... recargando');
              setTimeout(function() { window.location.reload(); }, 800);
            }
          );
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
