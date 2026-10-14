/* RENDERIZADO DE TARJETAS Y CAMBIO DE IMÁGENES
   Responsable de crear el HTML de tarjetas de producto y manejar el cambio de imágenes. */

// Linea "Árabe · Marca · Masculino" que comparten la tarjeta y la vista de detalle.
function etiquetaClasificacion(perfume) {
	return `${nombreCategoria(perfume.categoria)} · ${perfume.marca} · ${capitalizar(String(perfume.genero ?? ""))}`;
}

// Botones de compra (sellado y decants) que comparten la tarjeta y la vista de detalle.
function accionesCarritoHTML(perfume) {
	const id = escaparHTML(perfume.id);
	const nombre = escaparHTML(perfume.nombre);
	const decant = perfume.decant || {};
	const opcionesHTML = decant.disponible
		? `<div class="cart-options"><button class="cart-option" type="button" data-id="${id}" data-type="decant5ml">Decant 5ml · $${formatearPrecio(decant.precio5ml)}</button><button class="cart-option" type="button" data-id="${id}" data-type="decant10ml">Decant 10ml · $${formatearPrecio(decant.precio10ml)}</button></div>`
		: "";
	return `<div class="cart-actions">
				<button class="add-cart-button glass" type="button" data-id="${id}" aria-label="Agregar ${nombre} al carrito">Sellado ${escaparHTML(perfume.ml)}ml · $${formatearPrecio(perfume.precio)}</button>
				${opcionesHTML}
			</div>`;
}

// Una sola plantilla evita repetir el marcado de las tarjetas en ambas vistas.
function crearTarjetaHTML(perfume) {
	const claseStock = perfume.stock ? "" : " sin-stock";
	const imagenes = Array.isArray(perfume.imagenes) ? perfume.imagenes.map(String) : [];
	const id = escaparHTML(perfume.id);
	const nombre = escaparHTML(perfume.nombre);
	const enlace = `?perfume=${encodeURIComponent(perfume.id)}`;
	const indicadorHTML = imagenes.length > 1 ? `<span class="image-indicator" aria-hidden="true">1/${imagenes.length}</span>` : "";
	const imagenHTML = imagenes.length
		? `<div class="image-container"><img class="perfume-image${imagenes.length > 1 ? " imagen-rotativa" : ""}" src="${escaparHTML(imagenes[0])}" alt="${nombre}" loading="lazy" decoding="async" data-id="${id}" data-indice="0" data-imagenes="${escaparHTML(JSON.stringify(imagenes))}">${indicadorHTML}<div class="image-placeholder oculto" aria-hidden="true">◎</div></div>`
		: `<div class="image-placeholder" aria-label="Imagen no disponible">◎</div>`;
	return `
		<article class="perfume-card${claseStock}">
			${imagenHTML}
			<span class="category">${escaparHTML(etiquetaClasificacion(perfume))}</span>
			<h3 class="perfume-name"><a class="enlace-detalle" href="${escaparHTML(enlace)}" data-id="${id}">${nombre}</a></h3>
			<p class="description">${escaparHTML(perfume.descripcion)}</p>
			<a class="enlace-detalle ver-detalle" href="${escaparHTML(enlace)}" data-id="${id}" aria-label="Ver detalle de ${nombre}">Ver detalle</a>
			${accionesCarritoHTML(perfume)}
		</article>`;
}

// Formatea un precio como numero; cualquier valor invalido se muestra como 0.
function formatearPrecio(valor) {
	const numero = Number(valor);
	return (Number.isFinite(numero) ? numero : 0).toLocaleString("es-AR");
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
	if (lista.length === 0) {
		if (textoSearchActivo) {
			contenedor.innerHTML = "<p>No se encontraron perfumes que coincidan con tu búsqueda.</p>";
		} else {
			contenedor.innerHTML = "<p>No hay perfumes para mostrar.</p>";
		}
	} else {
		contenedor.innerHTML = lista.map(crearTarjetaHTML).join("");
	}
	// Conecta cada imagen despues de crear las tarjetas para que controle su propio producto.
	contenedor.querySelectorAll(".perfume-image").forEach((imagen) => {
		imagen.addEventListener("click", cambiarImagen);
		imagen.addEventListener("error", () => {
			imagen.hidden = true;
			imagen.parentElement.querySelector(".image-placeholder").classList.remove("oculto");
		});
	});
	contenedor.querySelectorAll(".enlace-detalle").forEach((enlace) => enlace.addEventListener("click", manejarClickDetalle));
	conectarBotonesCarrito(contenedor);
}
