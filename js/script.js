// Estos elementos se guardan una sola vez para que las funciones sean faciles de leer.
const menuButton = document.getElementById("menu-button");
const closeMenuButton = document.getElementById("close-menu");
const menuLateral = document.getElementById("menu-lateral");
const overlay = document.getElementById("overlay");
const inicio = document.getElementById("inicio");
const destacados = document.getElementById("destacados");
const catalogo = document.getElementById("catalogo");
const featuredContainer = document.getElementById("featured-container");
const catalogoContainer = document.getElementById("catalogo-container");
const catalogoTitulo = document.getElementById("catalogo-titulo");
const categoryFilters = document.getElementById("category-filters");
const genderFilters = document.getElementById("gender-filters");
const cartButton = document.getElementById("cart-button");
const cartCount = document.getElementById("cart-count");
const carrito = document.getElementById("carrito");
const cartContainer = document.getElementById("cart-container");
const cartBackButton = document.getElementById("cart-back-button");
const toastCarrito = document.getElementById("toast-carrito");
const header = document.querySelector("header");
let perfumes = [];
let categoriaActiva = "todos";
let marcaActiva = "";
let generoActivo = "todos";
let ultimaPosicionScroll = window.scrollY;
let frameScrollPendiente = false;
let temporizadorHeader;
let temporizadorToast;
let temporizadorOcultarToast;
let scrollHaciaAbajo = false;

function mostrarToast(mensaje) {
	clearTimeout(temporizadorToast);
	clearTimeout(temporizadorOcultarToast);
	toastCarrito.textContent = mensaje;
	toastCarrito.classList.remove("oculto");
	requestAnimationFrame(() => toastCarrito.classList.add("visible"));
	temporizadorToast = setTimeout(() => {
		toastCarrito.classList.remove("visible");
		temporizadorOcultarToast = setTimeout(() => toastCarrito.classList.add("oculto"), 300);
	}, 1800);
}

// Una sola plantilla evita repetir el marcado de las tarjetas en ambas vistas.
function crearTarjetaHTML(perfume) {
	const estadoStock = perfume.stock ? "Disponible" : "Sin stock";
	const claseStock = perfume.stock ? "" : " sin-stock";
	const imagenes = Array.isArray(perfume.imagenes) ? perfume.imagenes : [];
	const indicadorHTML = imagenes.length > 1 ? `<span class="image-indicator" aria-hidden="true">1/${imagenes.length}</span>` : "";
	const imagenHTML = imagenes.length
		? `<div class="image-container"><img class="perfume-image${imagenes.length > 1 ? " imagen-rotativa" : ""}" src="${imagenes[0]}" alt="${perfume.nombre}" data-id="${perfume.id}" data-indice="0" data-imagenes='${JSON.stringify(imagenes)}'>${indicadorHTML}<div class="image-placeholder oculto" aria-hidden="true">◎</div></div>`
		: `<div class="image-placeholder" aria-label="Imagen no disponible">◎</div>`;
	const decantHTML = perfume.decant.disponible
		? `<p class="decant">Decants disponibles: 5ml y 10ml</p>`
		: "";
	const opcionesHTML = perfume.decant.disponible
		? `<div class="cart-options"><button class="cart-option" type="button" data-id="${perfume.id}" data-type="decant5ml">Decant 5ml · $${perfume.decant.precio5ml.toLocaleString("es-AR")}</button><button class="cart-option" type="button" data-id="${perfume.id}" data-type="decant10ml">Decant 10ml · $${perfume.decant.precio10ml.toLocaleString("es-AR")}</button></div>`
		: "";
	return `
		<article class="perfume-card${claseStock}">
			${imagenHTML}
			<span class="category">${perfume.categoria} · ${perfume.marca} · ${perfume.genero}</span>
			<h3 class="perfume-name">${perfume.nombre}</h3>
			<p class="description">${perfume.descripcion}</p>
			<p class="notes">Salida: ${perfume.notas.salida.join(", ")}<br>Corazón: ${perfume.notas.corazon.join(", ")}<br>Fondo: ${perfume.notas.fondo.join(", ")}</p>
			<p class="stock">${estadoStock}</p>
			${decantHTML}
			<div class="cart-actions">
				<button class="add-cart-button glass" type="button" data-id="${perfume.id}">Agregar al carrito</button>
				${opcionesHTML}
			</div>
			<div class="card-footer">
				<span class="price">$${perfume.precio.toLocaleString("es-AR")} - Producto entero sellado</span>
			</div>
		</article>`;
}

// Estas dos funciones son las unicas que acceden directamente al carrito guardado en el navegador.
function leerCarrito() {
	try {
		return JSON.parse(localStorage.getItem("nap-carrito") || "[]");
	} catch (error) {
		return [];
	}
}

function guardarCarrito(carritoActual) {
	try {
		localStorage.setItem("nap-carrito", JSON.stringify(carritoActual));
	} catch (error) {
		return;
	}
	actualizarContadorCarrito();
}

// Actualiza el numero del encabezado sumando las cantidades de todos los productos.
function actualizarContadorCarrito() {
	const cantidadTotal = leerCarrito().reduce((total, item) => total + item.cantidad, 0);
	cartCount.textContent = String(cantidadTotal);
}

// Agrega una presentacion del perfume o aumenta su cantidad si ya existe.
function agregarAlCarrito(perfumeId, tipo) {
	const perfume = perfumes.find((item) => item.id === perfumeId);
	if (!perfume) return;
	const precio = tipo === "decant5ml" ? perfume.decant.precio5ml : tipo === "decant10ml" ? perfume.decant.precio10ml : perfume.precio;
	const carritoActual = leerCarrito();
	const itemExistente = carritoActual.find((item) => item.id === perfumeId && item.tipo === tipo);
	if (itemExistente) {
		itemExistente.cantidad += 1;
	} else {
		carritoActual.push({ id: perfume.id, nombre: perfume.nombre, tipo, precio, cantidad: 1 });
	}
	guardarCarrito(carritoActual);
	mostrarToast(`${perfume.nombre} agregado al carrito`);
}

function conectarBotonesCarrito(contenedor) {
	contenedor.querySelectorAll(".add-cart-button").forEach((boton) => boton.addEventListener("click", (evento) => {
		agregarAlCarrito(evento.currentTarget.dataset.id, "completo");
	}));
	contenedor.querySelectorAll(".cart-option").forEach((boton) => boton.addEventListener("click", (evento) => {
		agregarAlCarrito(evento.currentTarget.dataset.id, evento.currentTarget.dataset.type);
	}));
}

// Avanza a la siguiente imagen del producto y vuelve a la primera al llegar al final.
function cambiarImagen(evento) {
	const imagen = evento.currentTarget;
	let imagenes;
	try {
		imagenes = JSON.parse(imagen.dataset.imagenes || "[]");
	} catch (error) {
		return;
	}
	if (imagenes.length < 2) return;

	const indiceActual = Number(imagen.dataset.indice) || 0;
	const siguienteIndice = (indiceActual + 1) % imagenes.length;
	imagen.src = imagenes[siguienteIndice];
	imagen.dataset.indice = String(siguienteIndice);
	const indicador = imagen.parentElement.querySelector(".image-indicator");
	if (indicador) indicador.textContent = `${siguienteIndice + 1}/${imagenes.length}`;
}

// Convierte una lista de perfumes en tarjetas dentro del contenedor indicado.
function mostrarPerfumes(lista, contenedor) {
	contenedor.innerHTML = lista.length ? lista.map(crearTarjetaHTML).join("") : "<p>No hay perfumes para mostrar.</p>";
	// Conecta cada imagen despues de crear las tarjetas para que controle su propio producto.
	contenedor.querySelectorAll(".perfume-image").forEach((imagen) => {
		imagen.addEventListener("click", cambiarImagen);
		imagen.addEventListener("error", () => {
			imagen.hidden = true;
			imagen.parentElement.querySelector(".image-placeholder").classList.remove("oculto");
		});
	});
	conectarBotonesCarrito(contenedor);
}

// Renderiza cada linea del carrito con controles de cantidad y eliminacion.
function renderizarCarrito() {
	const carritoActual = leerCarrito();
	if (!carritoActual.length) {
		cartContainer.innerHTML = "<p>Tu carrito esta vacio.</p>";
		return;
	}
	const total = carritoActual.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
	cartContainer.innerHTML = `${carritoActual.map((item, indice) => `
		<div class="cart-item">
			<div><h3>${item.nombre}</h3><p>${obtenerEtiquetaTipo(item.tipo)} · $${item.precio.toLocaleString("es-AR")}</p></div>
			<div class="cart-item-controls"><button type="button" class="quantity-button" data-index="${indice}" data-change="-1">−</button><span>${item.cantidad}</span><button type="button" class="quantity-button" data-index="${indice}" data-change="1">+</button><button type="button" class="remove-cart-button" data-index="${indice}">Quitar</button></div>
		</div>`).join("")}
		<div class="cart-total">Total: $${total.toLocaleString("es-AR")}</div>
		<a class="whatsapp-button glass cart-whatsapp" href="${crearEnlaceWhatsApp(carritoActual, total)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>`;
	conectarControlesCarrito();
}

function obtenerEtiquetaTipo(tipo) {
	if (tipo === "decant5ml") return "Decant 5ml";
	if (tipo === "decant10ml") return "Decant 10ml";
	return "Perfume completo";
}

// Cambia cantidades, elimina lineas y vuelve a guardar el resultado.
function conectarControlesCarrito() {
	cartContainer.querySelectorAll(".quantity-button").forEach((boton) => boton.addEventListener("click", (evento) => {
		const carritoActual = leerCarrito();
		const item = carritoActual[Number(evento.currentTarget.dataset.index)];
		if (!item) return;
		item.cantidad += Number(evento.currentTarget.dataset.change);
		guardarCarrito(carritoActual.filter((producto) => producto.cantidad > 0));
		mostrarCarrito();
	}));
	cartContainer.querySelectorAll(".remove-cart-button").forEach((boton) => boton.addEventListener("click", (evento) => {
		const carritoActual = leerCarrito();
		carritoActual.splice(Number(evento.currentTarget.dataset.index), 1);
		guardarCarrito(carritoActual);
		mostrarCarrito();
	}));
}

// Construye el pedido completo y lo deja escrito en una conversacion de WhatsApp.
function crearEnlaceWhatsApp(carritoActual, total) {
	const detalle = carritoActual.map((item) => `- ${item.nombre} (${obtenerEtiquetaTipo(item.tipo)}), cantidad: ${item.cantidad}, unitario: $${item.precio}`).join("\n");
	const mensaje = `Hola, quiero consultar este pedido:\n${detalle}\nTotal: $${total}`;
	return `https://wa.me/5492284232681?text=${encodeURIComponent(mensaje)}`;
}

function mostrarCarrito() {
	renderizarCarrito();
	cerrarMenu();
	carrito.classList.add("abierto");
	actualizarEstadoDrawers();
}

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

// Combina categoria, marca y genero para que todos los filtros funcionen juntos.
function obtenerPerfumesFiltrados() {
	return perfumes.filter((perfume) => {
		const coincideCategoria = categoriaActiva === "todos" || perfume.categoria === categoriaActiva;
		const coincideMarca = !marcaActiva || perfume.marca === marcaActiva;
		const coincideGenero = generoActivo === "todos" || perfume.genero === generoActivo;
		return coincideCategoria && coincideMarca && coincideGenero;
	});
}

function nombreCategoria(categoria) {
	return categoria === "arabe" ? "Árabe" : "Diseñador";
}

// Muestra solo la pantalla de catalogo y conserva los filtros en su titulo.
function abrirCatalogo() {
	const lista = obtenerPerfumesFiltrados();
	let titulo = categoriaActiva === "todos" ? "Todos" : nombreCategoria(categoriaActiva);
	if (marcaActiva) titulo += ` — ${marcaActiva}`;
	if (generoActivo !== "todos") titulo += ` — ${generoActivo}`;
	catalogoTitulo.textContent = `Catálogo — ${titulo}`;
	mostrarPerfumes(lista, catalogoContainer);
	inicio.classList.add("oculto");
	destacados.classList.add("oculto");
	catalogo.classList.remove("oculto");
}

// Las categorias, marcas y generos salen del JSON para aceptar valores nuevos.
function renderizarFiltros() {
	const categorias = ["todos", ...new Set(perfumes.map((perfume) => perfume.categoria))];
	categoryFilters.innerHTML = categorias.map((categoria) => {
		const texto = categoria === "todos" ? "Todos" : nombreCategoria(categoria);
		return `<button class="filter-button" type="button" data-category="${categoria}">${texto}</button><div class="brand-list oculto" data-brands-for="${categoria}"></div>`;
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
	brandList.classList.toggle("oculto");
	brandList.querySelectorAll(".brand-button").forEach((boton) => boton.addEventListener("click", seleccionarMarca));
}

function seleccionarMarca(evento) {
	categoriaActiva = evento.currentTarget.dataset.category;
	marcaActiva = evento.currentTarget.dataset.brand;
	cerrarMenu();
	abrirCatalogo();
}

function seleccionarCategoria(evento) {
	const categoria = evento.currentTarget.dataset.category;
	marcaActiva = "";
	if (categoria === "todos") {
		categoriaActiva = "todos";
		cerrarMenu();
		abrirCatalogo();
		return;
	}

	categoriaActiva = categoria;
	alternarMarcas(categoria);
}

function seleccionarGenero(evento) {
	generoActivo = evento.currentTarget.dataset.gender;
	cerrarMenu();
	abrirCatalogo();
}

function conectarFiltros() {
	categoryFilters.querySelectorAll(".filter-button").forEach((boton) => boton.addEventListener("click", seleccionarCategoria));
	genderFilters.querySelectorAll(".gender-button").forEach((boton) => boton.addEventListener("click", seleccionarGenero));
}

function volverAlInicio() {
	catalogo.classList.add("oculto");
	cerrarCarrito();
	inicio.classList.remove("oculto");
	destacados.classList.remove("oculto");
}

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

menuButton.addEventListener("click", cambiarMenu);
cartButton.addEventListener("click", mostrarCarrito);
cartBackButton.addEventListener("click", cerrarCarrito);
closeMenuButton.addEventListener("click", cerrarMenu);
overlay.addEventListener("click", cerrarDrawers);
window.addEventListener("scroll", manejarScroll, { passive: true });
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

cargarPerfumes();
actualizarContadorCarrito();
