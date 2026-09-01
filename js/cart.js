/* CARRITO DE COMPRAS
   Gestiona la lógica completa del carrito: agregar/quitar productos, localStorage, renderizado. */

// Muestra una notificación temporal en la esquina inferior
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

// Estas dos funciones son las únicas que acceden directamente al carrito guardado en el navegador.
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

// Conecta los botones de agregar al carrito con sus handlers
function conectarBotonesCarrito(contenedor) {
	contenedor.querySelectorAll(".add-cart-button").forEach((boton) => boton.addEventListener("click", (evento) => {
		agregarAlCarrito(evento.currentTarget.dataset.id, "completo");
	}));
	contenedor.querySelectorAll(".cart-option").forEach((boton) => boton.addEventListener("click", (evento) => {
		agregarAlCarrito(evento.currentTarget.dataset.id, evento.currentTarget.dataset.type);
	}));
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

// Traduce el tipo de presentación a etiqueta legible
function obtenerEtiquetaTipo(tipo) {
	if (tipo === "decant5ml") return "Decant 5ml";
	if (tipo === "decant10ml") return "Decant 10ml";
	return "Perfume completo";
}

function obtenerEtiquetaTipoPedido(tipo) {
	if (tipo === "decant5ml") return "Decant 5ml";
	if (tipo === "decant10ml") return "Decant 10ml";
	return "Frasco entero";
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
	const detalle = carritoActual.map((item) => {
		const etiqueta = obtenerEtiquetaTipoPedido(item.tipo);
		const precioLinea = item.precio * item.cantidad;
		return `- ${item.nombre} (${etiqueta}) x${item.cantidad} - $${precioLinea.toLocaleString("es-AR")}`;
	}).join("\n");
	const mensaje = `Hola, te quiero consultar por el siguiente pedido:\n\n${detalle}\n\nTotal: $${total.toLocaleString("es-AR")}\n\nQuedo atento a la confirmación, gracias.`;
	return `https://wa.me/5492284232681?text=${encodeURIComponent(mensaje)}`;
}

// Abre el drawer del carrito y renderiza su contenido
function mostrarCarrito() {
	renderizarCarrito();
	cerrarMenu();
	carrito.classList.add("abierto");
	actualizarEstadoDrawers();
}
