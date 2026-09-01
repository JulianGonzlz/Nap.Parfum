/* HEADER Y NAVEGACIÓN
   Gestiona la visibilidad del header según scroll y drawers, y la navegación entre vistas. */

// Decide la visibilidad del encabezado considerando a la vez el scroll y los drawers.
function actualizarVisibilidadHeader() {
	const hayDrawerAbierto = menuLateral.classList.contains("abierto") || carrito.classList.contains("abierto");
	header.classList.toggle("header-oculto", hayDrawerAbierto || scrollHaciaAbajo);
}

// Registra la direccion del scroll y delega la visibilidad en una sola funcion.
function actualizarHeaderAlScrollear() {
	const posicionActual = window.scrollY;
	if (posicionActual > ultimaPosicionScroll && posicionActual > 0) {
		scrollHaciaAbajo = true;
	} else if (posicionActual < ultimaPosicionScroll) {
		scrollHaciaAbajo = false;
	}
	ultimaPosicionScroll = posicionActual;
	frameScrollPendiente = false;
	actualizarVisibilidadHeader();
}

// Programa una sola lectura del scroll por frame para mantener fluida la pagina.
function manejarScroll() {
	if (!frameScrollPendiente) {
		frameScrollPendiente = true;
		window.requestAnimationFrame(actualizarHeaderAlScrollear);
	}
	clearTimeout(temporizadorHeader);
	temporizadorHeader = setTimeout(() => {
		scrollHaciaAbajo = false;
		actualizarVisibilidadHeader();
	}, 150);
}

// Vuelve a la vista de inicio y cierra el carrito
function volverAlInicio() {
	catalogo.classList.add("oculto");
	cerrarCarrito();
	inicio.classList.remove("oculto");
	destacados.classList.remove("oculto");
}

// Maneja el click en el logo para volver al inicio con scroll suave
function manejarClickLogo(evento) {
	evento.preventDefault();
	const yaEnInicio = !inicio.classList.contains("oculto") && catalogo.classList.contains("oculto");
	if (!yaEnInicio) {
		volverAlInicio();
	}
	window.scrollTo({ top: 0, behavior: "smooth" });
}
