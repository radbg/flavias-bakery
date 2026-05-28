var FB = window.FB || {};

FB.Storage = (function() {

  // ── Modo local (localStorage) — fallback cuando no hay Firebase ──────────────
  var KEYS = {
    products:   'fb_products',
    sales:      'fb_sales',
    expenses:   'fb_expenses',
    fixedCosts: 'fb_fixed_costs'
  };

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e) { return []; }
  }
  function loadObj(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch(e) { return {}; }
  }
  function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  // ── Modo Firestore ────────────────────────────────────────────────────────────
  var _db           = null;
  var _bakeryRef    = null;
  var _onUpdate     = null;   // callback para re-renderizar la UI al recibir cambios
  var _ready        = false;
  var _onReadyCbs   = [];     // callbacks que se disparan una sola vez al cargar datos

  // Caché en memoria — lectura siempre instantánea y sin bloques async
  var _cache = { products: [], sales: [], expenses: [], fixedCosts: {} };

  function _notify(isFirst) {
    if (isFirst) {
      _onReadyCbs.forEach(function(cb) { cb(); });
      _onReadyCbs = [];
    }
    if (_onUpdate) _onUpdate();
  }

  // ── Inicialización Firestore ──────────────────────────────────────────────────
  function init(db, userId, onUpdate) {
    _db       = db;
    _onUpdate = onUpdate;
    _bakeryRef = db.collection('users').doc(userId);

    // Persistencia offline (IndexedDB) — funciona igual que localStorage pero sincroniza
    db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
      if (err.code === 'failed-precondition') console.warn('Firestore: multiple tabs open');
      else if (err.code === 'unimplemented') console.warn('Firestore: offline not supported in this browser');
    });

    // Escuchar productos y gastos fijos (documento principal)
    _bakeryRef.onSnapshot(function(doc) {
      if (doc.exists) {
        var data = doc.data();
        _cache.products   = data.products   || [];
        _cache.fixedCosts = data.fixedCosts || {};
        // Sincronizar también a localStorage para un fallback extra
        save(KEYS.products,   _cache.products);
        save(KEYS.fixedCosts, _cache.fixedCosts);
      } else {
        // Primera vez: migrar datos de localStorage a Firestore
        _migrateFromLocalStorage();
      }
      var firstLoad = !_ready;
      _ready = true;
      _notify(firstLoad);
    }, function(err) {
      console.error('Firestore error:', err);
      // Si Firestore falla, usar localStorage como fallback
      _cache.products   = load(KEYS.products);
      _cache.fixedCosts = loadObj(KEYS.fixedCosts);
      var firstLoad = !_ready;
      _ready = true;
      _notify(firstLoad);
    });

    // Escuchar ventas (subcolección)
    _bakeryRef.collection('sales')
      .orderBy('date', 'desc')
      .onSnapshot(function(snap) {
        _cache.sales = snap.docs.map(function(d) {
          return Object.assign({ id: d.id }, d.data());
        });
        save(KEYS.sales, _cache.sales);
        if (_ready) _notify();
      });

    // Escuchar gastos extras (subcolección)
    _bakeryRef.collection('expenses')
      .onSnapshot(function(snap) {
        _cache.expenses = snap.docs.map(function(d) {
          return Object.assign({ id: d.id }, d.data());
        });
        save(KEYS.expenses, _cache.expenses);
        if (_ready) _notify();
      });
  }

  function _migrateFromLocalStorage() {
    var localProducts   = load(KEYS.products);
    var localSales      = load(KEYS.sales);
    var localExpenses   = load(KEYS.expenses);
    var localFixedCosts = loadObj(KEYS.fixedCosts);

    // Subir documento principal
    _bakeryRef.set({
      products:   localProducts,
      fixedCosts: localFixedCosts,
      createdAt:  firebase.firestore.FieldValue.serverTimestamp()
    });

    // Subir ventas como documentos individuales
    var batch = _db.batch();
    localSales.forEach(function(sale) {
      var ref = _bakeryRef.collection('sales').doc(sale.id);
      batch.set(ref, sale);
    });
    // Subir gastos
    localExpenses.forEach(function(exp) {
      var ref = _bakeryRef.collection('expenses').doc(exp.id);
      batch.set(ref, exp);
    });
    batch.commit().catch(function(err) { console.error('Migration error:', err); });
  }

  function isFirestore() { return _db !== null; }

  // ── API pública (misma interfaz que antes) ────────────────────────────────────
  return {
    init: init,
    isFirestoreMode: function() { return isFirestore(); },
    isReady: function() { return !isFirestore() || _ready; },
    onReady: function(cb) {
      if (_ready) cb();
      else _onReadyCbs.push(cb);
    },

    // ── Products ────────────────────────────────────────────────────────────────
    getProducts: function() {
      return isFirestore() ? _cache.products : load(KEYS.products);
    },
    saveProducts: function(products) {
      if (isFirestore()) {
        _cache.products = products;
        _bakeryRef.set({ products: products }, { merge: true });
      } else {
        save(KEYS.products, products);
      }
    },
    addProduct: function(p) {
      p.id           = crypto.randomUUID();
      p.active       = true;
      p.isSpecial    = p.isSpecial    || false;
      p.specialLabel = p.specialLabel || '';
      var products = this.getProducts();
      products.push(p);
      this.saveProducts(products);
      return p;
    },
    updateProduct: function(id, updates) {
      var products = this.getProducts().map(function(p) {
        return p.id === id ? Object.assign({}, p, updates) : p;
      });
      this.saveProducts(products);
    },
    deleteProduct: function(id) {
      var hasHistory = this.getSales().some(function(s) {
        return s.items.some(function(i) { return i.productId === id; });
      });
      if (hasHistory) return false;
      this.saveProducts(this.getProducts().filter(function(p) { return p.id !== id; }));
      return true;
    },

    // ── Sales ───────────────────────────────────────────────────────────────────
    getSales: function() {
      return isFirestore() ? _cache.sales : load(KEYS.sales);
    },
    addSale: function(sale) {
      sale.id = crypto.randomUUID();
      if (isFirestore()) {
        _cache.sales.push(sale);
        _bakeryRef.collection('sales').doc(sale.id).set(sale);
      } else {
        var sales = load(KEYS.sales);
        sales.push(sale);
        save(KEYS.sales, sales);
      }
      return sale;
    },
    updateSale: function(id, updates) {
      if (isFirestore()) {
        _cache.sales = _cache.sales.map(function(s) {
          return s.id === id ? Object.assign({}, s, updates) : s;
        });
        _bakeryRef.collection('sales').doc(id).update(updates);
      } else {
        save(KEYS.sales, load(KEYS.sales).map(function(s) {
          return s.id === id ? Object.assign({}, s, updates) : s;
        }));
      }
    },
    deleteSale: function(id) {
      if (isFirestore()) {
        _cache.sales = _cache.sales.filter(function(s) { return s.id !== id; });
        _bakeryRef.collection('sales').doc(id).delete();
      } else {
        save(KEYS.sales, load(KEYS.sales).filter(function(s) { return s.id !== id; }));
      }
    },
    getSaleByDate: function(date) {
      return this.getSales().find(function(s) { return s.date === date; }) || null;
    },
    getSalesByDate: function(date) {
      return this.getSales().filter(function(s) { return s.date === date; });
    },

    // ── Expenses ────────────────────────────────────────────────────────────────
    getExpenses: function() {
      return isFirestore() ? _cache.expenses : load(KEYS.expenses);
    },
    addExpense: function(e) {
      e.id = crypto.randomUUID();
      if (isFirestore()) {
        _cache.expenses.push(e);
        _bakeryRef.collection('expenses').doc(e.id).set(e);
      } else {
        var expenses = load(KEYS.expenses);
        expenses.push(e);
        save(KEYS.expenses, expenses);
      }
      return e;
    },
    updateExpense: function(id, updates) {
      if (isFirestore()) {
        _cache.expenses = _cache.expenses.map(function(e) {
          return e.id === id ? Object.assign({}, e, updates) : e;
        });
        _bakeryRef.collection('expenses').doc(id).update(updates);
      } else {
        save(KEYS.expenses, load(KEYS.expenses).map(function(e) {
          return e.id === id ? Object.assign({}, e, updates) : e;
        }));
      }
    },
    deleteExpense: function(id) {
      if (isFirestore()) {
        _cache.expenses = _cache.expenses.filter(function(e) { return e.id !== id; });
        _bakeryRef.collection('expenses').doc(id).delete();
      } else {
        save(KEYS.expenses, load(KEYS.expenses).filter(function(e) { return e.id !== id; }));
      }
    },

    // ── Fixed Costs ─────────────────────────────────────────────────────────────
    getFixedCost: function(monthStr) {
      var fc = isFirestore() ? _cache.fixedCosts : loadObj(KEYS.fixedCosts);
      return fc[monthStr] || 0;
    },
    setFixedCost: function(monthStr, amount) {
      if (isFirestore()) {
        _cache.fixedCosts[monthStr] = Number(amount) || 0;
        var upd = {};
        upd['fixedCosts.' + monthStr] = Number(amount) || 0;
        _bakeryRef.set(upd, { merge: true });
      } else {
        var all = loadObj(KEYS.fixedCosts);
        all[monthStr] = Number(amount) || 0;
        save(KEYS.fixedCosts, all);
      }
    },

    // ── Backup (mantener por si acaso) ──────────────────────────────────────────
    exportBackup: function() {
      var data = {
        version:    2,
        exportedAt: new Date().toISOString(),
        products:   this.getProducts(),
        sales:      this.getSales(),
        expenses:   this.getExpenses(),
        fixedCosts: isFirestore() ? _cache.fixedCosts : loadObj(KEYS.fixedCosts)
      };
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href     = url;
      a.download = 'flavias-bakery-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    },
    importBackup: function(file, onSuccess, onError) {
      var self = this;
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var data = JSON.parse(e.target.result);
          if (!data.products || !data.sales) throw new Error('Archivo inválido');
          self.saveProducts(data.products);
          // Re-upload sales and expenses via individual writes
          if (isFirestore()) {
            var batch = _db.batch();
            // Delete existing then re-add (simple approach)
            (data.sales || []).forEach(function(s) {
              batch.set(_bakeryRef.collection('sales').doc(s.id), s);
            });
            (data.expenses || []).forEach(function(exp) {
              batch.set(_bakeryRef.collection('expenses').doc(exp.id), exp);
            });
            batch.commit().then(function() {
              if (onSuccess) onSuccess();
            }).catch(function(err) {
              if (onError) onError(err.message);
            });
          } else {
            save(KEYS.sales,      data.sales      || []);
            save(KEYS.expenses,   data.expenses   || []);
            save(KEYS.fixedCosts, data.fixedCosts || {});
            if (onSuccess) onSuccess();
          }
        } catch(err) {
          if (onError) onError(err.message);
        }
      };
      reader.readAsText(file);
    }
  };
})();

window.FB = FB;
