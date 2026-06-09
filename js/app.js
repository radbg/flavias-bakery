// ─── Seed data ────────────────────────────────────────────────────────────────
var SEED_PRODUCTS = [
  { name: "Chocochips x10", category: "Galletas", cost: 2.70, price: 6.00 },
  { name: "Chocochips x5", category: "Galletas", cost: 1.30, price: 3.00 },
  { name: "Mini Chocochips x20", category: "Minis", cost: 2.70, price: 8.00 },
  { name: "Mini Chocochips x10", category: "Minis", cost: 1.50, price: 4.00 },
  { name: "Brownie x1", category: "Brownies", cost: 1.03, price: 2.50 },
  { name: "Mini Brownies x45", category: "Brownies", cost: 6.80, price: 20.00 },
  { name: "Mini Brownies x10", category: "Brownies", cost: 1.30, price: 5.00 },
  { name: "Brownies Decorados x12", category: "Brownies", cost: 2.89, price: 7.00 },
  { name: "Marquesa Ferrero x1", category: "Marquesas", cost: 2.80, price: 5.50 },
  { name: "Marquesa Ferrero Med", category: "Marquesas", cost: 16.60, price: 34.00 },
  { name: "Marquesa Ferrero Fam", category: "Marquesas", cost: 33.20, price: 67.00 },
  { name: "Marquesa Oreo x1", category: "Marquesas", cost: 2.18, price: 5.50 },
  { name: "Marquesa Oreo Med", category: "Marquesas", cost: 13.10, price: 30.00 },
  { name: "Marquesa Oreo Fam", category: "Marquesas", cost: 26.20, price: 54.00 },
  { name: "Marquesa Reese's x1", category: "Marquesas", cost: 1.50, price: 4.50 },
  { name: "Marquesa Reese's Med", category: "Marquesas", cost: 7.50, price: 23.00 },
  { name: "Marquesa Reese's Fam", category: "Marquesas", cost: 14.93, price: 40.00 },
  { name: "Marquesa Chocolate x1", category: "Marquesas", cost: 2.00, price: 5.50 },
  { name: "Marquesa Ovomaltina x1", category: "Marquesas", cost: 1.84, price: 5.50 },
  { name: "Marquesa Ovomaltina Med", category: "Marquesas", cost: 11.03, price: 27.00 },
  { name: "Marquesa Ovomaltina Fam", category: "Marquesas", cost: 22.05, price: 50.00 },
  { name: "Galleta Nutella x1", category: "Galletas Rellenas", cost: 0.80, price: 2.50 },
  { name: "Galleta Arequipe x1", category: "Galletas Rellenas", cost: 0.55, price: 2.00 },
  { name: "Galleta Pistacho x1", category: "Galletas Rellenas", cost: 1.30, price: 3.00 },
  { name: "Galleta Ferrero x1", category: "Galletas Rellenas", cost: 1.42, price: 3.00 },
  { name: "Galleta Ovomaltina x1", category: "Galletas Rellenas", cost: 0.66, price: 2.00 },
  { name: "Galletas M&M's x5", category: "Galletas", cost: 1.85, price: 5.00 },
  { name: "Galletas Colores x20 mini", category: "Galletas", cost: 1.13, price: 5.00 },
  { name: "Galletas Colores x5 (20gr)", category: "Galletas", cost: 0.57, price: 2.00 },
  { name: "Galleta Dubai x1", category: "Galletas Rellenas", cost: 0.88, price: 3.00 },
  { name: "Salty Cookie x1", category: "Galletas", cost: 0.46, price: 1.75 },
  { name: "Biscottis 200gr", category: "Galletas", cost: 3.00, price: 7.00 },
  { name: "Pie de Limón x1", category: "Postres", cost: 1.37, price: 4.00 },
  { name: "Pie de Limón Med", category: "Postres", cost: 8.20, price: 24.00 },
  { name: "Pie de Limón Fam", category: "Postres", cost: 16.40, price: 34.00 },
  { name: "Tiramisú x1", category: "Postres", cost: 1.23, price: 5.00 },
  { name: "Tiramisú Med", category: "Postres", cost: 14.28, price: 28.00 },
  { name: "Tiramisú Fam", category: "Postres", cost: 28.57, price: 55.00 },
  { name: "Tres Leches x1", category: "Postres", cost: 2.14, price: 5.00 },
  { name: "Tres Leches Med", category: "Postres", cost: 11.27, price: 24.00 },
  { name: "Tres Leches Fam", category: "Postres", cost: 21.80, price: 42.00 },
  { name: "Crocante Manzana Med", category: "Postres", cost: 9.35, price: 27.00 },
  { name: "Crocante Manzana Fam", category: "Postres", cost: 18.70, price: 52.00 },
  { name: "Cookie Cake Med", category: "Tortas", cost: 12.04, price: 26.00 },
  { name: "Torta Galleta Fam", category: "Tortas", cost: 22.30, price: 47.00 },
  { name: "Mini Cookie Cake", category: "Tortas", cost: 3.25, price: 8.00 },
  { name: "Healthy Brownie x1", category: "Saludables", cost: 1.99, price: 5.00 },
  { name: "Galletas Sin Azúcar x5", category: "Saludables", cost: 3.32, price: 8.00 },
  { name: "Galletas Sin Azúcar x10", category: "Saludables", cost: 7.45, price: 16.00 },
  { name: "Rellenas Sin Azúcar x2", category: "Saludables", cost: 4.40, price: 9.00 },
  { name: "Picnic Box Peq", category: "Boxes", cost: 2.40, price: 8.00 },
  { name: "Picnic Box Med", category: "Boxes", cost: 4.82, price: 16.00 },
  { name: "Picnic Box Fam", category: "Boxes", cost: 7.23, price: 24.00 },
  { name: "Minis + Dip", category: "Minis", cost: 2.44, price: 7.50 },
  { name: "Cocosette Cookie x1", category: "Galletas", cost: 0.32, price: 2.00 },
  { name: "Minis Variadas x20", category: "Minis", cost: 1.57, price: 6.00 },
  { name: "Minis Variadas x30", category: "Minis", cost: 2.35, price: 9.00 },
  { name: "Minis Variadas x40", category: "Minis", cost: 3.14, price: 12.00 },
  { name: "Tres Leches Ponche Med", category: "Postres", cost: 14.02, price: 36.00 },
  { name: "Tres Leches Ponche Fam", category: "Postres", cost: 19.00, price: 50.00 },
  { name: "Tiramisu pistacho ración", category: "Postres", cost: 3.82, price: 7.00 },
  { name: "Tiramisu Pistacho Mediano", category: "Postres", cost: 16.00, price: 35.00 },
  { name: "Tiramisu Pistacho Fam", category: "Postres", cost: 33.90, price: 65.00 },
  { name: "Kit Decorar Grande", category: "Kits", cost: 4.43, price: 11.00 },
  { name: "Kit Decorar Pequeño", category: "Kits", cost: 3.26, price: 8.00 },
  { name: "Torta Zanahoria", category: "Tortas", cost: 8.62, price: 25.00 },
  { name: "Banana Bread Healthy", category: "Saludables", cost: 15.61, price: 32.00 },
  { name: "Lata 10 mini chocochips", category: "Temporada", cost: 3.25, price: 6.00, isSpecial: true, specialLabel: "San Valentín" },
  { name: "Lata 20 mini chocochips", category: "Temporada", cost: 6.00, price: 10.00, isSpecial: true, specialLabel: "San Valentín" },
  { name: "Brownie corazon", category: "Temporada", cost: 2.34, price: 5.00, isSpecial: true, specialLabel: "San Valentín" },
  { name: "12 mini brownies decorados", category: "Temporada", cost: 3.00, price: 7.00, isSpecial: true, specialLabel: "San Valentín" },
  { name: "Valentines cake mini", category: "Temporada", cost: 5.17, price: 8.00, isSpecial: true, specialLabel: "San Valentín" },
  { name: "Valentines cake regular", category: "Temporada", cost: 10.00, price: 17.00, isSpecial: true, specialLabel: "San Valentín" },
  { name: "Caja galletas sin azucar", category: "Temporada", cost: 7.45, price: 15.00, isSpecial: true, specialLabel: "San Valentín" },
  { name: "12 chocochips decoradas", category: "Temporada", cost: 4.00, price: 9.00, isSpecial: true, specialLabel: "San Valentín" },
  { name: "Cookie cake corazon mini", category: "Temporada", cost: 2.10, price: 6.50, isSpecial: true, specialLabel: "San Valentín" }
];

function seedIfEmpty() {
  if (FB.Storage.getProducts().length === 0) {
    var seeded = SEED_PRODUCTS.map(function(p) {
      return Object.assign({ id: crypto.randomUUID(), active: true, isSpecial: false, specialLabel: '' }, p);
    });
    FB.Storage.saveProducts(seeded);
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
var _currentView   = 'dashboard';
var _currentParams = {};

function navigate(view, params) {
  params = params || {};
  _currentView   = view;
  _currentParams = params;
  var container = document.getElementById('main-content');
  container.innerHTML = '';
  FB.Nav.render(view, navigate);

  switch (view) {
    case 'dashboard':      FB.Dashboard.render(container);            break;
    case 'register':       FB.RegisterSale.render(container, params); break;
    case 'history':        FB.History.render(container, navigate);    break;
    case 'catalog':        FB.Catalog.render(container);              break;
    case 'expenses':       FB.Expenses.render(container);             break;
    case 'monthly-report': FB.MonthlyReport.render(container);        break;
    case 'zelle':          FB.Zelle.render(container);                break;
    default:               FB.Dashboard.render(container);
  }
}

// Vistas de solo lectura que se pueden refrescar automáticamente al recibir datos
var AUTO_REFRESH_VIEWS = ['dashboard', 'history', 'monthly-report', 'expenses', 'zelle'];

function rerender() {
  if (AUTO_REFRESH_VIEWS.indexOf(_currentView) !== -1) {
    navigate(_currentView, _currentParams);
  }
}

// Exportar para uso externo (ej. desde nav.js)
window.FB = window.FB || {};
FB.App = { navigate: navigate, rerender: rerender };

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function showLoginScreen() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

function showAuthError(msg) {
  var el = document.getElementById('login-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function clearAuthError() {
  var el = document.getElementById('login-error');
  if (el) el.style.display = 'none';
}

// ─── Firebase init ────────────────────────────────────────────────────────────
function initFirebase() {
  if (!window.FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey === 'REEMPLAZAR') return false;
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    return true;
  } catch(e) {
    console.warn('Firebase init failed:', e);
    return false;
  }
}

function startApp(user) {
  var db = firebase.firestore();
  FB.Storage.init(db, user.uid, rerender);

  var entered = false;
  function enterApp() {
    if (entered) return;
    entered = true;
    showApp();
    seedIfEmpty();
    navigate('dashboard');
  }

  FB.Storage.onReady(function() {
    // Intentar migración en segundo plano, pero NO bloquear la entrada a la app
    try { migrateOldData(db, user.uid, function() {}); } catch (e) { console.error(e); }
    enterApp();
  });
  // Respaldo: si Firestore tarda en responder, entrar igual a los 5s
  setTimeout(enterApp, 5000);
}

function migrateOldData(db, userId, done) {
  // Si ya se migró antes, saltar
  if (localStorage.getItem('fb_migrated')) { done(); return; }

  var oldId = localStorage.getItem('fb_bakery_id');
  if (!oldId) { done(); return; }

  var oldRef = db.collection('bakeries').doc(oldId);

  // Verificar si hay datos en la cuenta nueva ya
  var newRef = db.collection('users').doc(userId);
  newRef.get().then(function(newDoc) {
    // Si ya tiene productos en la cuenta nueva, no migrar
    if (newDoc.exists && (newDoc.data().products || []).length > 0) {
      localStorage.setItem('fb_migrated', '1');
      done();
      return;
    }

    // Leer datos viejos
    oldRef.get().then(function(oldDoc) {
      if (!oldDoc.exists) { done(); return; }

      var data = oldDoc.data();
      var products   = data.products   || [];
      var fixedCosts = data.fixedCosts || {};

      if (products.length === 0) { done(); return; }

      // Copiar documento principal
      var batch = db.batch();
      batch.set(newRef, { products: products, fixedCosts: fixedCosts }, { merge: true });

      // Copiar ventas
      oldRef.collection('sales').get().then(function(salesSnap) {
        salesSnap.docs.forEach(function(d) {
          batch.set(newRef.collection('sales').doc(d.id), d.data());
        });

        // Copiar gastos
        oldRef.collection('expenses').get().then(function(expSnap) {
          expSnap.docs.forEach(function(d) {
            batch.set(newRef.collection('expenses').doc(d.id), d.data());
          });

          batch.commit().then(function() {
            localStorage.setItem('fb_migrated', '1');
            var total = salesSnap.size;
            FB.Toast.show('✅ ' + products.length + ' productos y ' + total + ' ventas recuperadas');
            done();
          }).catch(function(e) {
            console.error('Migration error:', e);
            done();
          });
        });
      });
    }).catch(function() { done(); });
  }).catch(function() { done(); });
}

// ─── PWA install banner ───────────────────────────────────────────────────────
var deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  deferredPrompt = e;
  if (!localStorage.getItem('fb_install_dismissed')) {
    var banner = document.getElementById('install-banner');
    if (banner) banner.style.display = 'flex';
  }
});

// ─── Visibilidad de errores (para diagnóstico) ────────────────────────────────
window.addEventListener('error', function(e) {
  try { if (FB.Toast) FB.Toast.show('⚠️ ' + (e.message || 'Error'), 'error'); } catch(_) {}
});
window.addEventListener('unhandledrejection', function(e) {
  try {
    var msg = e.reason && (e.reason.message || e.reason.code) || e.reason || 'Error';
    if (FB.Toast) FB.Toast.show('⚠️ ' + msg, 'error');
  } catch(_) {}
});

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var firebaseOk = initFirebase();

  if (!firebaseOk) {
    // Sin Firebase: modo localStorage directo
    showApp();
    seedIfEmpty();
    navigate('dashboard');
  } else {
    // Mostrar login mientras se verifica la sesión
    showLoginScreen();

    // Escuchar cambios de sesión
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // Sesión activa → entrar a la app
        startApp(user);
      } else {
        // Sin sesión → mostrar pantalla de login
        showLoginScreen();
      }
    });

    // ── Botones del login ──────────────────────────────────────────────────────
    var loginForm    = document.getElementById('login-form');
    var registerForm = document.getElementById('register-form');

    document.getElementById('forgot-btn').addEventListener('click', function() {
      var email = document.getElementById('login-email').value.trim();
      if (!email) { showAuthError('Escribe tu correo arriba y luego toca este botón'); return; }
      clearAuthError();
      var btn = this;
      btn.textContent = 'Enviando...';
      btn.disabled = true;
      firebase.auth().sendPasswordResetEmail(email)
        .then(function() {
          btn.textContent = '✅ Correo enviado';
          showAuthError('Revisa tu bandeja de entrada (o spam) para restablecer tu contraseña');
        })
        .catch(function(e) {
          btn.textContent = 'Olvidé mi contraseña';
          btn.disabled = false;
          if (e.code === 'auth/user-not-found') {
            showAuthError('No existe una cuenta con ese correo');
          } else {
            showAuthError('Error al enviar: ' + e.message);
          }
        });
    });

    document.getElementById('show-register-btn').addEventListener('click', function() {
      clearAuthError();
      loginForm.style.display    = 'none';
      registerForm.style.display = 'flex';
    });
    document.getElementById('show-login-btn').addEventListener('click', function() {
      clearAuthError();
      registerForm.style.display = 'none';
      loginForm.style.display    = 'flex';
    });

    document.getElementById('login-btn').addEventListener('click', function() {
      var email = document.getElementById('login-email').value.trim();
      var pass  = document.getElementById('login-password').value;
      if (!email || !pass) { showAuthError('Completa todos los campos'); return; }
      clearAuthError();
      this.textContent = 'Entrando...';
      var btn = this;
      firebase.auth().signInWithEmailAndPassword(email, pass)
        .catch(function(e) {
          btn.textContent = 'Entrar';
          var msg;
          switch (e.code) {
            case 'auth/user-not-found':
              msg = 'No existe una cuenta con ese correo. ¿Olvidaste registrarte?'; break;
            case 'auth/wrong-password':
              msg = 'Contraseña incorrecta'; break;
            case 'auth/invalid-credential':
              msg = 'Correo o contraseña incorrectos'; break;
            case 'auth/invalid-email':
              msg = 'Formato de correo inválido'; break;
            case 'auth/too-many-requests':
              msg = 'Demasiados intentos fallidos. Espera unos minutos o restablece tu contraseña'; break;
            case 'auth/operation-not-allowed':
              msg = 'Error de configuración: activa "Email/Password" en Firebase Console → Authentication → Sign-in method'; break;
            case 'auth/network-request-failed':
              msg = 'Sin conexión. Revisa tu internet e intenta de nuevo'; break;
            default:
              msg = 'Error al iniciar sesión (' + e.code + ')';
          }
          showAuthError(msg);
        });
    });

    document.getElementById('register-btn').addEventListener('click', function() {
      var email = document.getElementById('reg-email').value.trim();
      var pass  = document.getElementById('reg-password').value;
      var pass2 = document.getElementById('reg-password2').value;
      if (!email || !pass) { showAuthError('Completa todos los campos'); return; }
      if (pass.length < 6)  { showAuthError('La contraseña debe tener al menos 6 caracteres'); return; }
      if (pass !== pass2)   { showAuthError('Las contraseñas no coinciden'); return; }
      clearAuthError();
      var btn = this;
      btn.textContent = 'Creando cuenta...';
      firebase.auth().createUserWithEmailAndPassword(email, pass)
        .catch(function(e) {
          btn.textContent = 'Crear cuenta';
          if (e.code === 'auth/email-already-in-use') {
            showAuthError('Ese correo ya tiene una cuenta. Inicia sesión.');
          } else {
            showAuthError(e.message);
          }
        });
    });

    // Enter key en los campos
    ['login-email','login-password'].forEach(function(id) {
      document.getElementById(id).addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('login-btn').click();
      });
    });
    ['reg-email','reg-password','reg-password2'].forEach(function(id) {
      document.getElementById(id).addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('register-btn').click();
      });
    });
  }

  // ── Install banner ──────────────────────────────────────────────────────────
  var dismissBtn = document.getElementById('install-dismiss');
  var installBtn = document.getElementById('install-do');
  if (dismissBtn) dismissBtn.addEventListener('click', function() {
    document.getElementById('install-banner').style.display = 'none';
    localStorage.setItem('fb_install_dismissed', '1');
  });
  if (installBtn) installBtn.addEventListener('click', function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function() {
        deferredPrompt = null;
        document.getElementById('install-banner').style.display = 'none';
      });
    }
  });

  if ('serviceWorker' in navigator) {
    // Auto-recargar cuando un service worker nuevo toma el control
    var swRefreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (swRefreshing) return;
      swRefreshing = true;
      window.location.reload();
    });
    navigator.serviceWorker.register('service-worker.js').then(function(reg) {
      if (reg && reg.update) reg.update();   // chequear si hay versión nueva
    });
  }
});
