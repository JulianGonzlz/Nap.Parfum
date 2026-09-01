/* DRAWERS LATERALES
   Gestiona la apertura/cierre del menú de filtros y del carrito, asegurando que sean mutuamente excluyentes. */

// El drawer queda fuera de la vista hasta que la persona decide explorar el catalogo.
function cambiarMenu() {
	const estaAbierto = !menuLateral.classList.contains("abierto");
	if (estaAbierto) cerrarCarrito();
	menuLateral.classList.toggle("abierto", estaAbierto);
	actualizarEstadoDrawers();
}

function cerrarMenu() {
	menuLateral.classList.remove("abierto");
	actualizarEstadoDrawers();
}

function cerrarCarrito() {
	carrito.classList.remove("abierto");
	actualizarEstadoDrawers();
}

// Mantiene un solo drawer abierto y controla el overlay compartido por ambos.
function actualizarEstadoDrawers() {
	const menuAbierto = menuLateral.classList.contains("abierto");
	const carritoAbierto = carrito.classList.contains("abierto");
	overlay.classList.toggle("oculto", !menuAbierto && !carritoAbierto);
	document.body.classList.toggle("drawer-abierto", menuAbierto || carritoAbierto);
	menuLateral.setAttribute("aria-hidden", String(!menuAbierto));
	carrito.setAttribute("aria-hidden", String(!carritoAbierto));
	menuButton.setAttribute("aria-expanded", String(menuAbierto));
	cartButton.setAttribute("aria-expanded", String(carritoAbierto));
	actualizarVisibilidadHeader();
}

function cerrarDrawers() {
	menuLateral.classList.remove("abierto");
	carrito.classList.remove("abierto");
	actualizarEstadoDrawers();
}
