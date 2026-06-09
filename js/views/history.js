var FB = window.FB || {};

FB.History = (function() {
  var currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));
  var _navigate    = null;
  var selectMode   = false;
  var selected     = {};

  var PAYMENT_LABELS = {
    'efectivo':      '💵 Efectivo',
    'pago-movil':    '📱 Pago Móvil',
    'zelle':         '🏦 Zelle',
    'mixto':         '💵+📱 Mixto',
    'transferencia': '🔁 Transf.'
  };

  function paymentLabel(method) {
    return PAYMENT_LABELS[method] || '💵 Efectivo';
  }

  function refresh() {
    var label = document.getElementById('hist-month-label');
    if (label) label.textContent = FB.Calc.monthLabel(currentMonth);

    var products = FB.Storage.getProducts();
    var sales = FB.Storage.getSales()
      .filter(function(s) { return s.date.startsWith(currentMonth); })
      .sort(function(a, b) {
        var aKey = a.date + 'T' + (a.time || '00:00');
        var bKey = b.date + 'T' + (b.time || '00:00');
        return bKey.localeCompare(aKey);
      });

    var list = document.getElementById('hist-list');
    if (!list) return;

    if (!sales.length) {
      list.innerHTML = '<div class="empty-state"><p>No hay ventas este mes</p></div>';
      updateSelectionBar();
      return;
    }

    list.innerHTML = sales.map(function(sale) {
      var t = FB.Calc.saleTotals(sale, products);
      var itemCount = sale.items.reduce(function(s, i) { return s + i.qty; }, 0);
      var dateObj = new Date(sale.date + 'T00:00:00');
      var dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      var discBadge = (sale.discountPct > 0)
        ? '<span class="badge badge-pink" style="margin-left:6px">−' + sale.discountPct + '%</span>' : '';
      var isSelected = !!selected[sale.id];
      var pmLabel = paymentLabel(sale.paymentMethod);

      return '<div class="sale-row' + (selectMode ? ' selectable' : '') + (isSelected ? ' row-selected' : '') + '" data-id="' + sale.id + '">' +
        (selectMode ? '<div class="row-checkbox">' + (isSelected ? '✓' : '') + '</div>' : '') +
        '<div class="sale-row-main">' +
          '<div class="sale-date-col">' +
            '<span class="sale-date">' + dateStr + (sale.time ? ' · ' + FB.Calc.fmt12h(sale.time) : '') + discBadge + '</span>' +
            '<span class="sale-items-count">' + itemCount + ' productos · <span class="payment-tag">' + pmLabel + '</span></span>' +
          '</div>' +
          '<div class="sale-amounts">' +
            '<span class="sale-revenue">' + FB.Calc.fmt(t.revenue + t.delivery) + '</span>' +
            '<span class="sale-profit ' + (t.net >= 0 ? 'positive' : 'negative') + '">' + FB.Calc.fmt(t.net) + '</span>' +
          '</div>' +
        '</div></div>';
    }).join('');

    list.querySelectorAll('.sale-row').forEach(function(row) {
      row.addEventListener('click', function() {
        if (selectMode) {
          toggleSelect(row.dataset.id, row);
        } else {
          showDetail(row.dataset.id, products);
        }
      });
    });

    updateSelectionBar();
  }

  function toggleSelect(id, row) {
    if (selected[id]) {
      delete selected[id];
      row.classList.remove('row-selected');
      row.querySelector('.row-checkbox').textContent = '';
    } else {
      selected[id] = true;
      row.classList.add('row-selected');
      row.querySelector('.row-checkbox').textContent = '✓';
    }
    updateSelectionBar();
  }

  function updateSelectionBar() {
    var bar   = document.getElementById('selection-bar');
    var count = Object.keys(selected).length;
    if (!bar) return;
    if (selectMode) {
      bar.style.display = 'flex';
      var label = bar.querySelector('.sel-count');
      if (label) label.textContent = count > 0 ? count + ' seleccionada' + (count > 1 ? 's' : '') : 'Toca para seleccionar';
      var delBtn = bar.querySelector('#sel-delete');
      if (delBtn) delBtn.disabled = count === 0;
    } else {
      bar.style.display = 'none';
    }
  }

  function enterSelectMode() {
    selectMode = true;
    selected   = {};
    var btn = document.getElementById('hist-select-btn');
    if (btn) { btn.textContent = 'Cancelar'; btn.classList.add('active'); }
    refresh();
  }

  function exitSelectMode() {
    selectMode = false;
    selected   = {};
    var btn = document.getElementById('hist-select-btn');
    if (btn) { btn.textContent = 'Seleccionar'; btn.classList.remove('active'); }
    refresh();
  }

  function deleteSelected() {
    var ids   = Object.keys(selected);
    var count = ids.length;
    if (!count) return;
    FB.Modal.confirm(
      '¿Eliminar ' + count + ' venta' + (count > 1 ? 's' : '') + '?',
      function() {
        ids.forEach(function(id) { FB.Storage.deleteSale(id); });
        FB.Toast.show(count + ' venta' + (count > 1 ? 's eliminadas' : ' eliminada'));
        exitSelectMode();
      }
    );
  }

  var PAYMENT_FULL_LABELS = {
    'efectivo':      '💵 Efectivo',
    'pago-movil':    '📱 Pago Móvil',
    'zelle':         '🏦 Zelle',
    'mixto':         '💵+📱 Mixto (Efectivo + Pago Móvil)',
    'transferencia': '🔁 Transferencia bancaria'
  };

  function showDetail(saleId, products) {
    var sale = FB.Storage.getSales().find(function(s) { return s.id === saleId; });
    if (!sale) return;
    var t = FB.Calc.saleTotals(sale, products);
    var map = {};
    products.forEach(function(p) { map[p.id] = p; });

    var itemsHTML = sale.items.map(function(item) {
      var p = map[item.productId];
      if (!p) return '';
      var unitPrice = (item.unitPrice !== undefined) ? item.unitPrice : p.price;
      var disc      = Number(item.discountPct) || 0;
      var lineTotal = unitPrice * item.qty * (1 - disc / 100);
      var nameCell  = p.name + (disc > 0 ? ' <span class="badge badge-pink">−' + disc + '%</span>' : '');
      return '<tr><td>' + nameCell + '</td><td class="text-center">' + item.qty +
        '</td><td class="text-right">' + FB.Calc.fmt(unitPrice) +
        '</td><td class="text-right">' + FB.Calc.fmt(lineTotal) + '</td></tr>';
    }).join('');

    var dateObj = new Date(sale.date + 'T00:00:00');
    var dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var timeStr = sale.time ? ' a las ' + FB.Calc.fmt12h(sale.time) : '';
    var pmFull  = PAYMENT_FULL_LABELS[sale.paymentMethod] || '💵 Efectivo';

    var mixtoDetail = '';
    if (sale.paymentMethod === 'mixto') {
      mixtoDetail = '<div class="detail-mixto-row">' +
        (sale.cashAmount  ? '<span>💵 $' + Number(sale.cashAmount).toFixed(2) + ' efectivo</span>'   : '') +
        (sale.movilAmount ? '<span>📱 $' + Number(sale.movilAmount).toFixed(2) + ' pago móvil</span>' : '') +
      '</div>';
    }

    var html =
      '<h3 class="modal-title">' + dateStr + timeStr + '</h3>' +
      '<div class="detail-payment-badge">' + pmFull + '</div>' +
      mixtoDetail +
      (sale.discountPct > 0 ? '<div class="alert alert-info" style="margin-bottom:12px">Descuento aplicado: ' + sale.discountPct + '%</div>' : '') +
      '<table class="detail-table">' +
        '<thead><tr><th>Producto</th><th class="text-center">Cant</th><th class="text-right">P.Unit</th><th class="text-right">Total</th></tr></thead>' +
        '<tbody>' + itemsHTML + '</tbody>' +
      '</table>' +
      (sale.delivery > 0 ? '<div class="detail-row"><span>Delivery</span><span>' + FB.Calc.fmt(sale.delivery) + '</span></div>' : '') +
      (sale.notes ? '<div class="detail-notes">"' + sale.notes + '"</div>' : '') +
      '<div class="detail-summary">' +
        '<div class="detail-row"><span>Ingresos</span><span>' + FB.Calc.fmt(t.revenue) + '</span></div>' +
        '<div class="detail-row"><span>Costo</span><span>' + FB.Calc.fmt(t.cost) + '</span></div>' +
        '<div class="detail-row detail-net"><span>Neto</span><span>' + FB.Calc.fmt(t.net) + '</span></div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn-ghost" id="det-cancel">Cerrar</button>' +
        '<button class="btn btn-outline" id="det-edit">Editar</button>' +
        '<button class="btn btn-danger" id="det-delete">Eliminar</button>' +
      '</div>';

    var overlay = FB.Modal.open(html, null, { hideFooter: true });
    overlay.querySelector('#det-cancel').addEventListener('click', function() { FB.Modal.close(); });
    overlay.querySelector('#det-edit').addEventListener('click', function() {
      showEditForm(saleId, products);   // editar aquí mismo, sin salir del historial
    });
    overlay.querySelector('#det-delete').addEventListener('click', function() {
      FB.Modal.confirm('¿Eliminar esta venta?', function() {
        FB.Storage.deleteSale(saleId);
        FB.Toast.show('Venta eliminada');
        refresh();
      });
    });
  }

  // ── Edición en el mismo modal (sin ir a la pestaña de Registrar Venta) ────────
  function showEditForm(saleId, products) {
    var sale = FB.Storage.getSales().find(function(s) { return s.id === saleId; });
    if (!sale) return;
    var map = {};
    products.forEach(function(p) { map[p.id] = p; });

    var state = {
      items: (sale.items || []).map(function(it) {
        var p = map[it.productId];
        return {
          productId:   it.productId,
          qty:         Number(it.qty) || 0,
          unitPrice:   (it.unitPrice !== undefined) ? it.unitPrice : (p ? p.price : 0),
          unitCost:    (it.unitCost  !== undefined) ? it.unitCost  : (p ? p.cost  : 0),
          discountPct: Number(it.discountPct) || 0,
          name:        p ? p.name : '(producto eliminado)'
        };
      }),
      date:          sale.date,
      time:          sale.time || '00:00',
      delivery:      Number(sale.delivery) || 0,
      notes:         sale.notes || '',
      paymentMethod: sale.paymentMethod || 'efectivo',
      cashAmount:    sale.cashAmount  || 0,
      movilAmount:   sale.movilAmount || 0
    };

    var activeProducts = products.filter(function(p) { return p.active; });
    var overlay = FB.Modal.open('<div></div>', null, { hideFooter: true });

    // Capturar valores de inputs antes de re-renderizar
    function readInputs() {
      var d  = document.getElementById('edit-date');     if (d)  state.date     = d.value;
      var t  = document.getElementById('edit-time');     if (t)  state.time     = t.value;
      var dl = document.getElementById('edit-delivery'); if (dl) state.delivery = parseFloat(dl.value) || 0;
      var nt = document.getElementById('edit-notes');    if (nt) state.notes    = nt.value;
      var ca = document.getElementById('edit-cash');     if (ca) state.cashAmount  = parseFloat(ca.value) || 0;
      var mv = document.getElementById('edit-movil');    if (mv) state.movilAmount = parseFloat(mv.value) || 0;
      overlay.querySelectorAll('.edit-item-disc').forEach(function(inp) {
        var i = +inp.dataset.idx;
        if (state.items[i]) state.items[i].discountPct = Math.min(100, Math.max(0, parseFloat(inp.value) || 0));
      });
    }

    function render() {
      var t = FB.Calc.saleTotals({ items: state.items, delivery: state.delivery }, products);

      var itemsHTML = state.items.map(function(it, idx) {
        return '<div class="edit-item-row">' +
          '<div class="edit-item-info">' +
            '<span class="edit-item-name">' + it.name + '</span>' +
            '<span class="edit-item-disc-wrap">promo <input type="number" class="edit-item-disc" data-idx="' + idx + '" min="0" max="100" value="' + (it.discountPct || '') + '" placeholder="0">%</span>' +
          '</div>' +
          '<div class="edit-item-counter">' +
            '<button class="counter-btn edit-dec" data-idx="' + idx + '">−</button>' +
            '<span class="counter-qty">' + it.qty + '</span>' +
            '<button class="counter-btn edit-inc" data-idx="' + idx + '">+</button>' +
            '<button class="edit-item-remove" data-idx="' + idx + '" title="Quitar">🗑</button>' +
          '</div>' +
        '</div>';
      }).join('');

      var addOptions = '<option value="">+ Agregar producto…</option>' + activeProducts.map(function(p) {
        return '<option value="' + p.id + '">' + p.name + ' (' + FB.Calc.fmt(p.price) + ')</option>';
      }).join('');

      var pmBtns = [['efectivo','💵<br>Efectivo'],['pago-movil','📱<br>Pago Móvil'],['zelle','🏦<br>Zelle'],['mixto','💵+📱<br>Mixto']].map(function(m) {
        return '<button class="payment-btn' + (state.paymentMethod === m[0] ? ' active' : '') + '" data-method="' + m[0] + '">' + m[1] + '</button>';
      }).join('');

      var splitHTML = state.paymentMethod === 'mixto' ?
        '<div class="split-cols" style="margin-bottom:12px">' +
          '<div class="split-col"><span class="split-label">💵 Efectivo $</span><input type="number" id="edit-cash" class="form-input split-input" min="0" step="0.01" value="' + (state.cashAmount || '') + '" placeholder="0.00"></div>' +
          '<div class="split-col"><span class="split-label">📱 Pago Móvil $</span><input type="number" id="edit-movil" class="form-input split-input" min="0" step="0.01" value="' + (state.movilAmount || '') + '" placeholder="0.00"></div>' +
          '<div class="split-col split-col-total"><span class="split-label">Total $</span><span class="split-value split-value-total">' + FB.Calc.fmt(t.total) + '</span></div>' +
        '</div>' : '';

      var html =
        '<h3 class="modal-title">✏️ Editar venta</h3>' +
        '<div class="form-row">' +
          '<div class="form-section"><label class="form-label">Fecha</label><input type="date" id="edit-date" class="form-input" value="' + state.date + '"></div>' +
          '<div class="form-section"><label class="form-label">Hora</label><input type="time" id="edit-time" class="form-input" value="' + state.time + '"></div>' +
        '</div>' +
        '<label class="form-label">Forma de pago</label>' +
        '<div class="payment-methods" style="margin-bottom:12px">' + pmBtns + '</div>' +
        splitHTML +
        '<label class="form-label">Productos</label>' +
        '<div class="edit-items">' + (itemsHTML || '<p class="empty-msg">Sin productos</p>') + '</div>' +
        '<select id="edit-add-product" class="form-input" style="margin:8px 0">' + addOptions + '</select>' +
        '<div class="form-section"><label class="form-label">Delivery $</label><input type="number" id="edit-delivery" class="form-input" min="0" step="0.01" value="' + state.delivery + '"></div>' +
        '<div class="form-section"><label class="form-label">Notas</label><textarea id="edit-notes" class="form-input" rows="2" placeholder="Opcional...">' + state.notes + '</textarea></div>' +
        '<div class="sale-summary">' +
          '<div class="summary-row"><span>Ingreso productos</span><span>' + FB.Calc.fmt(t.revenue) + '</span></div>' +
          '<div class="summary-row"><span>Delivery (repartidor)</span><span>' + FB.Calc.fmt(t.delivery) + '</span></div>' +
          '<div class="summary-row summary-total"><span>Total a cobrar</span><span>' + FB.Calc.fmt(t.total) + '</span></div>' +
          '<div class="summary-row summary-net"><span>Ganancia neta</span><span>' + FB.Calc.fmt(t.net) + '</span></div>' +
        '</div>' +
        '<div class="modal-footer">' +
          '<button class="btn btn-ghost" id="edit-cancel">Cancelar</button>' +
          '<button class="btn btn-primary" id="edit-save">ACTUALIZAR VENTA</button>' +
        '</div>';

      overlay.querySelector('.modal-body').innerHTML = html;
      attach();
    }

    function attach() {
      overlay.querySelectorAll('.payment-btn').forEach(function(b) {
        b.addEventListener('click', function() { readInputs(); state.paymentMethod = b.dataset.method; render(); });
      });
      overlay.querySelectorAll('.edit-inc').forEach(function(b) {
        b.addEventListener('click', function() { readInputs(); state.items[+b.dataset.idx].qty++; render(); });
      });
      overlay.querySelectorAll('.edit-dec').forEach(function(b) {
        b.addEventListener('click', function() { readInputs(); var i = +b.dataset.idx; state.items[i].qty = Math.max(1, state.items[i].qty - 1); render(); });
      });
      overlay.querySelectorAll('.edit-item-remove').forEach(function(b) {
        b.addEventListener('click', function() { readInputs(); state.items.splice(+b.dataset.idx, 1); render(); });
      });
      overlay.querySelectorAll('.edit-item-disc').forEach(function(inp) {
        inp.addEventListener('change', function() { readInputs(); render(); });
      });
      var dl = overlay.querySelector('#edit-delivery');
      if (dl) dl.addEventListener('change', function() { readInputs(); render(); });
      var addSel = overlay.querySelector('#edit-add-product');
      if (addSel) addSel.addEventListener('change', function() {
        var pid = addSel.value; if (!pid) return;
        readInputs();
        var existing = state.items.find(function(x) { return x.productId === pid; });
        if (existing) { existing.qty++; }
        else {
          var p = map[pid];
          state.items.push({ productId: pid, qty: 1, unitPrice: p.price, unitCost: p.cost, discountPct: 0, name: p.name });
        }
        render();
      });
      overlay.querySelector('#edit-cancel').addEventListener('click', function() { FB.Modal.close(); });
      overlay.querySelector('#edit-save').addEventListener('click', function() {
        readInputs();
        if (!state.items.length) { FB.Toast.show('Agrega al menos un producto', 'error'); return; }
        var saleData = {
          date:          state.date,
          time:          state.time,
          items:         state.items.map(function(it) {
            return { productId: it.productId, qty: Number(it.qty), unitPrice: it.unitPrice, unitCost: it.unitCost, discountPct: Number(it.discountPct) || 0 };
          }),
          delivery:      state.delivery,
          discountPct:   0,
          notes:         state.notes,
          paymentMethod: state.paymentMethod,
          cashAmount:    state.paymentMethod === 'mixto' ? state.cashAmount  : null,
          movilAmount:   state.paymentMethod === 'mixto' ? state.movilAmount : null
        };
        FB.Storage.updateSale(saleId, saleData);
        FB.Toast.show('¡Venta actualizada! ✅');
        FB.Modal.close();
        refresh();
      });
    }

    render();
  }

  return {
    render: function(container, navigate) {
      _navigate  = navigate;
      selectMode = false;
      selected   = {};
      currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));

      container.innerHTML =
        '<div class="view-header">' +
          '<div class="month-nav">' +
            '<button class="month-btn" id="hist-prev">‹</button>' +
            '<span class="month-title" id="hist-month-label"></span>' +
            '<button class="month-btn" id="hist-next">›</button>' +
          '</div>' +
          '<button class="btn-select-mode" id="hist-select-btn">Seleccionar</button>' +
        '</div>' +
        '<div id="hist-list"></div>' +
        '<div id="selection-bar" style="display:none">' +
          '<span class="sel-count">Toca para seleccionar</span>' +
          '<button class="btn btn-danger btn-sm" id="sel-delete" disabled>Eliminar</button>' +
        '</div>';

      document.getElementById('hist-prev').addEventListener('click', function() { currentMonth = FB.Calc.prevMonth(currentMonth); refresh(); });
      document.getElementById('hist-next').addEventListener('click', function() { currentMonth = FB.Calc.nextMonth(currentMonth); refresh(); });
      document.getElementById('hist-select-btn').addEventListener('click', function() {
        if (selectMode) exitSelectMode(); else enterSelectMode();
      });
      document.getElementById('sel-delete').addEventListener('click', deleteSelected);
      refresh();
    }
  };
})();

window.FB = FB;
