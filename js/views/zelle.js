var FB = window.FB || {};

FB.Zelle = (function() {
  var currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));

  function refresh() {
    var label = document.getElementById('zelle-month-label');
    if (label) label.textContent = FB.Calc.monthLabel(currentMonth);

    var products = FB.Storage.getProducts();
    var sales = FB.Storage.getSales()
      .filter(function(s) {
        return s.date.startsWith(currentMonth) && s.paymentMethod === 'zelle';
      })
      .sort(function(a, b) {
        var aKey = a.date + 'T' + (a.time || '00:00');
        var bKey = b.date + 'T' + (b.time || '00:00');
        return bKey.localeCompare(aKey);
      });

    var list    = document.getElementById('zelle-list');
    var summary = document.getElementById('zelle-summary');
    if (!list) return;

    if (!sales.length) {
      list.innerHTML = '<div class="empty-state"><p>No hay pagos por Zelle este mes</p></div>';
      if (summary) summary.style.display = 'none';
      return;
    }

    // Calcular total del mes
    var totalMes = 0;
    sales.forEach(function(sale) {
      var t = FB.Calc.saleTotals(sale, products);
      totalMes += t.revenue + (sale.delivery || 0);
    });

    if (summary) {
      summary.style.display = 'block';
      document.getElementById('zelle-total').textContent = FB.Calc.fmt(totalMes);
      document.getElementById('zelle-count').textContent = sales.length + ' pago' + (sales.length !== 1 ? 's' : '');
    }

    // Agrupar por día
    var byDay = {};
    sales.forEach(function(sale) {
      if (!byDay[sale.date]) byDay[sale.date] = [];
      byDay[sale.date].push(sale);
    });

    var days = Object.keys(byDay).sort(function(a, b) { return b.localeCompare(a); });

    list.innerHTML = days.map(function(date) {
      var daySales = byDay[date];
      var dayTotal = 0;
      daySales.forEach(function(sale) {
        var t = FB.Calc.saleTotals(sale, products);
        dayTotal += t.revenue + (sale.delivery || 0);
      });

      var dateObj = new Date(date + 'T00:00:00');
      var dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

      var rowsHTML = daySales.map(function(sale) {
        var t         = FB.Calc.saleTotals(sale, products);
        var amount    = t.revenue + (sale.delivery || 0);
        var itemCount = sale.items.reduce(function(s, i) { return s + i.qty; }, 0);
        var timeStr   = sale.time ? FB.Calc.fmt12h(sale.time) : '';
        var noteStr   = sale.notes ? '<span class="zelle-note">' + sale.notes + '</span>' : '';

        return '<div class="zelle-row" data-id="' + sale.id + '">' +
          '<div class="zelle-row-left">' +
            (timeStr ? '<span class="zelle-time">' + timeStr + '</span>' : '') +
            '<span class="zelle-items">' + itemCount + ' producto' + (itemCount !== 1 ? 's' : '') + '</span>' +
            noteStr +
          '</div>' +
          '<div class="zelle-row-right">' +
            '<span class="zelle-amount">' + FB.Calc.fmt(amount) + '</span>' +
          '</div>' +
        '</div>';
      }).join('');

      return '<div class="zelle-day-group">' +
        '<div class="zelle-day-header">' +
          '<span class="zelle-day-label">' + dateStr + '</span>' +
          '<span class="zelle-day-total">' + FB.Calc.fmt(dayTotal) + '</span>' +
        '</div>' +
        rowsHTML +
      '</div>';
    }).join('');

    // Click en fila abre detalle del historial
    list.querySelectorAll('.zelle-row').forEach(function(row) {
      row.addEventListener('click', function() {
        showDetail(row.dataset.id, products);
      });
    });
  }

  function showDetail(saleId, products) {
    var sale = FB.Storage.getSales().find(function(s) { return s.id === saleId; });
    if (!sale) return;
    var t   = FB.Calc.saleTotals(sale, products);
    var map = {};
    products.forEach(function(p) { map[p.id] = p; });

    var itemsHTML = sale.items.map(function(item) {
      var p = map[item.productId];
      if (!p) return '';
      return '<tr><td>' + p.name + '</td>' +
        '<td class="text-center">' + item.qty + '</td>' +
        '<td class="text-right">' + FB.Calc.fmt(p.price) + '</td>' +
        '<td class="text-right">' + FB.Calc.fmt(p.price * item.qty) + '</td></tr>';
    }).join('');

    var dateObj = new Date(sale.date + 'T00:00:00');
    var dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var timeStr = sale.time ? ' a las ' + FB.Calc.fmt12h(sale.time) : '';

    var html =
      '<h3 class="modal-title">' + dateStr + timeStr + '</h3>' +
      '<div class="detail-payment-badge">🏦 Zelle</div>' +
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
      '</div>';

    var overlay = FB.Modal.open(html, null, { hideFooter: true });
    overlay.querySelector('#det-cancel').addEventListener('click', function() { FB.Modal.close(); });
  }

  return {
    render: function(container) {
      currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));

      container.innerHTML =
        '<div class="view-header">' +
          '<div class="month-nav">' +
            '<button class="month-btn" id="zelle-prev">‹</button>' +
            '<span class="month-title" id="zelle-month-label"></span>' +
            '<button class="month-btn" id="zelle-next">›</button>' +
          '</div>' +
        '</div>' +

        '<div id="zelle-summary" class="zelle-summary-card" style="display:none">' +
          '<div class="zelle-summary-label">Total Zelle del mes</div>' +
          '<div class="zelle-summary-amount" id="zelle-total">$0.00</div>' +
          '<div class="zelle-summary-count" id="zelle-count"></div>' +
        '</div>' +

        '<div id="zelle-list"></div>';

      document.getElementById('zelle-prev').addEventListener('click', function() {
        currentMonth = FB.Calc.prevMonth(currentMonth);
        refresh();
      });
      document.getElementById('zelle-next').addEventListener('click', function() {
        currentMonth = FB.Calc.nextMonth(currentMonth);
        refresh();
      });

      refresh();
    }
  };
})();

window.FB = FB;
