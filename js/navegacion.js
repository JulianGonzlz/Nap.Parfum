/* NAVEGACIÓN ENTRE VISTAS E HISTORIAL
   Muestra una sola vista a la vez y la refleja en la direccion de la pagina, para que los
   enlaces se puedan compartir y el boton "atras" del navegador funcione dentro del sitio. */

const SECCIONES_POR_VISTA = {
	inicio: [inicio, destacados],
	catalogo: [catalogo],
	faq: [preguntasFrecuentes],
	detalle: [detalle],
};

// Nombre de cada grupo de filtro en la direccion (?vista=catalogo&tipo=arabe&marca=Lattafa).
const PARAMETROS_FILTRO = { categoria: "tipo", genero: "genero", marca: "marca", precio: "precio" };

// El scroll de cada vista se restaura a mano desde el historial.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

// Deja visible solo la vista pedida. Devuelve true si se cambio de vista.
function cambiarVista(vista) {
	const esVistaNueva = vista !== vistaActual;
	const registrar = esVistaNueva && !restaurandoHistorial;
	// Antes de salir se anota el scroll en la entrada actual para recuperarlo al volver atras.
	if (registrar) escribirHistorial("replaceState", { ...history.state, scroll: window.scrollY }, location.href);
	Object.entries(SECCIONES_POR_VISTA).forEach(([nombre, secciones]) => {
		secciones.forEach((seccion) => seccion.classList.toggle("oculto", nombre !== vista));
	});
	vistaActual = vista;
	if (registrar) irAlComienzoDeVista();
	return esVistaNueva;
}

// Al entrar a una vista se sube hasta donde empieza su contenido, justo debajo del encabezado fijo.
// El inicio va al tope de la pagina.
function irAlComienzoDeVista() {
	const seccion = SECCIONES_POR_VISTA[vistaActual][0];
	const destino = vistaActual === "inicio" ? 0 : seccion.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
	window.scrollTo(0, Math.max(destino, 0));
}

// Lleva el estado actual a la direccion: una vista nueva suma una entrada al historial;
// los cambios dentro de la misma vista (filtros, orden, busqueda) reemplazan la actual.
function sincronizarURL(esVistaNueva) {
	actualizarTituloPagina();
	if (restaurandoHistorial) return;
	if (esVistaNueva) escribirHistorial("pushState", { interno: true, scroll: 0 }, construirURL());
	else escribirHistorial("replaceState", history.state, construirURL());
}

// Puede fallar al abrir el archivo directo desde el disco; la pagina sigue funcionando sin historial.
function escribirHistorial(metodo, estado, url) {
	try {
		history[metodo](estado, "", url);
	} catch (error) {
		return;
	}
}

function construirURL() {
	const parametros = new URLSearchParams();
	if (vistaActual === "detalle") {
		parametros.set("perfume", perfumeDetalleId);
	} else if (vistaActual === "faq") {
		parametros.set("vista", "faq");
	} else if (vistaActual === "catalogo") {
		parametros.set("vista", "catalogo");
		GRUPOS_FILTRO.forEach((grupo) => {
			conjuntoDeGrupo(grupo).forEach((valor) => parametros.append(PARAMETROS_FILTRO[grupo], valor));
		});
		if (ordenActivo) parametros.set("orden", ordenActivo);
		if (textoSearchActivo) parametros.set("q", textoSearchActivo);
	}
	const consulta = parametros.toString();
	return consulta ? `?${consulta}` : location.pathname;
}

function actualizarTituloPagina() {
	const perfume = vistaActual === "detalle" ? perfumes.find((item) => item.id === perfumeDetalleId) : null;
	let seccion = "";
	if (perfume) seccion = `${perfume.nombre} · ${perfume.marca}`;
	else if (vistaActual === "catalogo") seccion = "Catálogo";
	else if (vistaActual === "faq") seccion = "Preguntas frecuentes";
	document.title = seccion ? `${seccion} | NAP Parfum` : "NAP Parfum | Perfumería";
}

// Lee la direccion y abre la vista que describe. Se usa al cargar la pagina y al ir atras/adelante.
// Seguridad: la direccion la puede escribir cualquiera, asi que solo se aceptan valores del catalogo.
function restaurarDesdeURL() {
	const parametros = new URLSearchParams(location.search);
	restaurandoHistorial = true;
	GRUPOS_FILTRO.forEach((grupo) => {
		const conocidos = [...document.querySelectorAll(`.filtro-opciones input[data-grupo="${grupo}"]`)].map((input) => input.value);
		const conjunto = conjuntoDeGrupo(grupo);
		conjunto.clear();
		parametros.getAll(PARAMETROS_FILTRO[grupo]).forEach((valor) => {
			if (conocidos.includes(valor)) conjunto.add(valor);
		});
	});
	ordenActivo = ORDENES.includes(parametros.get("orden")) ? parametros.get("orden") : "";
	ordenSelect.value = ordenActivo;
	textoSearchActivo = (parametros.get("q") || "").slice(0, 60);
	if (searchInput) searchInput.value = textoSearchActivo;
	sincronizarCheckboxesFiltro();
	cerrarDrawers();

	const vista = parametros.get("vista");
	if (parametros.has("perfume")) abrirDetalle(parametros.get("perfume"));
	else if (vista === "catalogo") abrirCatalogo();
	else if (vista === "faq") abrirPreguntasFrecuentes();
	else volverAlInicio();
	restaurandoHistorial = false;
	// Deja la direccion limpia si traia valores que no existen en el catalogo.
	escribirHistorial("replaceState", history.state, construirURL());
}

// Boton atras/adelante del navegador: vuelve a la vista de esa entrada y a su scroll.
function manejarHistorial(evento) {
	restaurarDesdeURL();
	window.scrollTo(0, (evento.state && evento.state.scroll) || 0);
}
