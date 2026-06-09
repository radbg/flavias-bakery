var FB = window.FB || {};

FB.Zelle = (function() {
  var currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function getSalesForMonth() {
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
    return { sales: sales, products: products };
  }

  function getExpensesForMonth() {
    return FB.Storage.getZelleExpenses()
      .filter(function(e) { return e.date && e.date.startsWith(currentMonth); })
      .sort(function(a, b) { return b.date.localeCompare(a.date); });
  }

  // ── Render principal ─────────────────────────────────────────────────────────

  function refresh() {
    var monthLabel = document.getElementById('zelle-month-label');
    if (monthLabel) monthLabel.textContent = FB.Calc.monthLabel(currentMonth);

    var data     = getSalesForMonth();
    var sales    = data.sales;
    var products = data.products;
    var expenses = getExpensesForMonth();

    // ── Totales ──────────────────────────────────────────────────────────────
    var totalCobrado = 0;
    sales.forEach(function(sale) {
      var t = FB.Calc.saleTotals(sale, products);
      totalCobrado += t.revenue + (sale.delivery || 0);
    });

    var totalGastos = 0;
    expenses.forEach(function(e) { totalGastos += Number(e.amount) || 0; });

    var balance = totalCobrado - totalGastos;

    // ── Summary card ─────────────────────────────────────────────────────────
    var summaryEl = document.getElementById('zelle-summary');
    if (summaryEl) {
      summaryEl.style.display = 'block';
      document.getElementById('zelle-cobrado').textContent = FB.Calc.fmt(totalCobrado);
      document.getElementById('zelle-gastos-total').textContent = FB.Calc.fmt(totalGastos);
      document.getElementById('zelle-balance').textContent = FB.Calc.fmt(balance);
      document.getElementById('zelle-balance').style.color = balance >= 0 ? '#4ade80' : '#f87171';
    }

    // ── Ventas Zelle ─────────────────────────────────────────────────────────
    renderSales(sales, products, totalCobrado);

    // ── Gastos Zelle ─────────────────────────────────────────────────────────
    renderExpenses(expenses);
  }

  function renderSales(sales, products, totalCobrado) {
    var list = document.getElementById('zelle-list');
    if (!list) return;

    if (!sales.length) {
      list.innerHTML = '<div class="empty-state"><p>No hay pagos por Zelle este mes</p></div>';
      return;
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

    // Click en fila abre detalle
    list.querySelectorAll('.zelle-row').forEach(function(row) {
      row.addEventListener('click', function() {
        showDetail(row.dataset.id, products);
      });
    });
  }

  function renderExpenses(expenses) {
    var container = document.getElementById('zelle-expenses-list');
    if (!container) return;

    if (!expenses.length) {
      container.innerHTML = '<p class="zelle-expenses-empty">Sin gastos registrados este mes</p>';
      return;
    }

    container.innerHTML = expenses.map(function(e) {
      var dateObj = new Date(e.date + 'T00:00:00');
      var dateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      return '<div class="zelle-expense-row" data-id="' + e.id + '">' +
        '<div class="zelle-expense-left">' +
          '<span class="zelle-expense-date">' + dateStr + '</span>' +
          '<span class="zelle-expense-desc">' + escHtml(e.description || 'Sin descripción') + '</span>' +
        '</div>' +
        '<div class="zelle-expense-right">' +
          '<span class="zelle-expense-amount">' + FB.Calc.fmt(Number(e.amount) || 0) + '</span>' +
          '<button class="zelle-expense-del" data-id="' + e.id + '" title="Eliminar">🗑</button>' +
        '</div>' +
      '</div>';
    }).join('');

    container.querySelectorAll('.zelle-expense-del').forEach(function(btn) {
      btn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        var id = btn.dataset.id;
        FB.Modal.confirm('¿Eliminar este gasto?', function() {
          FB.Storage.deleteZelleExpense(id);
          FB.Toast.show('Gasto eliminado');
          refresh();
        });
      });
    });
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Formulario agregar gasto ─────────────────────────────────────────────────

  function showAddExpenseForm() {
    var formEl = document.getElementById('zelle-add-form');
    if (!formEl) return;
    formEl.style.display = formEl.style.display === 'none' ? 'block' : 'none';
    if (formEl.style.display === 'block') {
      document.getElementById('ze-amount').focus();
    }
  }

  function saveExpense() {
    var amountEl = document.getElementById('ze-amount');
    var descEl   = document.getElementById('ze-desc');
    var amount   = parseFloat(amountEl.value) || 0;
    var desc     = descEl.value.trim();

    if (amount <= 0) { FB.Toast.show('Ingresa un monto válido', 'error'); return; }
    if (!desc)       { FB.Toast.show('Agrega una descripción', 'error'); return; }

    FB.Storage.addZelleExpense({
      date:        FB.Calc.today(),
      amount:      amount,
      description: desc
    });

    amountEl.value = '';
    descEl.value   = '';
    document.getElementById('zelle-add-form').style.display = 'none';
    FB.Toast.show('Gasto registrado ✅');
    refresh();
  }

  // ── Modal detalle de venta ───────────────────────────────────────────────────

  function showDetail(saleId, products) {
    var sale = FB.Storage.getSales().find(function(s) { return s.id === saleId; });
    if (!sale) return;
    var t   = FB.Calc.saleTotals(sale, products);
    var map = {};
    products.forEach(function(p) { map[p.id] = p; });

    var itemsHTML = sale.items.map(function(item) {
      var p = map[item.productId];
      if (!p) return '';
      var unitPrice = (item.unitPrice !== undefined) ? item.unitPrice : p.price;
      var disc      = Number(item.discountPct) || 0;
      var lineTotal = unitPrice * item.qty * (1 - disc / 100);
      var nameCell  = p.name + (disc > 0 ? ' <span class="badge badge-pink">−' + disc + '%</span>' : '');
      return '<tr><td>' + nameCell + '</td>' +
        '<td class="text-center">' + item.qty + '</td>' +
        '<td class="text-right">' + FB.Calc.fmt(unitPrice) + '</td>' +
        '<td class="text-right">' + FB.Calc.fmt(lineTotal) + '</td></tr>';
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

  // ── Render de la vista ───────────────────────────────────────────────────────

  return {
    render: function(container) {
      currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));

      container.innerHTML =
        /* Encabezado con navegación de mes */
        '<div class="view-header">' +
          '<div class="month-nav">' +
            '<button class="month-btn" id="zelle-prev">‹</button>' +
            '<span class="month-title" id="zelle-month-label"></span>' +
            '<button class="month-btn" id="zelle-next">›</button>' +
          '</div>' +
        '</div>' +

        /* Tarjeta resumen: cobrado / gastos / balance */
        '<div id="zelle-summary" class="zelle-summary-card">' +
          '<div class="zelle-summary-cols">' +
            '<div class="zelle-summary-col">' +
              '<span class="zelle-summary-label">Cobrado</span>' +
              '<span class="zelle-summary-amount" id="zelle-cobrado">$0.00</span>' +
            '</div>' +
            '<div class="zelle-summary-col">' +
              '<span class="zelle-summary-label">Gastos</span>' +
              '<span class="zelle-summary-amount" id="zelle-gastos-total">$0.00</span>' +
            '</div>' +
            '<div class="zelle-summary-col">' +
              '<span class="zelle-summary-label">Balance</span>' +
              '<span class="zelle-summary-amount" id="zelle-balance">$0.00</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* Sección ventas Zelle */
        '<div class="zelle-section-header">' +
          '<span class="zelle-section-title">🏦 Ventas Zelle</span>' +
        '</div>' +
        '<div id="zelle-list"></div>' +

        /* Sección gastos Zelle manuales */
        '<div class="zelle-section-header">' +
          '<span class="zelle-section-title">💸 Gastos Zelle</span>' +
          '<button class="zelle-add-btn" id="zelle-add-expense-btn">+ Agregar</button>' +
        '</div>' +

        /* Formulario inline para agregar gasto */
        '<div id="zelle-add-form" style="display:none">' +
          '<div class="zelle-form-row">' +
            '<input type="number" id="ze-amount" class="form-input" placeholder="Monto $" min="0" step="0.01" style="flex:1">' +
            '<input type="text"   id="ze-desc"   class="form-input" placeholder="Descripción" style="flex:2">' +
            '<button class="btn btn-primary ze-save-btn" id="ze-save">Guardar</button>' +
            '<button class="btn btn-ghost   ze-cancel-btn" id="ze-cancel">✕</button>' +
          '</div>' +
        '</div>' +

        '<div id="zelle-expenses-list"></div>';

      /* Navegación de mes */
      document.getElementById('zelle-prev').addEventListener('click', function() {
        currentMonth = FB.Calc.prevMonth(currentMonth);
        refresh();
      });
      document.getElementById('zelle-next').addEventListener('click', function() {
        currentMonth = FB.Calc.nextMonth(currentMonth);
        refresh();
      });

      /* Botón agregar gasto */
      document.getElementById('zelle-add-expense-btn').addEventListener('click', showAddExpenseForm);
      document.getElementById('ze-save').addEventListener('click', saveExpense);
      document.getElementById('ze-cancel').addEventListener('click', function() {
        document.getElementById('zelle-add-form').style.display = 'none';
      });

      /* Enter en el campo descripción guarda */
      document.getElementById('ze-desc').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') saveExpense();
      });

      refresh();
    }
  };
})();

window.FB = FB;
