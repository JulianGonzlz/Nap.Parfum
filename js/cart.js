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
	let guardado;
	try {
		guardado = JSON.parse(localStorage.getItem("nap-carrito") || "[]");
	} catch (error) {
		return [];
	}
	return normalizarCarrito(guardado);
}

// Seguridad: localStorage puede ser editado por cualquiera desde el navegador, asi que
// se validan tipos y cantidades, y el nombre y precio se toman siempre del catalogo oficial.
const TIPOS_VALIDOS = ["completo", "decant5ml", "decant10ml"];
const CANTIDAD_MAXIMA = 99;

function normalizarCarrito(guardado) {
	if (!Array.isArray(guardado)) return [];
	return guardado.reduce((resultado, item) => {
		if (!item || typeof item.id !== "string" || !TIPOS_VALIDOS.includes(item.tipo)) return resultado;
		const cantidad = Math.min(Math.floor(Number(item.cantidad)), CANTIDAD_MAXIMA);
		if (!Number.isFinite(cantidad) || cantidad < 1) return resultado;
		if (!perfumes.length) {
			// Catalogo aun no cargado: se conserva el item validado, sin confiar en su precio.
			resultado.push({ id: item.id, nombre: String(item.nombre || ""), tipo: item.tipo, precio: 0, cantidad });
			return resultado;
		}
		const perfume = perfumes.find((producto) => producto.id === item.id);
		const precio = perfume ? obtenerPrecioCatalogo(perfume, item.tipo) : null;
		if (precio === null) return resultado;
		resultado.push({ id: perfume.id, nombre: perfume.nombre, tipo: item.tipo, precio, cantidad });
		return resultado;
	}, []);
}

// Devuelve el precio oficial de la presentacion, o null si no esta disponible.
function obtenerPrecioCatalogo(perfume, tipo) {
	const decant = perfume.decant || {};
	if (tipo !== "completo" && !decant.disponible) return null;
	const precio = Number(tipo === "decant5ml" ? decant.precio5ml : tipo === "decant10ml" ? decant.precio10ml : perfume.precio);
	return Number.isFinite(precio) && precio >= 0 ? precio : null;
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
	if (!perfume || !TIPOS_VALIDOS.includes(tipo)) return;
	const precio = obtenerPrecioCatalogo(perfume, tipo);
	if (precio === null) return;
	const carritoActual = leerCarrito();
	const itemExistente = carritoActual.find((item) => item.id === perfumeId && item.tipo === tipo);
	if (itemExistente) {
		itemExistente.cantidad = Math.min(itemExistente.cantidad + 1, CANTIDAD_MAXIMA);
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
			<div><h3>${escaparHTML(item.nombre)}</h3><p>${obtenerEtiquetaTipo(item.tipo)} · $${formatearPrecio(item.precio)}</p></div>
			<div class="cart-item-controls"><button type="button" class="quantity-button" data-index="${indice}" data-change="-1">−</button><span>${item.cantidad}</span><button type="button" class="quantity-button" data-index="${indice}" data-change="1">+</button><button type="button" class="remove-cart-button" data-index="${indice}">Quitar</button></div>
		</div>`).join("")}
		<div class="cart-total">Total: $${total.toLocaleString("es-AR")}</div>
		<a class="whatsapp-button glass cart-whatsapp" href="${escaparHTML(crearEnlaceWhatsApp(carritoActual, total))}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>`;
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
		item.cantidad = Math.min(item.cantidad + Number(evento.currentTarget.dataset.change), CANTIDAD_MAXIMA);
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
