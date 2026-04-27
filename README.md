# Flavia's Bakery — App de Gestión

PWA offline para gestionar ventas, productos y gastos de Flavia's Bakery.

## Cómo usar

Abre `index.html` en cualquier navegador, o sirve la carpeta con:

```bash
npx serve .
```

## Instalar como app (PWA)

### En iPhone / iPad (Safari)
1. Abre la app en Safari
2. Toca el botón **Compartir** (cuadrado con flecha ↑)
3. Desplázate y toca **"Agregar a pantalla de inicio"**
4. Toca **Agregar**

### En Android (Chrome)
1. Abre la app en Chrome
2. Toca los tres puntos del menú **⋮**
3. Toca **"Instalar aplicación"** o **"Agregar a pantalla de inicio"**

### En computador (Chrome / Edge)
1. Busca el ícono de instalación en la barra de dirección (⊕)
2. Haz clic en **"Instalar"**

---

## Backup y restauración de datos

Todos los datos se guardan en `localStorage` del navegador. Para hacer respaldo manual:

### Exportar backup

Abre la consola del navegador (`F12` → Consola) y ejecuta:

```js
const backup = {
  version: 1,
  exportedAt: new Date().toISOString(),
  products: JSON.parse(localStorage.getItem('fb_products') || '[]'),
  sales: JSON.parse(localStorage.getItem('fb_sales') || '[]'),
  expenses: JSON.parse(localStorage.getItem('fb_expenses') || '[]')
};
const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'flavias-bakery-backup-' + new Date().toISOString().slice(0,10) + '.json';
a.click();
```

### Restaurar desde backup

En la consola del navegador:

```js
// Pega el contenido del JSON aquí
const data = { /* ... contenido del archivo backup ... */ };
if (data.products) localStorage.setItem('fb_products', JSON.stringify(data.products));
if (data.sales) localStorage.setItem('fb_sales', JSON.stringify(data.sales));
if (data.expenses) localStorage.setItem('fb_expenses', JSON.stringify(data.expenses));
location.reload();
```

> **Recomendación:** hacer backup una vez por semana. Los datos se pierden si se borra el caché del navegador.
