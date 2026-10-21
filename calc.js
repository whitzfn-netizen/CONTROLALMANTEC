/* Cálculos del negocio. Funciones puras: reciben las filas de la base de datos y devuelven cifras.
   Reglas:
   - Reparación: solo cuenta cuando está finalizada, en el mes de su fecha. Beneficio = facturado − pieza − otros costes.
     Cobrada solo si el pago está «pagado». Las pendientes o en proceso son dinero previsto, no facturado.
   - Móvil: solo cuenta cuando está vendido, en el mes de su fecha de venta.
     Beneficio = venta − compra − costes adicionales. Cobrado solo si tiene fecha de cobro.
     Un móvil sin vender es inventario: su compra no es coste ni su venta beneficio. */
(function (root) {
  'use strict';

  const cents = v => Math.round((Number(v) || 0) * 100);
  const eur = c => c / 100;
  const monthOf = d => (d ? String(d).slice(0, 7) : '');

  // Convierte una fila en operación con importes en céntimos (evita errores de redondeo al sumar).
  function repOp(r) {
    const fact = cents(r.facturado), pieza = cents(r.coste_pieza), otros = cents(r.otros_costes);
    const cobrado = r.estado_pago === 'pagado' ? fact : 0;
    return {
      kind: 'rep', id: r.id, fecha: r.fecha, mes: monthOf(r.fecha),
      titulo: r.modelo, detalle: r.cliente, desc: r.descripcion || '',
      fact, costeBase: pieza, otros, costes: pieza + otros, benef: fact - pieza - otros,
      cobrado, pendiente: fact - cobrado, estado: r.estado, pagado: r.estado_pago === 'pagado',
    };
  }

  function movOp(m) {
    if (m.estado !== 'vendido' || m.precio_venta == null || !m.fecha_venta) return null;
    const fact = cents(m.precio_venta), compra = cents(m.precio_compra), otros = cents(m.costes_adicionales);
    const cobrado = m.fecha_cobro ? fact : 0;
    return {
      kind: 'mov', id: m.id, fecha: m.fecha_venta, mes: monthOf(m.fecha_venta),
      titulo: [m.marca, m.modelo].filter(Boolean).join(' '), detalle: m.imei || '', desc: '',
      fact, costeBase: compra, otros, costes: compra + otros, benef: fact - compra - otros,
      cobrado, pendiente: fact - cobrado, estado: 'vendido', pagado: !!m.fecha_cobro,
    };
  }

  function operations(reps, movs) {
    const ops = reps.filter(r => r.estado === 'finalizada').map(repOp);
    for (const m of movs) { const o = movOp(m); if (o) ops.push(o); }
    return ops;
  }

  function emptyTotals() {
    return {
      repFact: 0, repPieza: 0, repOtros: 0, repBenef: 0, repN: 0, repCobrado: 0, repPend: 0,
      movFact: 0, movCompra: 0, movOtros: 0, movBenef: 0, movN: 0, movCobrado: 0, movPend: 0,
      fact: 0, costes: 0, benef: 0, cobrado: 0, pendiente: 0, n: 0,
    };
  }

  function addOp(t, o) {
    if (o.kind === 'rep') {
      t.repFact += o.fact; t.repPieza += o.costeBase; t.repOtros += o.otros; t.repBenef += o.benef;
      t.repN++; t.repCobrado += o.cobrado; t.repPend += o.pendiente;
    } else {
      t.movFact += o.fact; t.movCompra += o.costeBase; t.movOtros += o.otros; t.movBenef += o.benef;
      t.movN++; t.movCobrado += o.cobrado; t.movPend += o.pendiente;
    }
    t.fact += o.fact; t.costes += o.costes; t.benef += o.benef;
    t.cobrado += o.cobrado; t.pendiente += o.pendiente; t.n++;
    return t;
  }

  // Totales de una lista de operaciones (en céntimos). filter: (op) => boolean.
  function totals(ops, filter) {
    const t = emptyTotals();
    for (const o of ops) if (!filter || filter(o)) addOp(t, o);
    return t;
  }

  // Totales por mes 'AAAA-MM' → totales. Solo meses con operaciones.
  function byMonth(ops) {
    const map = new Map();
    for (const o of ops) {
      if (!o.mes) continue;
      if (!map.has(o.mes)) map.set(o.mes, emptyTotals());
      addOp(map.get(o.mes), o);
    }
    return map;
  }

  function byYear(ops) {
    const map = new Map();
    for (const o of ops) {
      const y = o.mes.slice(0, 4);
      if (!y) continue;
      if (!map.has(y)) map.set(y, emptyTotals());
      addOp(map.get(y), o);
    }
    return map;
  }

  // Lista continua de meses entre dos 'AAAA-MM' (incluidos), para que los gráficos no salten meses vacíos.
  function monthRange(from, to) {
    const out = [];
    if (!from || !to || from > to) return out;
    let [y, m] = from.split('-').map(Number);
    const [ty, tm] = to.split('-').map(Number);
    while (y < ty || (y === ty && m <= tm)) {
      out.push(`${y}-${String(m).padStart(2, '0')}`);
      if (++m > 12) { m = 1; y++; }
    }
    return out;
  }

  function lastMonths(endMonth, n) {
    let [y, m] = endMonth.split('-').map(Number);
    m -= n - 1;
    while (m < 1) { m += 12; y--; }
    return monthRange(`${y}-${String(m).padStart(2, '0')}`, endMonth);
  }

  // Inventario: móviles no vendidos y lo que hay invertido en ellos.
  function inventory(movs) {
    const inv = { disponibles: 0, reservados: 0, invertido: 0, invertidoDisp: 0, invertidoRes: 0 };
    for (const m of movs) {
      if (m.estado === 'vendido') continue;
      const c = cents(m.precio_compra) + cents(m.costes_adicionales);
      inv.invertido += c;
      if (m.estado === 'reservado') { inv.reservados++; inv.invertidoRes += c; }
      else { inv.disponibles++; inv.invertidoDisp += c; }
    }
    return inv;
  }

  // Compras de móviles por mes (dinero que sale para inventario; no es coste del beneficio hasta venderlo).
  function purchasesByMonth(movs) {
    const map = new Map();
    for (const m of movs) {
      const k = monthOf(m.fecha_compra);
      if (!k) continue;
      const e = map.get(k) || { n: 0, importe: 0 };
      e.n++; e.importe += cents(m.precio_compra) + cents(m.costes_adicionales);
      map.set(k, e);
    }
    return map;
  }

  // Reparaciones sin finalizar: lo que se espera facturar y ganar (no entra en ningún total).
  function forecast(reps, filter) {
    const f = { n: 0, fact: 0, costes: 0, benef: 0 };
    for (const r of reps) {
      if (r.estado === 'finalizada' || (filter && !filter(r))) continue;
      const o = repOp(r);
      f.n++; f.fact += o.fact; f.costes += o.costes; f.benef += o.benef;
    }
    return f;
  }

  const api = { forecast, cents, eur, monthOf, repOp, movOp, operations, totals, byMonth, byYear, monthRange, lastMonths, inventory, purchasesByMonth, emptyTotals };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Calc = api;
})(typeof window !== 'undefined' ? window : globalThis);
