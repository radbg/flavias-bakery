var FB = window.FB || {};

FB.Expenses = (function() {
  var EXP_CATEGORIES = ['Ingredientes extra','Empaques','Transporte','Servicios','Marketing','Otros'];
  var currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));

  function refresh() {
    var label = document.getElementById('exp-month-label');
    if (label) label.textContent = FB.Calc.monthLabel(currentMonth);

    var expenses = FB.Storage.getExpenses()
      .filter(function(e) { return e.date.startsWith(currentMonth); })
      .sort(function(a, b) { return b.date.localeCompare(a.date); });

    var total = expenses.reduce(function(s, e) { return s + Number(e.amount); }, 0);
    var bar = document.getElementById('exp-total');
    if (bar) bar.textContent = 'Total del mes: ' + FB.Calc.fmt(total);

    var list = document.getElementById('exp-list');
    if (!list) return;

    if (!expenses.length) {
      list.innerHTML = '<div class="empty-state"><p>Sin gastos este mes</p></div>';
      return;
    }

    list.innerHTML = expenses.map(function(e) {
      return '<div class="expense-row">' +
        '<div class="expense-info">' +
          '<span class="expense-desc">' + e.description + '</span>' +
          '<span class="badge badge-purple">' + e.category + '</span>' +
          '<span class="expense-date">' + e.date + '</span>' +
        '</div>' +
        '<div class="expense-right">' +
          '<span class="expense-amount">' + FB.Calc.fmt(e.amount) + '</span>' +
          '<div class="expense-actions">' +
            '<button class="btn btn-sm btn-outline" data-action="edit"   data-id="' + e.id + '">✏️</button>' +
            '<button class="btn btn-sm btn-danger"  data-action="delete" data-id="' + e.id + '">🗑</button>' +
          '</div>' +
        '</div></div>';
    }).join('');

    list.querySelectorAll('[data-action]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (btn.dataset.action === 'edit')   openExpenseForm(btn.dataset.id);
        if (btn.dataset.action === 'delete') {
          FB.Modal.confirm('¿Eliminar este gasto?', function() {
            FB.Storage.deleteExpense(btn.dataset.id);
            FB.Toast.show('Gasto eliminado');
            refresh();
          });
        }
      });
    });
  }

  function openExpenseForm(id) {
    var e = id ? FB.Storage.getExpenses().find(function(x) { return x.id === id; }) : null;
    var catOptions = EXP_CATEGORIES.map(function(c) {
      return '<option' + (e && e.category === c ? ' selected' : '') + '>' + c + '</option>';
    }).join('');

    var html =
      '<h3 class="modal-title">' + (e ? 'Editar gasto' : 'Nuevo gasto') + '</h3>' +
      '<div class="form-section"><label class="form-label">Fecha</label>' +
        '<input id="ef-date" type="date" class="form-input" value="' + (e ? e.date : FB.Calc.today()) + '"></div>' +
      '<div class="form-section"><label class="form-label">Descripción</label>' +
        '<input id="ef-desc" class="form-input" value="' + (e ? e.description : '') + '" placeholder="ej: Gas para cocina"></div>' +
      '<div class="form-section"><label class="form-label">Monto $</label>' +
        '<input id="ef-amount" type="number" class="form-input" step="0.01" min="0" value="' + (e ? e.amount : '') + '" placeholder="0.00"></div>' +
      '<div class="form-section"><label class="form-label">Categoría</label>' +
        '<select id="ef-cat" class="form-input">' + catOptions + '</select></div>';

    FB.Modal.open(html, function(overlay) {
      var desc   = overlay.querySelector('#ef-desc').value.trim();
      var amount = parseFloat(overlay.querySelector('#ef-amount').value);
      var date   = overlay.querySelector('#ef-date').value;
      var cat    = overlay.querySelector('#ef-cat').value;

      if (!desc || isNaN(amount) || amount <= 0) {
        FB.Toast.show('Completa descripción y monto', 'error'); return;
      }

      var data = { date: date, description: desc, amount: amount, category: cat };
      if (id) { FB.Storage.updateExpense(id, data); FB.Toast.show('Gasto actualizado'); }
      else    { FB.Storage.addExpense(data);         FB.Toast.show('Gasto agregado'); }

      FB.Modal.close();
      refresh();
    }, { confirmLabel: e ? 'Guardar' : 'Agregar' });
  }

  return {
    render: function(container) {
      currentMonth = FB.Calc.monthKey(new Date().toISOString().slice(0, 10));
      container.innerHTML =
        '<div class="view-header">' +
          '<div class="month-nav">' +
            '<button class="month-btn" id="exp-prev">‹</button>' +
            '<span class="month-title" id="exp-month-label"></span>' +
            '<button class="month-btn" id="exp-next">›</button>' +
          '</div>' +
          '<button class="btn btn-primary btn-sm" id="add-expense-btn">+ Agregar</button>' +
        '</div>' +
        '<div id="exp-list"></div>' +
        '<div class="expense-total-bar" id="exp-total"></div>';

      document.getElementById('exp-prev').addEventListener('click', function() { currentMonth = FB.Calc.prevMonth(currentMonth); refresh(); });
      document.getElementById('exp-next').addEventListener('click', function() { currentMonth = FB.Calc.nextMonth(currentMonth); refresh(); });
      document.getElementById('add-expense-btn').addEventListener('click', function() { openExpenseForm(null); });
      refresh();
    }
  };
})();

window.FB = FB;
