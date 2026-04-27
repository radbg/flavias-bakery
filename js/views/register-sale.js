var FB = window.FB || {};

FB.RegisterSale = (function() {
  var quantities = {};
  var editingId  = null;

  function nowTime() {
    var d = new Date();
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }

  function updateSummary() {
    var products    = FB.Storage.getProducts();
    var delivery    = parseFloat(document.getElementById('sale-delivery').value)  || 0;
    var discountPct = parseFloat(document.getElementById('sale-discount').value)  || 0;
    var items = Object.keys(quantities).filter(function(id) { return quantities[id] > 0; })
      .map(function(id) { return { productId: id, qty: quantities[id] }; });

    var t = FB.Calc.saleTotals({ items: items, delivery: delivery, discountPct: discountPct }, products);

    document.getElementById('s-revenue').textContent = FB.Calc.fmt(t.revenue);
    document.getElementById('s-cost').textContent    = FB.Calc.fmt(t.cost);
    document.getElementById('s-gross').textContent   = FB.Calc.fmt(t.grossProfit);
    document.getElementById('s-net').textContent     = FB.Calc.fmt(t.net);

    var badge = document.getElementById('discount-badge');
    if (badge) badge.style.display = discountPct > 0 ? 'inline-block' : 'none';
  }

  function changeQty(id, delta) {
    quantities[id] = Math.max(0, (quantities[id] || 0) + delta);
    var row = document.querySelector('.product-row[data-id="' + id + '"]');
    if (!row) return;
    row.classList.toggle('selected', quantities[id] > 0);
    row.querySelector('.counter-qty').textContent = quantities[id];
    row.querySelector('.btn-dec').disabled        = quantities[id] === 0;
    updateSummary();
  }

  function productRowHTML(p) {
    var qty = quantities[p.id] || 0;
    return '<div class="product-row' + (qty > 0 ? ' selected' : '') +
      '" data-id="' + p.id + '" data-name="' + p.name.toLowerCase() + '">' +
      '<div class="product-info"><span class="product-name">' + p.name + '</span>' +
      (p.isSpecial ? '<span class="badge badge-pink">' + p.specialLabel + '</span>' : '') +
      '<span class="product-price">' + FB.Calc.fmt(p.price) + '</span></div>' +
      '<div class="product-counter">' +
        '<button class="counter-btn btn-dec"' + (qty === 0 ? ' disabled' : '') + '>−</button>' +
        '<span class="counter-qty">' + qty + '</span>' +
        '<button class="counter-btn btn-inc">+</button>' +
      '</div></div>';
  }

  function renderProductList() {
    var products = FB.Storage.getProducts();
    var active   = products.filter(function(p) { return p.active; });
    var regular  = active.filter(function(p) { return !p.isSpecial; });
    var specials = active.filter(function(p) { return p.isSpecial; });
    var categories = regular.reduce(function(acc, p) {
      if (acc.indexOf(p.category) === -1) acc.push(p.category); return acc;
    }, []);

    var html = categories.map(function(cat) {
      var catProds = regular.filter(function(p) { return p.category === cat; });
      return '<div class="category-section"><div class="category-header">' + cat + '</div>' +
        catProds.map(productRowHTML).join('') + '</div>';
    }).join('');

    if (specials.length) {
      html += '<div class="category-section"><div class="category-header special-header">✨ Temporada especial</div>' +
        specials.map(productRowHTML).join('') + '</div>';
    }

    var list = document.getElementById('products-list');
    list.innerHTML = html || '<p class="empty-msg">No hay productos activos.</p>';

    list.querySelectorAll('.product-row').forEach(function(row) {
      row.querySelector('.btn-dec').addEventListener('click', function() { changeQty(row.dataset.id, -1); });
      row.querySelector('.btn-inc').addEventListener('click', function() { changeQty(row.dataset.id, 1); });
    });
  }

  function loadForEdit(sale) {
    editingId  = sale.id;
    quantities = {};
    sale.items.forEach(function(item) { quantities[item.productId] = item.qty; });
    document.getElementById('sale-date').value     = sale.date;
    document.getElementById('sale-time').value     = sale.time || '00:00';
    document.getElementById('sale-delivery').value = sale.delivery    || 0;
    document.getElementById('sale-discount').value = sale.discountPct || 0;
    document.getElementById('sale-notes').value    = sale.notes       || '';
    renderProductList();
    updateSummary();
    FB.Toast.show('Venta cargada para editar', 'info');
  }

  function saveSale() {
    var productMap = {};
    FB.Storage.getProducts().forEach(function(p) { productMap[p.id] = p; });

    var items = Object.keys(quantities).filter(function(id) { return quantities[id] > 0; })
      .map(function(id) {
        var p = productMap[id];
        return {
          productId: id,
          qty:       Number(quantities[id]),
          unitPrice: p ? p.price : 0,   // snapshot del precio actual
          unitCost:  p ? p.cost  : 0    // snapshot del costo actual
        };
      });
    if (!items.length) { FB.Toast.show('Agrega al menos un producto', 'error'); return; }

    var date        = document.getElementById('sale-date').value;
    var time        = document.getElementById('sale-time').value;
    var delivery    = parseFloat(document.getElementById('sale-delivery').value)  || 0;
    var discountPct = parseFloat(document.getElementById('sale-discount').value)  || 0;
    var notes       = document.getElementById('sale-notes').value.trim();

    var saleData = { date: date, time: time, items: items, delivery: delivery, discountPct: discountPct, notes: notes };

    if (editingId) {
      FB.Storage.updateSale(editingId, saleData);
      FB.Toast.show('¡Venta actualizada! ✅');
    } else {
      FB.Storage.addSale(saleData);
      FB.Toast.show('¡Venta guardada! 🎉');
    }

    quantities = {}; editingId = null;
    FB.RegisterSale.render(document.getElementById('main-content'));
  }

  return {
    render: function(container, params) {
      params     = params || {};
      quantities = {};
      editingId  = null;

      var todayStr = FB.Calc.today();

      container.innerHTML =
        '<div class="view-header"><h2 class="view-title">Registrar Venta</h2></div>' +

        '<div class="form-row">' +
          '<div class="form-section"><label class="form-label">Fecha</label>' +
            '<input type="date" id="sale-date" class="form-input" value="' + todayStr + '"></div>' +
          '<div class="form-section"><label class="form-label">Hora</label>' +
            '<input type="time" id="sale-time" class="form-input" value="' + nowTime() + '"></div>' +
        '</div>' +

        '<div class="form-section"><input type="search" id="product-search" class="form-input" placeholder="🔍 Buscar producto..."></div>' +

        '<div id="products-list"></div>' +

        '<div class="form-row">' +
          '<div class="form-section"><label class="form-label">Delivery $</label>' +
            '<input type="number" id="sale-delivery" class="form-input" min="0" step="0.01" value="0" placeholder="0.00"></div>' +
          '<div class="form-section"><label class="form-label">Descuento % <span id="discount-badge" class="badge badge-pink" style="display:none">Promo activa</span></label>' +
            '<input type="number" id="sale-discount" class="form-input" min="0" max="100" step="1" value="0" placeholder="0"></div>' +
        '</div>' +

        '<div class="form-section"><label class="form-label">Notas</label>' +
          '<textarea id="sale-notes" class="form-input" rows="2" placeholder="Opcional..."></textarea></div>' +

        '<div class="sale-summary">' +
          '<div class="summary-row"><span>Ingreso</span><span id="s-revenue">$0.00</span></div>' +
          '<div class="summary-row"><span>Costo</span><span id="s-cost">$0.00</span></div>' +
          '<div class="summary-row"><span>Ganancia bruta</span><span id="s-gross">$0.00</span></div>' +
          '<div class="summary-row summary-net"><span>Neto (+ delivery)</span><span id="s-net">$0.00</span></div>' +
        '</div>' +

        '<button class="btn btn-primary btn-full btn-xl" id="save-sale-btn">GUARDAR VENTA</button>';

      renderProductList();

      // Si viene de historial con editSaleId
      if (params.editSaleId) {
        var sale = FB.Storage.getSales().find(function(s) { return s.id === params.editSaleId; });
        if (sale) loadForEdit(sale);
      }

      document.getElementById('product-search').addEventListener('input', function(e) {
        var q = e.target.value.toLowerCase();
        document.querySelectorAll('.product-row').forEach(function(row) {
          row.style.display = (row.dataset.name || '').includes(q) ? '' : 'none';
        });
        document.querySelectorAll('.category-section').forEach(function(section) {
          var visible = Array.from(section.querySelectorAll('.product-row')).some(function(r) { return r.style.display !== 'none'; });
          section.style.display = visible ? '' : 'none';
        });
      });

      document.getElementById('sale-delivery').addEventListener('input', updateSummary);
      document.getElementById('sale-discount').addEventListener('input', updateSummary);
      document.getElementById('save-sale-btn').addEventListener('click', saveSale);
    },

    loadForEdit: loadForEdit
  };
})();

window.FB = FB;
