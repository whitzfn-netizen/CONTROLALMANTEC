# Control del negocio · Almantec

Panel privado para llevar las reparaciones y la compraventa de móviles de Almantec: facturado, cobrado, costes, beneficio, inventario, resumen mensual y total general.

- Web: https://whitzfn-netizen.github.io/CONTROLALMANTEC/
- Datos: un archivo cifrado (`datos.json`) en la rama `datos` de este repositorio. Sin la clave del negocio no se puede leer.
- Sin servidores ni dependencias: `index.html`, `app.js`, `calc.js` y `config.js`.

Puesta en marcha, token, importación y copias de seguridad: ver [GUIA.md](GUIA.md).

## Reglas de cálculo

- Una reparación solo suma a facturado y beneficio cuando está **finalizada**. Antes es dinero previsto.
- Cobrado = reparaciones finalizadas y pagadas + móviles vendidos y cobrados.
- Un móvil cuenta en el mes de su **venta**. Si no está vendido es inventario (dinero invertido), no beneficio.
- Beneficio = facturado − coste de pieza − otros costes (reparaciones); precio de venta − precio de compra − costes adicionales (móviles).
- Todo se calcula en céntimos para evitar errores de redondeo.
