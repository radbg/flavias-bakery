var FB = window.FB || {};

FB.RegisterSale = (function() {
  var quantities = {};
  var discounts  = {};   // descuento % por producto (solo productos en promoción)
  var editingId  = null;

  function nowTime() {
    var d = new Date();
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }

  function buildItems() {
    return Object.keys(quantities).filter(function(id) { return quantities[id] > 0; })
      .map(function(id) {
        return { productId: id, qty: quantities[id], discountPct: Number(discounts[id]) || 0 };
      });
  }

  function updateSummary() {
    var products = FB.Storage.getProducts();
    var delivery = parseFloat(document.getElementById('sale-delivery').value) || 0;
    var items    = buildItems();

    var t = FB.Calc.saleTotals({ items: items, delivery: delivery }, products);

    document.getElementById('s-revenue').textContent  = FB.Calc.fmt(t.revenue);
    document.getElementById('s-cost').textContent     = FB.Calc.fmt(t.cost);
    document.getElementById('s-delivery').textContent = FB.Calc.fmt(t.delivery);
    document.getElementById('s-total').textContent    = FB.Calc.fmt(t.total);
    document.getElementById('s-net').textContent      = FB.Calc.fmt(t.net);

    // Actualizar totales en el panel de pago mixto (lo que cobra el cliente = ingreso + delivery)
    updateSplitDisplay(t.total);
  }

  function updateSplitDisplay(total) {
    var panel = document.getElementById('split-payment');
    if (!panel || panel.style.display === 'none') return;
    document.getElementById('split-total').textContent = FB.Calc.fmt(total);
  }

  function changeQty(id, delta) {
    quantities[id] = Math.max(0, (quantities[id] || 0) + delta);
    var row = document.querySelector('.product-row[data-id="' + id + '"]');
    if (!row) return;
    var active = quantities[id] > 0;
    row.classList.toggle('selected', active);
    row.querySelector('.counter-qty').textContent = quantities[id];
    row.querySelector('.btn-dec').disabled        = quantities[id] === 0;

    // Mostrar/ocultar la fila de descuento promo; al deseleccionar, limpiar el descuento
    var discRow = row.querySelector('.product-discount-row');
    if (discRow) discRow.style.display = active ? 'flex' : 'none';
    if (!active) {
      delete discounts[id];
      var discInput = row.querySelector('.pd-input');
      if (discInput) discInput.value = '';
    }
    updateSummary();
  }

  function productRowHTML(p) {
    var qty  = quantities[p.id] || 0;
    var disc = discounts[p.id] || '';
    return '<div class="product-row' + (qty > 0 ? ' selected' : '') +
      '" data-id="' + p.id + '" data-name="' + p.name.toLowerCase() + '">' +
      '<div class="product-row-main">' +
        '<div class="product-info"><span class="product-name">' + p.name + '</span>' +
        (p.isSpecial ? '<span class="badge badge-pink">' + p.specialLabel + '</span>' : '') +
        '<span class="product-price">' + FB.Calc.fmt(p.price) + '</span></div>' +
        '<div class="product-counter">' +
          '<button class="counter-btn btn-dec"' + (qty === 0 ? ' disabled' : '') + '>−</button>' +
          '<span class="counter-qty">' + qty + '</span>' +
          '<button class="counter-btn btn-inc">+</button>' +
        '</div>' +
      '</div>' +
      '<div class="product-discount-row" style="display:' + (qty > 0 ? 'flex' : 'none') + '">' +
        '<span class="pd-label">🏷️ Descuento promo</span>' +
        '<div class="pd-input-wrap">' +
          '<input type="number" class="pd-input" data-disc-id="' + p.id + '" min="0" max="100" step="1" value="' + disc + '" placeholder="0">' +
          '<span class="pd-pct">%</span>' +
        '</div>' +
      '</div>' +
    '</div>';
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
      var discInput = row.querySelector('.pd-input');
      if (discInput) {
        discInput.addEventListener('input', function() {
          var id  = discInput.dataset.discId;
          var val = Math.min(100, Math.max(0, parseFloat(discInput.value) || 0));
          if (val > 0) discounts[id] = val; else delete discounts[id];
          updateSummary();
        });
      }
    });
  }

  function loadForEdit(sale) {
    editingId  = sale.id;
    quantities = {};
    discounts  = {};
    (sale.items || []).forEach(function(item) {
      quantities[item.productId] = item.qty;
      if (Number(item.discountPct) > 0) discounts[item.productId] = Number(item.discountPct);
    });
    document.getElementById('sale-date').value     = sale.date;
    document.getElementById('sale-time').value     = sale.time || '00:00';
    document.getElementById('sale-delivery').value = sale.delivery    || 0;
    document.getElementById('sale-notes').value    = sale.notes       || '';

    // Restaurar forma de pago
    var pm = sale.paymentMethod || 'efectivo';
    document.querySelectorAll('.payment-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.method === pm);
    });
    if (pm === 'mixto') {
      document.getElementById('split-payment').style.display = 'block';
      document.getElementById('split-cash').value  = sale.cashAmount  || 0;
      document.getElementById('split-movil').value = sale.movilAmount || 0;
    }

    renderProductList();
    updateSummary();
    FB.Toast.show('Venta cargada para editar', 'info');
  }

  function getPaymentMethod() {
    var active = document.querySelector('.payment-btn.active');
    return active ? active.dataset.method : 'efectivo';
  }

  function saveSale() {
    var productMap = {};
    FB.Storage.getProducts().forEach(function(p) { productMap[p.id] = p; });

    var items = Object.keys(quantities).filter(function(id) { return quantities[id] > 0; })
      .map(function(id) {
        var p = productMap[id];
        return {
          productId:   id,
          qty:         Number(quantities[id]),
          unitPrice:   p ? p.price : 0,
          unitCost:    p ? p.cost  : 0,
          discountPct: Number(discounts[id]) || 0
        };
      });
    if (!items.length) { FB.Toast.show('Agrega al menos un producto', 'error'); return; }

    var date          = document.getElementById('sale-date').value;
    var time          = document.getElementById('sale-time').value;
    var delivery      = parseFloat(document.getElementById('sale-delivery').value)  || 0;
    var notes         = document.getElementById('sale-notes').value.trim();
    var paymentMethod = getPaymentMethod();
    var cashAmount    = paymentMethod === 'mixto'
      ? (parseFloat(document.getElementById('split-cash').value) || 0)
      : null;
    var movilAmount   = paymentMethod === 'mixto'
      ? (parseFloat(document.getElementById('split-movil').value) || 0)
      : null;

    var saleData = {
      date: date, time: time, items: items,
      delivery: delivery, discountPct: 0,
      notes: notes, paymentMethod: paymentMethod,
      cashAmount: cashAmount, movilAmount: movilAmount
    };

    if (editingId) {
      FB.Storage.updateSale(editingId, saleData);
      quantities = {}; discounts = {}; editingId = null;
      FB.Toast.show('¡Venta actualizada! ✅');
      // Volver al historial para que el usuario vea la venta actualizada
      if (window.FB && FB.App) {
        FB.App.navigate('history');
      }
    } else {
      FB.Storage.addSale(saleData);
      FB.Toast.show('¡Venta guardada! 🎉');
      quantities = {}; discounts = {}; editingId = null;
      FB.RegisterSale.render(document.getElementById('main-content'));
    }
  }

  return {
    render: function(container, params) {
      params     = params || {};
      quantities = {};
      discounts  = {};
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

        '<div class="form-section"><label class="form-label">Forma de pago</label>' +
          '<div class="payment-methods">' +
            '<button class="payment-btn active" data-method="efectivo">💵<br>Efectivo</button>' +
            '<button class="payment-btn" data-method="pago-movil">📱<br>Pago Móvil</button>' +
            '<button class="payment-btn" data-method="zelle">🏦<br>Zelle</button>' +
            '<button class="payment-btn" data-method="mixto">💵+📱<br>Mixto</button>' +
          '</div>' +
        '</div>' +

        '<div id="split-payment" style="display:none">' +
          '<div class="split-cols">' +
            '<div class="split-col">' +
              '<span class="split-label">💵 Efectivo $</span>' +
              '<input type="number" id="split-cash" class="form-input split-input" min="0" step="0.01" placeholder="0.00">' +
            '</div>' +
            '<div class="split-col">' +
              '<span class="split-label">📱 Pago Móvil</span>' +
              '<input type="number" id="split-movil" class="form-input split-input" min="0" step="1" placeholder="0">' +
            '</div>' +
            '<div class="split-col split-col-total">' +
              '<span class="split-label">Total $</span>' +
              '<span id="split-total" class="split-value split-value-total">$0.00</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="form-section"><input type="search" id="product-search" class="form-input" placeholder="🔍 Buscar producto..."></div>' +

        '<div id="products-list"></div>' +

        '<div class="form-section"><label class="form-label">Delivery $</label>' +
          '<input type="number" id="sale-delivery" class="form-input" min="0" step="0.01" value="0" placeholder="0.00"></div>' +

        '<div class="form-section"><label class="form-label">Notas</label>' +
          '<textarea id="sale-notes" class="form-input" rows="2" placeholder="Opcional..."></textarea></div>' +

        '<div class="sale-summary">' +
          '<div class="summary-row"><span>Ingreso productos</span><span id="s-revenue">$0.00</span></div>' +
          '<div class="summary-row"><span>Costo</span><span id="s-cost">$0.00</span></div>' +
          '<div class="summary-row"><span>Delivery (para repartidor)</span><span id="s-delivery">$0.00</span></div>' +
          '<div class="summary-row summary-total"><span>Total a cobrar</span><span id="s-total">$0.00</span></div>' +
          '<div class="summary-row summary-net"><span>Ganancia neta</span><span id="s-net">$0.00</span></div>' +
        '</div>' +

        '<button class="btn btn-primary btn-full btn-xl" id="save-sale-btn">GUARDAR VENTA</button>';

      renderProductList();

      // Botones de forma de pago
      container.querySelectorAll('.payment-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          container.querySelectorAll('.payment-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          // Mostrar/ocultar panel mixto
          var split = document.getElementById('split-payment');
          if (btn.dataset.method === 'mixto') {
            split.style.display = 'block';
            updateSummary(); // refrescar totales en el panel
          } else {
            split.style.display = 'none';
          }
        });
      });


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
      document.getElementById('save-sale-btn').addEventListener('click', saveSale);
    },

    loadForEdit: loadForEdit
  };
})();

window.FB = FB;
