/* RENDERIZADO DE TARJETAS Y CAMBIO DE IMÁGENES
   Responsable de crear el HTML de tarjetas de producto y manejar el cambio de imágenes. */

// Una sola plantilla evita repetir el marcado de las tarjetas en ambas vistas.
function crearTarjetaHTML(perfume) {
	const claseStock = perfume.stock ? "" : " sin-stock";
	const imagenes = Array.isArray(perfume.imagenes) ? perfume.imagenes : [];
	const indicadorHTML = imagenes.length > 1 ? `<span class="image-indicator" aria-hidden="true">1/${imagenes.length}</span>` : "";
	const imagenHTML = imagenes.length
		? `<div class="image-container"><img class="perfume-image${imagenes.length > 1 ? " imagen-rotativa" : ""}" src="${imagenes[0]}" alt="${perfume.nombre}" data-id="${perfume.id}" data-indice="0" data-imagenes='${JSON.stringify(imagenes)}'>${indicadorHTML}<div class="image-placeholder oculto" aria-hidden="true">◎</div></div>`
		: `<div class="image-placeholder" aria-label="Imagen no disponible">◎</div>`;
	const opcionesHTML = perfume.decant.disponible
		? `<div class="cart-options"><button class="cart-option" type="button" data-id="${perfume.id}" data-type="decant5ml">Decant 5ml · $${perfume.decant.precio5ml.toLocaleString("es-AR")}</button><button class="cart-option" type="button" data-id="${perfume.id}" data-type="decant10ml">Decant 10ml · $${perfume.decant.precio10ml.toLocaleString("es-AR")}</button></div>`
		: "";
	return `
		<article class="perfume-card${claseStock}">
			${imagenHTML}
			<span class="category">${perfume.categoria} · ${perfume.marca} · ${perfume.genero}</span>
			<h3 class="perfume-name">${perfume.nombre}</h3>
			<p class="description">${perfume.descripcion}</p>
			<div class="cart-actions">
				<button class="add-cart-button glass" type="button" data-id="${perfume.id}">Agregar al carrito</button>
				${opcionesHTML}
			</div>
			<div class="card-footer">
				<span class="price">$${perfume.precio.toLocaleString("es-AR")} - Producto entero sellado</span>
			</div>
		</article>`;
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
	conectarBotonesCarrito(contenedor);
}
