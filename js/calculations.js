var FB = window.FB || {};

FB.Calc = (function() {
  var monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return {
    margin: function(cost, price) { return price ? ((price - cost) / price) * 100 : 0; },
    fmt:    function(n) { return '$' + Number(n || 0).toFixed(2); },
    fmtPct: function(n) { return Number(n || 0).toFixed(1) + '%'; },
    today:  function() { return new Date().toISOString().slice(0, 10); },
    monthKey:    function(dateStr) { return String(dateStr).slice(0, 7); },
    daysInMonth: function(y, m) { return new Date(y, m, 0).getDate(); },

    // sale.discountPct (0-100) reduces revenue proportionally
    saleTotals: function(sale, products) {
      var map = {};
      products.forEach(function(p) { map[p.id] = p; });
      var revenue = 0, cost = 0;
      sale.items.forEach(function(item) {
        var p = map[item.productId];
        // Usar precio/costo del momento de la venta si está guardado,
        // o caer al catálogo actual (ventas antiguas sin snapshot)
        var unitPrice = (item.unitPrice !== undefined) ? item.unitPrice : (p ? p.price : 0);
        var unitCost  = (item.unitCost  !== undefined) ? item.unitCost  : (p ? p.cost  : 0);
        revenue += unitPrice * item.qty;
        cost    += unitCost  * item.qty;
      });
      var discountFactor = 1 - (Number(sale.discountPct) || 0) / 100;
      revenue = revenue * discountFactor;
      var delivery = Number(sale.delivery) || 0;
      return {
        revenue:     revenue,
        cost:        cost,
        delivery:    delivery,
        grossProfit: revenue - cost,
        net:         revenue - cost + delivery
      };
    },

    monthSummary: function(monthStr, sales, expenses, products) {
      var ms = sales.filter(function(s) { return s.date.startsWith(monthStr); });
      var me = expenses.filter(function(e) { return e.date.startsWith(monthStr); });
      var revenue = 0, cost = 0, delivery = 0, productTotals = {};
      var self = this;

      ms.forEach(function(sale) {
        var t = self.saleTotals(sale, products);
        revenue += t.revenue; cost += t.cost; delivery += t.delivery;
        sale.items.forEach(function(item) {
          if (!productTotals[item.productId])
            productTotals[item.productId] = { qty: 0, revenue: 0, cost: 0 };
          var p = products.find(function(x) { return x.id === item.productId; });
          var unitPrice = (item.unitPrice !== undefined) ? item.unitPrice : (p ? p.price : 0);
          var unitCost  = (item.unitCost  !== undefined) ? item.unitCost  : (p ? p.cost  : 0);
          var df = 1 - (Number(sale.discountPct) || 0) / 100;
          productTotals[item.productId].qty     += item.qty;
          productTotals[item.productId].revenue += unitPrice * item.qty * df;
          productTotals[item.productId].cost    += unitCost  * item.qty;
        });
      });

      var extraExpenses = me.reduce(function(s, e) { return s + Number(e.amount); }, 0);
      var grossProfit   = revenue - cost;
      var netProfit     = grossProfit + delivery - extraExpenses;
      // Margen de contribución = (ingresos - costos variables) / ingresos
      var contributionMargin = revenue > 0 ? (revenue - cost) / revenue : 0;

      return {
        revenue: revenue, cost: cost, delivery: delivery,
        grossProfit: grossProfit, extraExpenses: extraExpenses,
        netProfit: netProfit,
        marginPct: revenue > 0 ? (netProfit / revenue) * 100 : 0,
        contributionMargin: contributionMargin,
        salesCount: ms.length, productTotals: productTotals
      };
    },

    // gastos fijos / margen de contribución
    breakEven: function(fixedCosts, contributionMargin) {
      if (!contributionMargin || contributionMargin <= 0) return null;
      return fixedCosts / contributionMargin;
    },

    dailyRevenue: function(monthStr, sales, products) {
      var parts = monthStr.split('-');
      var days = this.daysInMonth(parseInt(parts[0]), parseInt(parts[1]));
      var result = [];
      for (var i = 1; i <= days; i++) result.push({ day: i, revenue: 0 });
      var self = this;
      sales.filter(function(s) { return s.date.startsWith(monthStr); }).forEach(function(sale) {
        var day = parseInt(sale.date.slice(8, 10), 10) - 1;
        result[day].revenue += self.saleTotals(sale, products).revenue;
      });
      return result;
    },

    topProducts: function(monthStr, sales, products, n) {
      n = n || 5;
      var summary = this.monthSummary(monthStr, sales, [], products);
      return Object.keys(summary.productTotals)
        .map(function(id) {
          var t = summary.productTotals[id];
          var p = products.find(function(x) { return x.id === id; });
          return Object.assign({ product: p }, t);
        })
        .filter(function(x) { return x.product; })
        .sort(function(a, b) { return b.qty - a.qty; })
        .slice(0, n);
    },

    prevMonth: function(m) {
      var p = m.split('-'), y = parseInt(p[0]), mo = parseInt(p[1]);
      return mo === 1 ? (y-1)+'-12' : y+'-'+String(mo-1).padStart(2,'0');
    },
    nextMonth: function(m) {
      var p = m.split('-'), y = parseInt(p[0]), mo = parseInt(p[1]);
      return mo === 12 ? (y+1)+'-01' : y+'-'+String(mo+1).padStart(2,'0');
    },
    monthLabel: function(m) {
      var p = m.split('-');
      return monthNames[parseInt(p[1])-1] + ' ' + p[0];
    }
  };
})();

window.FB = FB;
