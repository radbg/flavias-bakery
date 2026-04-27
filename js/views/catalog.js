var FB = window.FB || {};

FB.Catalog = (function() {
  var CATEGORIES = ['Galletas','Minis','Brownies','Marquesas','Galletas Rellenas',
    'Postres','Tortas','Saludables','Boxes','Kits','Temporada'];
  var activeTab   = 'active';
  var searchQuery = '';

  function refreshList() {
    var all      = FB.Storage.getProducts();
    var products = all.filter(function(p) {
      var tabMatch = activeTab === 'active' ? p.active : !p.active;
      var q = searchQuery.trim().toLowerCase();
      var searchMatch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return tabMatch && searchMatch;
    });
    var list = document.getElementById('catalog-list');
    if (!list) return;

    if (!products.length) {
      var emptyMsg = searchQuery
        ? 'Sin resultados para "' + searchQuery + '"'
        : 'No hay productos ' + (activeTab === 'active' ? 'activos' : 'archivados');
      list.innerHTML = '<div class="empty-state"><p>' + emptyMsg + '</p></div>';
      return;
    }

    var categories = products.reduce(function(acc, p) {
      if (acc.indexOf(p.category) === -1) acc.push(p.category); return acc;
    }, []);

    list.innerHTML = categories.map(function(cat) {
      var catProds = products.filter(function(p) { return p.category === cat; });
      return '<div class="category-section"><div class="category-header">' + cat + '</div>' +
        catProds.map(productCardHTML).join('') + '</div>';
    }).join('');

    list.querySelectorAll('[data-action]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = btn.dataset.id, action = btn.dataset.action;
        if (action === 'edit')    openProductForm(id);
        if (action === 'archive') toggleArchive(id);
        if (action === 'delete')  tryDelete(id);
      });
    });
  }

  function productCardHTML(p) {
    var m = FB.Calc.margin(p.cost, p.price);
    var marginClass = m >= 40 ? 'badge-mint' : m >= 20 ? 'badge-purple' : 'badge-pink';
    return '<div class="product-card">' +
      '<div class="product-card-main">' +
        '<div><span class="product-name">' + p.name + '</span>' +
          (p.isSpecial ? ' <span class="badge badge-pink">' + p.specialLabel + '</span>' : '') + '</div>' +
        '<div class="product-card-prices">' +
          '<span class="price-label">Costo: ' + FB.Calc.fmt(p.cost) + '</span>' +
          '<span class="price-arrow">→</span>' +
          '<span class="price-label">Precio: ' + FB.Calc.fmt(p.price) + '</span>' +
          '<span class="badge ' + marginClass + '">' + FB.Calc.fmtPct(m) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="product-card-actions">' +
        '<button class="btn btn-sm btn-outline" data-action="edit"    data-id="' + p.id + '">Editar</button>' +
        '<button class="btn btn-sm btn-ghost"   data-action="archive" data-id="' + p.id + '">' + (p.active ? 'Archivar' : 'Activar') + '</button>' +
        (!p.active ? '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + p.id + '">Eliminar</button>' : '') +
      '</div></div>';
  }

  function openProductForm(id) {
    var p = id ? FB.Storage.getProducts().find(function(x) { return x.id === id; }) : null;

    var catOptions = CATEGORIES.map(function(c) {
      return '<option' + (p && p.category === c ? ' selected' : '') + '>' + c + '</option>';
    }).join('');

    var html =
      '<h3 class="modal-title">' + (p ? 'Editar producto' : 'Nuevo producto') + '</h3>' +
      '<div class="form-section"><label class="form-label">Nombre *</label>' +
        '<input id="pf-name" class="form-input" value="' + (p ? p.name : '') + '" placeholder="Nombre del producto"></div>' +
      '<div class="form-section"><label class="form-label">Categoría</label>' +
        '<select id="pf-cat" class="form-input">' + catOptions + '</select></div>' +
      '<div class="form-row">' +
        '<div class="form-section"><label class="form-label">Costo $</label>' +
          '<input id="pf-cost" type="number" class="form-input" step="0.01" min="0" value="' + (p ? p.cost : '') + '" placeholder="0.00"></div>' +
        '<div class="form-section"><label class="form-label">Precio $</label>' +
          '<input id="pf-price" type="number" class="form-input" step="0.01" min="0" value="' + (p ? p.price : '') + '" placeholder="0.00"></div>' +
      '</div>' +
      '<div class="margin-preview" id="pf-margin">Margen: —</div>' +
      '<div class="form-section"><label class="form-label checkbox-label">' +
        '<input type="checkbox" id="pf-special"' + (p && p.isSpecial ? ' checked' : '') + '> Producto de temporada especial</label></div>' +
      '<div class="form-section" id="pf-label-wrap" style="' + (p && p.isSpecial ? '' : 'display:none') + '">' +
        '<label class="form-label">Etiqueta de temporada</label>' +
        '<input id="pf-label" class="form-input" value="' + (p ? (p.specialLabel || '') : '') + '" placeholder="ej: San Valentín"></div>';

    var overlay = FB.Modal.open(html, function(ov) { saveProduct(ov, id); },
      { confirmLabel: p ? 'Guardar cambios' : 'Crear producto' });

    function updateMarginPreview() {
      var cost  = parseFloat(overlay.querySelector('#pf-cost').value)  || 0;
      var price = parseFloat(overlay.querySelector('#pf-price').value) || 0;
      var m     = price > 0 ? FB.Calc.margin(cost, price) : 0;
      var el    = overlay.querySelector('#pf-margin');
      el.textContent = 'Margen: ' + FB.Calc.fmtPct(m);
      el.style.color = m >= 40 ? '#1a8c52' : m >= 20 ? 'var(--purple)' : 'var(--pink)';
    }

    overlay.querySelector('#pf-cost').addEventListener('input',  updateMarginPreview);
    overlay.querySelector('#pf-price').addEventListener('input', updateMarginPreview);
    overlay.querySelector('#pf-special').addEventListener('change', function(e) {
      overlay.querySelector('#pf-label-wrap').style.display = e.target.checked ? '' : 'none';
    });

    if (p) updateMarginPreview();
  }

  function saveProduct(overlay, id) {
    var name     = overlay.querySelector('#pf-name').value.trim();
    var category = overlay.querySelector('#pf-cat').value;
    var cost     = parseFloat(overlay.querySelector('#pf-cost').value);
    var price    = parseFloat(overlay.querySelector('#pf-price').value);
    var isSpecial    = overlay.querySelector('#pf-special').checked;
    var specialLabel = overlay.querySelector('#pf-label').value.trim();

    if (!name || isNaN(cost) || isNaN(price) || price <= 0) {
      FB.Toast.show('Completa nombre, costo y precio', 'error'); return;
    }

    var data = { name: name, category: category, cost: cost, price: price, isSpecial: isSpecial, specialLabel: specialLabel };

    if (id) { FB.Storage.updateProduct(id, data); FB.Toast.show('Producto actualizado'); }
    else    { FB.Storage.addProduct(data);         FB.Toast.show('Producto creado ✅'); }

    FB.Modal.close();
    refreshList();
  }

  function toggleArchive(id) {
    var p = FB.Storage.getProducts().find(function(x) { return x.id === id; });
    if (!p) return;
    FB.Storage.updateProduct(id, { active: !p.active });
    FB.Toast.show(p.active ? 'Producto archivado' : 'Producto activado');
    refreshList();
  }

  function tryDelete(id) {
    var ok = FB.Storage.deleteProduct(id);
    if (!ok) {
      FB.Toast.show('Tiene ventas registradas — solo puedes archivarlo.', 'error', 4000);
      return;
    }
    FB.Modal.confirm('¿Eliminar este producto permanentemente? No se puede deshacer.', function() {
      FB.Toast.show('Producto eliminado');
      refreshList();
    });
  }

  return {
    render: function(container) {
      container.innerHTML =
        '<div class="view-header">' +
          '<h2 class="view-title">Catálogo</h2>' +
          '<button class="btn btn-primary btn-sm" id="new-product-btn">+ Nuevo</button>' +
        '</div>' +
        '<div class="tabs">' +
          '<button class="tab' + (activeTab === 'active'   ? ' active' : '') + '" data-tab="active">Activos</button>' +
          '<button class="tab' + (activeTab === 'archived' ? ' active' : '') + '" data-tab="archived">Archivados</button>' +
        '</div>' +
        '<div class="form-section" style="margin-bottom:4px">' +
          '<input type="search" id="catalog-search" class="form-input" placeholder="🔍 Buscar por nombre o categoría...">' +
        '</div>' +
        '<div id="catalog-list"></div>';

      document.querySelectorAll('.tab').forEach(function(t) {
        t.addEventListener('click', function() {
          activeTab = t.dataset.tab;
          document.querySelectorAll('.tab').forEach(function(x) { x.classList.remove('active'); });
          t.classList.add('active');
          refreshList();
        });
      });

      document.getElementById('catalog-search').addEventListener('input', function(e) {
        searchQuery = e.target.value;
        refreshList();
      });

      document.getElementById('new-product-btn').addEventListener('click', function() { openProductForm(null); });
      searchQuery = '';
      refreshList();
    }
  };
})();

window.FB = FB;
