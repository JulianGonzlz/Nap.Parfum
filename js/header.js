/* HEADER Y NAVEGACIÓN
   Gestiona la visibilidad del header según scroll y drawers, y la navegación entre vistas. */

// Decide la visibilidad del encabezado considerando a la vez el scroll y los drawers.
// Mientras se escribe en el buscador queda visible, aunque la pagina baje hasta los resultados.
function actualizarVisibilidadHeader() {
	const hayDrawerAbierto = menuLateral.classList.contains("abierto") || carrito.classList.contains("abierto");
	const buscando = document.activeElement === searchInput;
	header.classList.toggle("header-oculto", hayDrawerAbierto || (scrollHaciaAbajo && !buscando));
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
	cerrarCarrito();
	sincronizarURL(cambiarVista("inicio"));
}

// Muestra solo la pantalla de preguntas frecuentes, se abre desde el menu lateral.
function abrirPreguntasFrecuentes() {
	cerrarMenu();
	sincronizarURL(cambiarVista("faq"));
}

// Vuelve al inicio desde el menu lateral: cierra el drawer y sube la vista
function manejarClickInicioMenu() {
	cerrarMenu();
	volverAlInicio();
	window.scrollTo({ top: 0, behavior: "smooth" });
}

// Maneja el click en el logo para volver al inicio con scroll suave
function manejarClickLogo(evento) {
	evento.preventDefault();
	if (vistaActual !== "inicio") {
		volverAlInicio();
	}
	window.scrollTo({ top: 0, behavior: "smooth" });
}
