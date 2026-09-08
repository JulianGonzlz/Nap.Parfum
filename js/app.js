/* INICIALIZACIÓN Y EVENT LISTENERS PRINCIPALES
   Este archivo se carga ÚLTIMO y conecta todos los módulos funcionales. */

// Event listeners para navegación y drawers
menuButton.addEventListener("click", cambiarMenu);
cartButton.addEventListener("click", mostrarCarrito);
cartBackButton.addEventListener("click", cerrarCarrito);
closeMenuButton.addEventListener("click", cerrarMenu);
menuHomeButton.addEventListener("click", manejarClickInicioMenu);
menuFaqButton.addEventListener("click", abrirPreguntasFrecuentes);
verTodosButton.addEventListener("click", verTodosLosPerfumes);
aplicarFiltrosButton.addEventListener("click", aplicarFiltros);
limpiarFiltrosButton.addEventListener("click", limpiarFiltros);
overlay.addEventListener("click", cerrarDrawers);

// Event listeners para header y scroll
if (logo) {
	logo.addEventListener("click", manejarClickLogo);
}
window.addEventListener("scroll", manejarScroll, { passive: true });

// Event listener para búsqueda
if (searchInput) {
	searchInput.addEventListener("input", manejarBusqueda);
}

// Inicialización de la aplicación
cargarPerfumes();
actualizarContadorCarrito();
