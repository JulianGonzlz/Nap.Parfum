/* FILTROS Y BÚSQUEDA
   Gestiona el bloque "Explorar" (Árabe / Diseñador con sus marcas) y el panel "Filtrar"
   de selección múltiple (tipo, género, marca, precio), más la búsqueda por texto, el orden,
   las etiquetas de filtros activos y la carga de datos. */

// Rangos de precio del frasco sellado. "test" recibe el precio del perfume;
// los perfumes con precio 0 (sin cargar) quedan fuera de todos los rangos.
const RANGOS_PRECIO = [
	{ clave: "hasta-60000", etiqueta: "Hasta $60.000", test: (precio) => precio > 0 && precio <= 60000 },
	{ clave: "60000-100000", etiqueta: "$60.000 a $100.000", test: (precio) => precio > 60000 && precio <= 100000 },
	{ clave: "mas-100000", etiqueta: "Más de $100.000", test: (precio) => precio > 100000 },
];

// Devuelve el Set de estado correspondiente a un grupo de filtro del panel.
function conjuntoDeGrupo(grupo) {
	if (grupo === "categoria") return categoriasActivas;
	if (grupo === "genero") return generosActivos;
	if (grupo === "marca") return marcasActivas;
	return preciosActivos;
}

function capitalizar(texto) {
	return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const GRUPOS_FILTRO = ["categoria", "genero", "marca", "precio"];

// Indica si un perfume coincide con alguno de los valores (Set) de un grupo de filtro.
function coincideGrupo(grupo, perfume, valores) {
	if (grupo === "categoria") return valores.has(perfume.categoria);
	if (grupo === "marca") return valores.has(perfume.marca);
	// Los perfumes unisex aparecen también al filtrar Masculino o Femenino.
	if (grupo === "genero") {
		return valores.has(perfume.genero) ||
			(perfume.genero === "unisex" && (valores.has("masculino") || valores.has("femenino")));
	}
	return RANGOS_PRECIO.some((rango) => valores.has(rango.clave) && rango.test(perfume.precio));
}

// Dentro de cada filtro se suma (OR); entre filtros distintos se cruza (AND).
// "exceptoGrupo" deja un grupo afuera para saber que opciones suyas siguen dando resultados.
function pasaFiltros(perfume, exceptoGrupo) {
	return GRUPOS_FILTRO.every((grupo) => {
		const valores = conjuntoDeGrupo(grupo);
		return grupo === exceptoGrupo || valores.size === 0 || coincideGrupo(grupo, perfume, valores);
	});
}

// Combina categoria, marca, genero, precio y texto de busqueda.
function obtenerPerfumesFiltrados() {
	const textoMinuscula = textoSearchActivo.toLowerCase();
	return perfumes.filter((perfume) => {
		const coincideTexto = !textoMinuscula ||
			perfume.nombre.toLowerCase().includes(textoMinuscula) ||
			perfume.marca.toLowerCase().includes(textoMinuscula);
		return pasaFiltros(perfume) && coincideTexto;
	});
}

// Traduce categoría en español para mostrar
function nombreCategoria(categoria) {
	return categoria === "arabe" ? "Árabe" : "Diseñador";
}

// Texto visible de un valor de filtro segun su grupo.
function etiquetaDeValor(grupo, valor) {
	if (grupo === "categoria") return nombreCategoria(valor);
	if (grupo === "genero") return capitalizar(valor);
	if (grupo === "precio") {
		const rango = RANGOS_PRECIO.find((item) => item.clave === valor);
		return rango ? rango.etiqueta : valor;
	}
	return valor;
}

// Valores aceptados por el selector "Ordenar" ("" = orden del catalogo).
const ORDENES = ["precio-asc", "precio-desc", "nombre"];

// Los perfumes sin precio cargado (0) van siempre al final al ordenar por precio.
function ordenarPerfumes(lista) {
	// Sin orden elegido se respeta el del catalogo, salvo con un filtro de precio activo:
	// ahi se ordena de menor a mayor (los más baratos arriba).
	const orden = ordenActivo || (preciosActivos.size ? "precio-asc" : "");
	if (orden === "nombre") return lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
	if (orden === "precio-asc" || orden === "precio-desc") {
		const sentido = orden === "precio-asc" ? 1 : -1;
		return lista.sort((a, b) => {
			if (!a.precio || !b.precio) return (a.precio ? 0 : 1) - (b.precio ? 0 : 1);
			return (a.precio - b.precio) * sentido;
		});
	}
	return lista;
}

// Arma el breadcrumb del catalogo enumerando los filtros activos.
function construirTituloCatalogo() {
	const partes = ["Catálogo"];
	if (categoriasActivas.size) partes.push([...categoriasActivas].map(nombreCategoria).join(", "));
	if (marcasActivas.size) partes.push([...marcasActivas].join(", "));
	if (generosActivos.size) partes.push([...generosActivos].map(capitalizar).join(", "));
	if (preciosActivos.size) {
		partes.push(RANGOS_PRECIO.filter((rango) => preciosActivos.has(rango.clave)).map((rango) => rango.etiqueta).join(", "));
	}
	// La búsqueda no convive con los filtros: si hay texto, es lo único que se nombra.
	if (textoSearchActivo) partes.push(`"${textoSearchActivo}"`);
	// "Todos" solo aparece si no hay ningun filtro ni busqueda que nombrar.
	if (partes.length === 1) partes.push("Todos");
	return partes;
}

// Muestra solo la pantalla de catalogo y conserva los filtros en su titulo.
function abrirCatalogo() {
	const lista = ordenarPerfumes(obtenerPerfumesFiltrados());
	const partes = construirTituloCatalogo();
	catalogoTitulo.innerHTML = partes.map((parte, indice) => `${indice ? '<span class="breadcrumb-separator" aria-hidden="true">/</span>' : ""}<span>${escaparHTML(parte)}</span>`).join("");
	catalogoConteo.textContent = lista.length === 1 ? "1 perfume" : `${lista.length} perfumes`;
	renderizarFiltrosActivos();
	mostrarPerfumes(lista, catalogoContainer);
	sincronizarURL(cambiarVista("catalogo"));
}

// Etiquetas sobre el catalogo: una por filtro activo, para quitarlo sin abrir el menu.
function renderizarFiltrosActivos() {
	const etiquetas = [];
	GRUPOS_FILTRO.forEach((grupo) => {
		conjuntoDeGrupo(grupo).forEach((valor) => etiquetas.push({ grupo, valor, texto: etiquetaDeValor(grupo, valor) }));
	});
	if (textoSearchActivo) etiquetas.push({ grupo: "busqueda", valor: "", texto: `"${textoSearchActivo}"` });
	const limpiarHTML = etiquetas.length > 1 ? '<button class="filtro-activo-limpiar" type="button">Limpiar todo</button>' : "";
	filtrosActivos.innerHTML = etiquetas.map((etiqueta) => `<button class="filtro-activo" type="button" data-grupo="${escaparHTML(etiqueta.grupo)}" data-valor="${escaparHTML(etiqueta.valor)}" aria-label="Quitar filtro ${escaparHTML(etiqueta.texto)}"><span>${escaparHTML(etiqueta.texto)}</span><span aria-hidden="true">×</span></button>`).join("") + limpiarHTML;
}

// Quita el filtro de la etiqueta tocada (o todos con "Limpiar todo") y refresca el catalogo.
function quitarFiltroActivo(evento) {
	const boton = evento.target.closest("button");
	if (!boton) return;
	if (boton.classList.contains("filtro-activo-limpiar")) {
		reiniciarFiltros();
		limpiarBusqueda();
	} else if (boton.dataset.grupo === "busqueda") {
		limpiarBusqueda();
	} else {
		conjuntoDeGrupo(boton.dataset.grupo).delete(boton.dataset.valor);
		sincronizarCheckboxesFiltro();
	}
	abrirCatalogo();
}

function limpiarBusqueda() {
	textoSearchActivo = "";
	if (searchInput) searchInput.value = "";
}

// Selector "Ordenar" del catalogo.
function manejarCambioOrden(evento) {
	ordenActivo = ORDENES.includes(evento.currentTarget.value) ? evento.currentTarget.value : "";
	abrirCatalogo();
}

// Plantilla de una opcion (checkbox) del panel "Filtrar".
function opcionFiltroHTML(grupo, valor, etiqueta) {
	return `<label class="filtro-opcion"><input type="checkbox" data-grupo="${escaparHTML(grupo)}" value="${escaparHTML(valor)}"><span>${escaparHTML(etiqueta)}</span></label>`;
}

// Las categorias, marcas y generos salen del JSON para aceptar valores nuevos.
function renderizarFiltros() {
	// Bloque "Explorar": solo categorias concretas (Árabe / Diseñador) con sus marcas.
	const categorias = [...new Set(perfumes.map((perfume) => perfume.categoria))];
	categoryFilters.innerHTML = categorias.map((categoria) => {
		const texto = nombreCategoria(categoria);
		const categoriaSegura = escaparHTML(categoria);
		return `<button class="filter-button" type="button" data-category="${categoriaSegura}">${escaparHTML(texto)}</button><div class="brand-list" data-brands-for="${categoriaSegura}"></div>`;
	}).join("");

	// Panel "Filtrar".
	verTodosButton.textContent = "Ver todos";

	filtroCategoriaContenedor.innerHTML = categorias.map((categoria) => opcionFiltroHTML("categoria", categoria, nombreCategoria(categoria))).join("");

	const generos = [...new Set(perfumes.map((perfume) => perfume.genero))];
	filtroGeneroContenedor.innerHTML = generos.map((genero) => opcionFiltroHTML("genero", genero, capitalizar(genero))).join("");

	const marcas = [...new Set(perfumes.map((perfume) => perfume.marca))].sort((a, b) => a.localeCompare(b, "es"));
	filtroMarcaContenedor.innerHTML = marcas.map((marca) => opcionFiltroHTML("marca", marca, marca)).join("");

	filtroPrecioContenedor.innerHTML = RANGOS_PRECIO.map((rango) => opcionFiltroHTML("precio", rango.clave, rango.etiqueta)).join("");

	conectarFiltros();
	sincronizarCheckboxesFiltro();
}

// Panel "Filtrar": cada grupo muestra solo las opciones que todavia dan resultados
// segun lo elegido en los demas grupos, y descarta las elegidas que quedaron sin perfumes.
function actualizarOpcionesDisponibles() {
	let huboDescarte;
	// Descartar una opcion elegida amplia los demas grupos, asi que se repite hasta que no cambie nada.
	do {
		huboDescarte = false;
		GRUPOS_FILTRO.forEach((grupo) => {
			const conjunto = conjuntoDeGrupo(grupo);
			const candidatos = perfumes.filter((perfume) => pasaFiltros(perfume, grupo));
			document.querySelectorAll(`.filtro-opciones input[data-grupo="${grupo}"]`).forEach((input) => {
				const disponible = candidatos.some((perfume) => coincideGrupo(grupo, perfume, new Set([input.value])));
				if (!disponible && conjunto.delete(input.value)) huboDescarte = true;
				input.closest(".filtro-opcion").hidden = !disponible;
			});
		});
	} while (huboDescarte);
}

// Deja todas las sublistas de marcas en su estado por defecto (cerradas).
function cerrarMarcas(exceptoCategoria) {
	categoryFilters.querySelectorAll(".brand-list").forEach((brandList) => {
		if (brandList.dataset.brandsFor === exceptoCategoria) return;
		brandList.classList.remove("desplegado");
	});
}

// Al abrir una categoria, se muestran sus marcas unicas debajo del boton correspondiente.
function alternarMarcas(categoria) {
	const brandList = document.querySelector(`[data-brands-for="${CSS.escape(categoria)}"]`);
	if (!brandList) return;
	const marcas = [...new Set(perfumes.filter((perfume) => perfume.categoria === categoria).map((perfume) => perfume.marca))];
	brandList.innerHTML = marcas.map((marca) => `<button class="brand-button" type="button" data-category="${escaparHTML(categoria)}" data-brand="${escaparHTML(marca)}">${escaparHTML(marca)}</button>`).join("");
	// Solo una categoria puede tener su sublista abierta a la vez
	cerrarMarcas(categoria);
	// Toggle entre mostrado y ocultado
	brandList.classList.toggle("desplegado");
	brandList.querySelectorAll(".brand-button").forEach((boton) => boton.addEventListener("click", seleccionarMarca));
}

// Explorar > marca: salto directo a esa marca dentro de su categoria.
function seleccionarMarca(evento) {
	evento.stopPropagation();
	categoriasActivas.clear();
	categoriasActivas.add(evento.currentTarget.dataset.category);
	marcasActivas.clear();
	marcasActivas.add(evento.currentTarget.dataset.brand);
	textoSearchActivo = "";
	if (searchInput) searchInput.value = "";
	sincronizarCheckboxesFiltro();
	cerrarMenu();
	abrirCatalogo();
}

// Explorar > categoria: acota a Árabe o Diseñador y despliega sus marcas.
// No toca los filtros de genero ni precio para que se acumulen.
function seleccionarCategoria(evento) {
	evento.stopPropagation();
	const categoria = evento.currentTarget.dataset.category;
	categoriasActivas.clear();
	categoriasActivas.add(categoria);
	marcasActivas.clear();
	textoSearchActivo = "";
	if (searchInput) searchInput.value = "";
	sincronizarCheckboxesFiltro();
	alternarMarcas(categoria);
}

// Panel "Filtrar": abre o cierra un grupo de opciones (tipo, género, marca, precio).
function alternarGrupoFiltro(evento) {
	const grupo = evento.currentTarget.closest(".filtro-grupo");
	const abierto = grupo.classList.toggle("desplegado");
	evento.currentTarget.setAttribute("aria-expanded", String(abierto));
}

// Panel "Filtrar": marca/desmarca una opcion y aplica el filtro al instante.
// El menu queda abierto para seguir combinando filtros.
function manejarCambioFiltro(evento) {
	const input = evento.target;
	if (!input.matches('input[type="checkbox"]')) return;
	const conjunto = conjuntoDeGrupo(input.dataset.grupo);
	if (input.checked) conjunto.add(input.value);
	else conjunto.delete(input.value);
	// Los filtros no conviven con la búsqueda: al tocar un filtro se descarta el texto.
	if (textoSearchActivo) {
		textoSearchActivo = "";
		if (searchInput) searchInput.value = "";
	}
	sincronizarCheckboxesFiltro();
	abrirCatalogo();
}

// Refleja el estado de los Set en los checkboxes y en los contadores.
function sincronizarCheckboxesFiltro() {
	actualizarOpcionesDisponibles();
	document.querySelectorAll('.filtro-opciones input[type="checkbox"]').forEach((input) => {
		input.checked = conjuntoDeGrupo(input.dataset.grupo).has(input.value);
	});
	actualizarResumenFiltros();
}

// Actualiza los badges por grupo y muestra "Limpiar filtros" solo si hay alguno activo.
function actualizarResumenFiltros() {
	const conteos = { categoria: categoriasActivas.size, genero: generosActivos.size, marca: marcasActivas.size, precio: preciosActivos.size };
	document.querySelectorAll(".filtro-grupo").forEach((grupo) => {
		const badge = grupo.querySelector(".filtro-badge");
		const cantidad = conteos[grupo.dataset.grupo] || 0;
		badge.textContent = cantidad ? String(cantidad) : "";
		badge.hidden = cantidad === 0;
	});
	const totalFiltros = conteos.categoria + conteos.genero + conteos.marca + conteos.precio;
	limpiarFiltrosButton.hidden = totalFiltros === 0;
}

// Panel "Filtrar": limpia tipo, genero, marca y precio y refresca el catalogo con el resultado.
function limpiarFiltros() {
	reiniciarFiltros();
	abrirCatalogo();
}

// Deja todos los filtros (categoria de Explorar + panel Filtrar) en su estado inicial.
function reiniciarFiltros() {
	categoriasActivas.clear();
	generosActivos.clear();
	marcasActivas.clear();
	preciosActivos.clear();
	cerrarMarcas();
	sincronizarCheckboxesFiltro();
}

// Panel "Filtrar": muestra el catalogo completo sin ningun filtro.
function verTodosLosPerfumes() {
	reiniciarFiltros();
	textoSearchActivo = "";
	if (searchInput) searchInput.value = "";
	cerrarMenu();
	abrirCatalogo();
}

// Conecta los listeners de los botones de filtro
function conectarFiltros() {
	categoryFilters.querySelectorAll(".filter-button").forEach((boton) => boton.addEventListener("click", seleccionarCategoria));
	document.querySelectorAll(".filtro-toggle").forEach((boton) => boton.addEventListener("click", alternarGrupoFiltro));
	[filtroCategoriaContenedor, filtroGeneroContenedor, filtroMarcaContenedor, filtroPrecioContenedor].forEach((contenedor) => contenedor.addEventListener("change", manejarCambioFiltro));
}

// Maneja la búsqueda con debounce simple para evitar filtrados excesivos.
// La barra de búsqueda es independiente de los filtros: al escribir, se reinician.
function manejarBusqueda(evento) {
	textoSearchActivo = evento.currentTarget.value;
	reiniciarFiltros();
	clearTimeout(temporizadorSearch);
	temporizadorSearch = setTimeout(() => {
		abrirCatalogo();
	}, 150);
}

// El catalogo se carga al inicio para que las dos vistas usen los mismos datos.
async function cargarPerfumes() {
	try {
		const respuesta = await fetch("data/perfumes.json");
		if (!respuesta.ok) throw new Error("No se pudo leer el archivo");
		const datos = await respuesta.json();
		if (!Array.isArray(datos)) throw new Error("Formato de catalogo invalido");
		perfumes = datos;
		renderizarFiltros();
		mostrarPerfumes(perfumes.filter((perfume) => perfume.featured === true), featuredContainer);
		// La direccion puede traer una vista para abrir (catalogo filtrado, detalle o preguntas).
		restaurarDesdeURL();
		irAlComienzoDeVista();
	} catch (error) {
		featuredContainer.innerHTML = "<p>No se pudo cargar el catálogo.</p>";
	}
}
