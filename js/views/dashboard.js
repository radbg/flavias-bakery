var FB = window.FB || {};

FB.Dashboard = (function() {
  var chart = null;
  var currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));

  function refresh() {
    var label = document.getElementById('dash-month-label');
    if (label) label.textContent = FB.Calc.monthLabel(currentMonth);

    var products = FB.Storage.getProducts();
    var sales = FB.Storage.getSales();
    var expenses = FB.Storage.getExpenses();
    var curr = FB.Calc.monthSummary(currentMonth, sales, expenses, products);
    var prev = FB.Calc.monthSummary(FB.Calc.prevMonth(currentMonth), sales, expenses, products);
    var daily = FB.Calc.dailyRevenue(currentMonth, sales, products);
    var top = FB.Calc.topProducts(currentMonth, sales, products, 5);
    var maxQty = top.length ? top[0].qty : 1;

    var netChange = prev.netProfit !== 0
      ? ((curr.netProfit - prev.netProfit) / Math.abs(prev.netProfit)) * 100 : null;

    var compareHTML = netChange !== null
      ? '<div class="stat-compare ' + (netChange >= 0 ? 'up' : 'down') + '">' +
          (netChange >= 0 ? '↑' : '↓') + ' ' + Math.abs(netChange).toFixed(1) + '% vs mes anterior</div>'
      : '<div class="stat-compare neutral">Primer mes registrado</div>';

    var topHTML = top.length === 0 ? '<p class="empty-msg">Sin ventas este mes</p>'
      : top.map(function(t) {
          return '<div class="top-product-row">' +
            '<div class="top-product-info"><span class="top-product-name">' + t.product.name + '</span>' +
            '<span class="top-product-qty">' + t.qty + ' uds</span></div>' +
            '<div class="progress-bar"><div class="progress-fill" style="width:' + ((t.qty / maxQty) * 100) + '%"></div></div></div>';
        }).join('');

    var content = document.getElementById('dash-content');
    if (!content) return;
    content.innerHTML =
      '<div class="stat-card stat-card-big ' + (curr.netProfit >= 0 ? 'positive' : 'negative') + '">' +
        '<div class="stat-label">Ganancia neta del mes</div>' +
        '<div class="stat-value big">' + FB.Calc.fmt(curr.netProfit) + '</div>' + compareHTML +
      '</div>' +
      '<div class="stat-grid">' +
        '<div class="stat-card"><div class="stat-label">Ingresos</div><div class="stat-value">' + FB.Calc.fmt(curr.revenue) + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">Costo total</div><div class="stat-value">' + FB.Calc.fmt(curr.cost) + '</div></div>' +
        '<div class="stat-card"><div class="stat-label">Ventas</div><div class="stat-value">' + curr.salesCount + '</div></div>' +
      '</div>' +
      '<div class="card"><div class="card-title">Ingresos por día</div><div class="chart-wrap"><canvas id="revenue-chart"></canvas></div></div>' +
      '<div class="card"><div class="card-title">Top 5 productos del mes</div>' + topHTML + '</div>';

    renderChart(daily);
  }

  function renderChart(daily) {
    var canvas = document.getElementById('revenue-chart');
    if (!canvas || !window.Chart) return;
    if (chart) { chart.destroy(); chart = null; }
    chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: daily.map(function(d) { return d.day; }),
        datasets: [{ label: 'Ingresos', data: daily.map(function(d) { return d.revenue; }),
          backgroundColor: '#9386CB', borderRadius: 4, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: function(v) { return '$' + v; } } }, x: { grid: { display: false } } }
      }
    });
  }

  return {
    render: function(container) {
      currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));
      container.innerHTML =
        '<div class="view-header"><div class="month-nav">' +
          '<button class="month-btn" id="dash-prev">‹</button>' +
          '<span class="month-title" id="dash-month-label"></span>' +
          '<button class="month-btn" id="dash-next">›</button>' +
        '</div></div>' +
        '<div class="dashboard-content" id="dash-content"></div>';

      document.getElementById('dash-prev').addEventListener('click', function() { currentMonth = FB.Calc.prevMonth(currentMonth); refresh(); });
      document.getElementById('dash-next').addEventListener('click', function() { currentMonth = FB.Calc.nextMonth(currentMonth); refresh(); });
      refresh();
    }
  };
})();

window.FB = FB;
