var FB = window.FB || {};

FB.MonthlyReport = (function() {
  var chart = null;
  var currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));

  function refresh() {
    var label = document.getElementById('rep-month-label');
    if (label) label.textContent = FB.Calc.monthLabel(currentMonth);

    var products = FB.Storage.getProducts();
    var sales    = FB.Storage.getSales();
    var expenses = FB.Storage.getExpenses();
    var s        = FB.Calc.monthSummary(currentMonth, sales, expenses, products);
    var daily    = FB.Calc.dailyRevenue(currentMonth, sales, products);
    var fixedCosts = FB.Storage.getFixedCost(currentMonth);
    var be       = FB.Calc.breakEven(fixedCosts, s.contributionMargin);
    var topList  = Object.keys(s.productTotals)
      .map(function(id) { return Object.assign({ product: products.find(function(p) { return p.id === id; }) }, s.productTotals[id]); })
      .filter(function(x) { return x.product; })
      .sort(function(a, b) { return b.qty - a.qty; });

    // Break-even status
    var beStatus = '';
    if (fixedCosts > 0 && be !== null) {
      if (s.revenue >= be) {
        beStatus = '<div class="be-status positive">✅ Punto de equilibrio alcanzado (' + FB.Calc.fmt(s.revenue) + ' / ' + FB.Calc.fmt(be) + ' necesarios)</div>';
      } else {
        var remaining = be - s.revenue;
        beStatus = '<div class="be-status negative">⚠️ Faltan ' + FB.Calc.fmt(remaining) + ' en ingresos para cubrir gastos fijos</div>';
      }
    }

    var content = document.getElementById('report-content');
    if (!content) return;

    content.innerHTML =
      // ── Estado de resultados ──
      '<div class="card">' +
        '<div class="card-title">Estado de resultados</div>' +
        '<div class="report-row"><span>Ingresos totales</span><span>' + FB.Calc.fmt(s.revenue) + '</span></div>' +
        '<div class="report-row"><span>Costo de productos</span><span>−' + FB.Calc.fmt(s.cost) + '</span></div>' +
        '<div class="report-row"><span>Ganancia bruta</span><span>' + FB.Calc.fmt(s.grossProfit) + '</span></div>' +
        '<div class="report-row"><span>Delivery</span><span>+' + FB.Calc.fmt(s.delivery) + '</span></div>' +
        '<div class="report-row"><span>Gastos extras variables</span><span>−' + FB.Calc.fmt(s.extraExpenses) + '</span></div>' +
        '<div class="report-row report-row-net"><span>Ganancia neta</span>' +
          '<span class="' + (s.netProfit >= 0 ? 'positive' : 'negative') + '">' + FB.Calc.fmt(s.netProfit) + '</span></div>' +
        '<div class="report-row muted"><span>Margen neto</span><span>' + FB.Calc.fmtPct(s.marginPct) + '</span></div>' +
      '</div>' +

      // ── Punto de equilibrio ──
      '<div class="card">' +
        '<div class="card-title">Punto de equilibrio</div>' +
        '<div class="be-field-row">' +
          '<label class="form-label" style="margin:0">Gastos fijos del mes $</label>' +
          '<input type="number" id="be-fixed-costs" class="form-input be-input" min="0" step="0.01" value="' + fixedCosts + '" placeholder="0.00">' +
          '<button class="btn btn-sm btn-primary" id="be-save-btn">Guardar</button>' +
        '</div>' +
        '<div class="be-metrics" id="be-metrics">' + buildBeMetrics(s, fixedCosts, be) + '</div>' +
        beStatus +
      '</div>' +

      // ── Top productos ──
      '<div class="card">' +
        '<div class="card-title">Productos del mes</div>' +
        (topList.length === 0 ? '<p class="empty-msg">Sin ventas</p>' :
          '<div class="table-scroll"><table class="report-table">' +
            '<thead><tr><th>Producto</th><th>Uds</th><th>Ingreso</th><th>Ganancia</th></tr></thead>' +
            '<tbody>' + topList.map(function(t) {
              var profit = t.revenue - t.cost;
              return '<tr><td>' + t.product.name + '</td><td class="text-center">' + t.qty +
                '</td><td class="text-right">' + FB.Calc.fmt(t.revenue) +
                '</td><td class="text-right ' + (profit >= 0 ? 'positive' : 'negative') + '">' + FB.Calc.fmt(profit) + '</td></tr>';
            }).join('') +
            '</tbody></table></div>') +
      '</div>' +

      // ── Gráfica ──
      '<div class="card">' +
        '<div class="card-title">Ingresos diarios</div>' +
        '<div class="chart-wrap"><canvas id="rep-chart"></canvas></div>' +
      '</div>';

    renderChart(daily);

    document.getElementById('be-save-btn').addEventListener('click', function() {
      var val = parseFloat(document.getElementById('be-fixed-costs').value) || 0;
      FB.Storage.setFixedCost(currentMonth, val);
      FB.Toast.show('Gastos fijos guardados');
      refresh();
    });
  }

  function buildBeMetrics(s, fixedCosts, be) {
    var cmPct = (s.contributionMargin * 100).toFixed(1);
    return '<div class="report-row"><span>Margen de contribución</span><span>' + cmPct + '%</span></div>' +
      '<div class="report-row"><span>(Ingresos − Costos variables) / Ingresos</span><span class="muted">' +
        FB.Calc.fmt(s.revenue - s.cost) + ' / ' + FB.Calc.fmt(s.revenue) + '</span></div>' +
      '<div class="report-row report-row-net"><span>Punto de equilibrio</span>' +
        '<span>' + (be !== null ? FB.Calc.fmt(be) : '—') + '</span></div>' +
      (be !== null ? '<div class="report-row muted"><span>Para cubrir ' + FB.Calc.fmt(fixedCosts) + ' en gastos fijos</span><span></span></div>' : '');
  }

  function renderChart(daily) {
    var canvas = document.getElementById('rep-chart');
    if (!canvas || !window.Chart) return;
    if (chart) { chart.destroy(); chart = null; }
    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: daily.map(function(d) { return d.day; }),
        datasets: [{ label: 'Ingresos', data: daily.map(function(d) { return d.revenue; }),
          backgroundColor: '#5F56AF', borderRadius: 4, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: function(v) { return '$' + v; } } }, x: { grid: { display: false } } }
      }
    });
  }

  function exportXLSX() {
    if (!window.XLSX) { FB.Toast.show('Librería de exportación no disponible', 'error'); return; }
    var products = FB.Storage.getProducts();
    var sales    = FB.Storage.getSales().filter(function(s) { return s.date.startsWith(currentMonth); });
    var map      = {};
    products.forEach(function(p) { map[p.id] = p; });

    var rows = [['Fecha','Producto','Cantidad','Precio Unit','Descuento %','Ingreso Neto','Costo Unit','Costo Total','Ganancia']];
    sales.sort(function(a, b) { return a.date.localeCompare(b.date); }).forEach(function(sale) {
      var disc = Number(sale.discountPct) || 0;
      sale.items.forEach(function(item) {
        var p = map[item.productId];
        if (!p) return;
        var unitNetPrice = p.price * (1 - disc / 100);
        rows.push([sale.date, p.name, item.qty, p.price, disc,
          unitNetPrice * item.qty, p.cost, p.cost * item.qty,
          (unitNetPrice - p.cost) * item.qty]);
      });
    });

    var ws = XLSX.utils.aoa_to_sheet(rows);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, FB.Calc.monthLabel(currentMonth));
    XLSX.writeFile(wb, 'flavias-bakery-' + currentMonth + '.xlsx');
    FB.Toast.show('Excel exportado 📥');
  }

  return {
    render: function(container) {
      currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));
      container.innerHTML =
        '<div class="view-header">' +
          '<div class="month-nav">' +
            '<button class="month-btn" id="rep-prev">‹</button>' +
            '<span class="month-title" id="rep-month-label"></span>' +
            '<button class="month-btn" id="rep-next">›</button>' +
          '</div>' +
          '<button class="btn btn-outline btn-sm" id="export-xlsx-btn">⬇ Excel</button>' +
        '</div>' +
        '<div id="report-content"></div>';

      document.getElementById('rep-prev').addEventListener('click', function() { currentMonth = FB.Calc.prevMonth(currentMonth); refresh(); });
      document.getElementById('rep-next').addEventListener('click', function() { currentMonth = FB.Calc.nextMonth(currentMonth); refresh(); });
      document.getElementById('export-xlsx-btn').addEventListener('click', exportXLSX);
      refresh();
    }
  };
})();

window.FB = FB;
