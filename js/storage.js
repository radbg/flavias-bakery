var FB = window.FB || {};

FB.Storage = (function() {
  var KEYS = {
    products:    'fb_products',
    sales:       'fb_sales',
    expenses:    'fb_expenses',
    fixedCosts:  'fb_fixed_costs'   // { "YYYY-MM": number }
  };

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }
  function loadObj(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  }
  function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  return {
    // ── Products ──────────────────────────────────────────────────────────────
    getProducts: function() { return load(KEYS.products); },
    saveProducts: function(d) { save(KEYS.products, d); },

    addProduct: function(p) {
      var products = load(KEYS.products);
      p.id = crypto.randomUUID();
      p.active = true;
      p.isSpecial   = p.isSpecial   || false;
      p.specialLabel = p.specialLabel || '';
      products.push(p);
      save(KEYS.products, products);
      return p;
    },
    updateProduct: function(id, updates) {
      save(KEYS.products,
        load(KEYS.products).map(function(p) { return p.id === id ? Object.assign({}, p, updates) : p; }));
    },
    deleteProduct: function(id) {
      var hasHistory = load(KEYS.sales).some(function(s) {
        return s.items.some(function(i) { return i.productId === id; });
      });
      if (hasHistory) return false;
      save(KEYS.products, load(KEYS.products).filter(function(p) { return p.id !== id; }));
      return true;
    },

    // ── Sales ─────────────────────────────────────────────────────────────────
    getSales: function() { return load(KEYS.sales); },
    addSale: function(sale) {
      var sales = load(KEYS.sales);
      sale.id = crypto.randomUUID();
      sales.push(sale);
      save(KEYS.sales, sales);
      return sale;
    },
    updateSale: function(id, updates) {
      save(KEYS.sales,
        load(KEYS.sales).map(function(s) { return s.id === id ? Object.assign({}, s, updates) : s; }));
    },
    deleteSale: function(id) {
      save(KEYS.sales, load(KEYS.sales).filter(function(s) { return s.id !== id; }));
    },
    getSaleByDate: function(date) {
      return load(KEYS.sales).find(function(s) { return s.date === date; }) || null;
    },
    getSalesByDate: function(date) {
      return load(KEYS.sales).filter(function(s) { return s.date === date; });
    },

    // ── Expenses ──────────────────────────────────────────────────────────────
    getExpenses: function() { return load(KEYS.expenses); },
    addExpense: function(e) {
      var expenses = load(KEYS.expenses);
      e.id = crypto.randomUUID();
      expenses.push(e);
      save(KEYS.expenses, expenses);
      return e;
    },
    updateExpense: function(id, updates) {
      save(KEYS.expenses,
        load(KEYS.expenses).map(function(e) { return e.id === id ? Object.assign({}, e, updates) : e; }));
    },
    deleteExpense: function(id) {
      save(KEYS.expenses, load(KEYS.expenses).filter(function(e) { return e.id !== id; }));
    },

    // ── Fixed Costs (Gastos Fijos) ────────────────────────────────────────────
    getFixedCost: function(monthStr) {
      return loadObj(KEYS.fixedCosts)[monthStr] || 0;
    },
    setFixedCost: function(monthStr, amount) {
      var all = loadObj(KEYS.fixedCosts);
      all[monthStr] = Number(amount) || 0;
      save(KEYS.fixedCosts, all);
    }
  };
})();

window.FB = FB;
