var FB = window.FB || {};

FB.History = (function() {
  var currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));
  var _navigate = null;

  function refresh() {
    var label = document.getElementById('hist-month-label');
    if (label) label.textContent = FB.Calc.monthLabel(currentMonth);

    var products = FB.Storage.getProducts();
    var sales = FB.Storage.getSales()
      .filter(function(s) { return s.date.startsWith(currentMonth); })
      .sort(function(a, b) {
        // ordenar por fecha + hora descendente
        var aKey = a.date + 'T' + (a.time || '00:00');
        var bKey = b.date + 'T' + (b.time || '00:00');
        return bKey.localeCompare(aKey);
      });

    var list = document.getElementById('hist-list');
    if (!list) return;

    if (!sales.length) {
      list.innerHTML = '<div class="empty-state"><p>No hay ventas este mes</p></div>';
      return;
    }

    list.innerHTML = sales.map(function(sale) {
      var t = FB.Calc.saleTotals(sale, products);
      var itemCount = sale.items.reduce(function(s, i) { return s + i.qty; }, 0);
      var dateObj = new Date(sale.date + 'T00:00:00');
      var dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      var discBadge = (sale.discountPct > 0)
        ? '<span class="badge badge-pink" style="margin-left:6px">−' + sale.discountPct + '%</span>' : '';

      return '<div class="sale-row" data-id="' + sale.id + '">' +
        '<div class="sale-row-main">' +
          '<div class="sale-date-col">' +
            '<span class="sale-date">' + dateStr + (sale.time ? ' · ' + sale.time : '') + discBadge + '</span>' +
            '<span class="sale-items-count">' + itemCount + ' productos</span>' +
          '</div>' +
          '<div class="sale-amounts">' +
            '<span class="sale-revenue">' + FB.Calc.fmt(t.revenue + t.delivery) + '</span>' +
            '<span class="sale-profit ' + (t.net >= 0 ? 'positive' : 'negative') + '">' + FB.Calc.fmt(t.net) + '</span>' +
          '</div>' +
        '</div></div>';
    }).join('');

    list.querySelectorAll('.sale-row').forEach(function(row) {
      row.addEventListener('click', function() { showDetail(row.dataset.id, products); });
    });
  }

  function showDetail(saleId, products) {
    var sale = FB.Storage.getSales().find(function(s) { return s.id === saleId; });
    if (!sale) return;
    var t = FB.Calc.saleTotals(sale, products);
    var map = {};
    products.forEach(function(p) { map[p.id] = p; });

    var itemsHTML = sale.items.map(function(item) {
      var p = map[item.productId];
      if (!p) return '';
      return '<tr><td>' + p.name + '</td><td class="text-center">' + item.qty +
        '</td><td class="text-right">' + FB.Calc.fmt(p.price) +
        '</td><td class="text-right">' + FB.Calc.fmt(p.price * item.qty) + '</td></tr>';
    }).join('');

    var dateObj = new Date(sale.date + 'T00:00:00');
    var dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var timeStr = sale.time ? ' a las ' + sale.time : '';

    var html =
      '<h3 class="modal-title">' + dateStr + timeStr + '</h3>' +
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
      FB.Modal.close();
      if (_navigate) _navigate('register', { editSaleId: saleId });
    });
    overlay.querySelector('#det-delete').addEventListener('click', function() {
      FB.Modal.confirm('¿Eliminar esta venta?', function() {
        FB.Storage.deleteSale(saleId);
        FB.Toast.show('Venta eliminada');
        refresh();
      });
    });
  }

  return {
    render: function(container, navigate) {
      _navigate = navigate;
      currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));
      container.innerHTML =
        '<div class="view-header"><div class="month-nav">' +
          '<button class="month-btn" id="hist-prev">‹</button>' +
          '<span class="month-title" id="hist-month-label"></span>' +
          '<button class="month-btn" id="hist-next">›</button>' +
        '</div></div>' +
        '<div id="hist-list"></div>';

      document.getElementById('hist-prev').addEventListener('click', function() { currentMonth = FB.Calc.prevMonth(currentMonth); refresh(); });
      document.getElementById('hist-next').addEventListener('click', function() { currentMonth = FB.Calc.nextMonth(currentMonth); refresh(); });
      refresh();
    }
  };
})();

window.FB = FB;
