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
limpiarFiltrosButton.addEventListener("click", limpiarFiltros);
filtrosActivos.addEventListener("click", quitarFiltroActivo);
ordenSelect.addEventListener("change", manejarCambioOrden);
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

// El boton "atras" del navegador vuelve a la vista anterior dentro del sitio.
window.addEventListener("popstate", manejarHistorial);

// Inicialización de la aplicación
cargarPerfumes();
actualizarContadorCarrito();
