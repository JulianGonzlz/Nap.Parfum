/* FILTROS Y BÚSQUEDA
   Gestiona la lógica de filtrado (categoría, marca, género), búsqueda por texto y carga de datos. */

// Combina categoria, marca, genero y texto de busqueda para que todos los filtros funcionen juntos.
function obtenerPerfumesFiltrados() {
	const textoMinuscula = textoSearchActivo.toLowerCase();
	return perfumes.filter((perfume) => {
		const coincideCategoria = categoriaActiva === "todos" || perfume.categoria === categoriaActiva;
		const coincideMarca = !marcaActiva || perfume.marca === marcaActiva;
		// Los perfumes unisex aparecen también en filtros Masculino y Femenino, además de en Unisex y Todos
		const coincideGenero = generoActivo === "todos" || 
			perfume.genero === generoActivo || 
			(perfume.genero === "unisex" && (generoActivo === "masculino" || generoActivo === "femenino"));
		const coincideTexto = !textoMinuscula || 
			perfume.nombre.toLowerCase().includes(textoMinuscula) || 
			perfume.marca.toLowerCase().includes(textoMinuscula);
		return coincideCategoria && coincideMarca && coincideGenero && coincideTexto;
	});
}

// Traduce categoría en español para mostrar
function nombreCategoria(categoria) {
	return categoria === "arabe" ? "Árabe" : "Diseñador";
}

// Muestra solo la pantalla de catalogo y conserva los filtros en su titulo.
function abrirCatalogo() {
	const lista = obtenerPerfumesFiltrados();
	const partesRuta = ["Catálogo", categoriaActiva === "todos" ? "Todos" : nombreCategoria(categoriaActiva)];
	if (marcaActiva) partesRuta.push(marcaActiva);
	if (generoActivo !== "todos") partesRuta.push(generoActivo);
	catalogoTitulo.innerHTML = partesRuta.map((parte, indice) => `${indice ? '<span class="breadcrumb-separator" aria-hidden="true">/</span>' : ""}<span>${parte}</span>`).join("");
	mostrarPerfumes(lista, catalogoContainer);
	inicio.classList.add("oculto");
	destacados.classList.add("oculto");
	catalogo.classList.remove("oculto");
}

// Las categorias, marcas y generos salen del JSON para aceptar valores nuevos.
function renderizarFiltros() {
	const totalPerfumes = new Set(perfumes.map((perfume) => perfume.id)).size;
	const categorias = ["todos", ...new Set(perfumes.map((perfume) => perfume.categoria))];
	categoryFilters.innerHTML = categorias.map((categoria) => {
		if (categoria === "todos") {
			return `<button class="filter-button" type="button" data-category="${categoria}">Todos (${totalPerfumes})</button><div class="brand-list" data-brands-for="${categoria}"></div>`;
		}
		const texto = nombreCategoria(categoria);
		return `<button class="filter-button" type="button" data-category="${categoria}">${texto}</button><div class="brand-list" data-brands-for="${categoria}"></div>`;
	}).join("");

	const generos = [...new Set(perfumes.map((perfume) => perfume.genero))];
	genderFilters.innerHTML = generos.map((genero) => `<button class="gender-button" type="button" data-gender="${genero}">${genero}</button>`).join("");
	conectarFiltros();
}

// Al abrir una categoria, se muestran sus marcas unicas debajo del boton correspondiente.
function alternarMarcas(categoria) {
	const brandList = document.querySelector(`[data-brands-for="${categoria}"]`);
	const marcas = [...new Set(perfumes.filter((perfume) => perfume.categoria === categoria).map((perfume) => perfume.marca))];
	brandList.innerHTML = marcas.map((marca) => `<button class="brand-button" type="button" data-category="${categoria}" data-brand="${marca}">${marca}</button>`).join("");
	// Toggle entre mostrado y ocultado
	brandList.classList.toggle("desplegado");
	brandList.querySelectorAll(".brand-button").forEach((boton) => boton.addEventListener("click", seleccionarMarca));
}

function seleccionarMarca(evento) {
	// Detiene la propagación del evento
	evento.stopPropagation();
	
	categoriaActiva = evento.currentTarget.dataset.category;
	marcaActiva = evento.currentTarget.dataset.brand;
	textoSearchActivo = "";
	if (searchInput) searchInput.value = "";
	cerrarMenu();
	abrirCatalogo();
}

function seleccionarCategoria(evento) {
	// Detiene la propagación del evento para evitar que burbujee hacia el overlay y cierre el drawer
	evento.stopPropagation();
	
	const categoria = evento.currentTarget.dataset.category;
	if (categoria === "todos") {
		categoriaActiva = "todos";
		marcaActiva = "";
		textoSearchActivo = "";
		if (searchInput) searchInput.value = "";
		cerrarMenu();
		abrirCatalogo();
		return;
	}

	// Para categorías específicas (Árabe, Diseñador):
	// Solo alterna (abre/cierra) el acordeón de marcas, sin cerrar el menú
	categoriaActiva = categoria;
	marcaActiva = "";
	textoSearchActivo = "";
	if (searchInput) searchInput.value = "";
	alternarMarcas(categoria);
	// No se cierra el menú aquí - el usuario puede seguir seleccionando marcas o géneros
}

function seleccionarGenero(evento) {
	// Detiene la propagación del evento para evitar que burbujee hacia el overlay
	evento.stopPropagation();
	
	generoActivo = evento.currentTarget.dataset.gender;
	textoSearchActivo = "";
	if (searchInput) searchInput.value = "";
	cerrarMenu();
	abrirCatalogo();
}

// Conecta los listeners de los botones de filtro
function conectarFiltros() {
	categoryFilters.querySelectorAll(".filter-button").forEach((boton) => boton.addEventListener("click", seleccionarCategoria));
	genderFilters.querySelectorAll(".gender-button").forEach((boton) => boton.addEventListener("click", seleccionarGenero));
}

// Maneja la búsqueda con debounce simple para evitar filtrados excesivos.
function manejarBusqueda(evento) {
	textoSearchActivo = evento.currentTarget.value;
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
		perfumes = await respuesta.json();
		renderizarFiltros();
		mostrarPerfumes(perfumes.filter((perfume) => perfume.featured === true), featuredContainer);
	} catch (error) {
		featuredContainer.innerHTML = "<p>No se pudo cargar el catálogo.</p>";
	}
}
