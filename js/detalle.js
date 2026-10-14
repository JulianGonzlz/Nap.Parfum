/* VISTA DE DETALLE DEL PERFUME
   Ficha individual con las fotos en grande, las notas y acordes por escrito y las presentaciones. */

// "generales" son notas que el perfume trae sin separar por etapa.
const GRUPOS_NOTAS = [["generales", "Notas"], ["salida", "Notas de salida"], ["corazon", "Corazón"], ["fondo", "Base"]];

// Solo se muestran los grupos que el perfume tiene cargados; sin ninguno, no aparece el bloque.
function notasHTML(perfume) {
	const notas = perfume.notas || {};
	const grupos = GRUPOS_NOTAS.map(([clave, titulo]) => [titulo, notas[clave]]);
	grupos.push(["Acordes principales", perfume.acordes]);
	const filas = grupos
		.filter(([, valores]) => Array.isArray(valores) && valores.length)
		.map(([titulo, valores]) => `<div><dt>${titulo}</dt><dd>${escaparHTML(valores.join(", "))}</dd></div>`);
	return filas.length ? `<dl class="detalle-notas">${filas.join("")}</dl>` : "";
}

function galeriaHTML(perfume) {
	const imagenes = Array.isArray(perfume.imagenes) ? perfume.imagenes.map(String) : [];
	if (!imagenes.length) return `<div class="image-placeholder" aria-label="Imagen no disponible">◎</div>`;
	const nombre = escaparHTML(perfume.nombre);
	const miniaturasHTML = imagenes.length > 1
		? `<div class="detalle-miniaturas">${imagenes.map((imagen, indice) => `<button class="detalle-miniatura${indice ? "" : " activa"}" type="button" data-src="${escaparHTML(imagen)}" aria-label="Ver foto ${indice + 1} de ${imagenes.length}"><img src="${escaparHTML(imagen)}" alt="" loading="lazy" decoding="async"></button>`).join("")}</div>`
		: "";
	return `<img class="detalle-imagen" src="${escaparHTML(imagenes[0])}" alt="${nombre}" decoding="async">${miniaturasHTML}`;
}

function crearDetalleHTML(perfume) {
	return `
		<div class="detalle-barra">
			<button class="detalle-volver" type="button">← Volver</button>
			<button class="detalle-compartir" type="button">Compartir</button>
		</div>
		<article class="detalle-ficha">
			<div class="detalle-galeria">${galeriaHTML(perfume)}</div>
			<div class="detalle-info">
				<span class="category">${escaparHTML(etiquetaClasificacion(perfume))}</span>
				<h2 class="detalle-nombre">${escaparHTML(perfume.nombre)}</h2>
				<p class="description">${escaparHTML(perfume.descripcion)}</p>
				${notasHTML(perfume)}
				${accionesCarritoHTML(perfume)}
			</div>
		</article>`;
}

// Abre la ficha de un perfume; si el id no existe en el catalogo, muestra el catalogo.
function abrirDetalle(perfumeId) {
	const perfume = perfumes.find((item) => item.id === perfumeId);
	if (!perfume) {
		abrirCatalogo();
		return;
	}
	perfumeDetalleId = perfume.id;
	detalleContainer.innerHTML = crearDetalleHTML(perfume);
	detalleContainer.querySelector(".detalle-volver").addEventListener("click", volverDesdeDetalle);
	detalleContainer.querySelector(".detalle-compartir").addEventListener("click", compartirPerfume);
	detalleContainer.querySelectorAll(".detalle-miniatura").forEach((boton) => boton.addEventListener("click", cambiarImagenDetalle));
	conectarBotonesCarrito(detalleContainer);
	cerrarDrawers();
	sincronizarURL(cambiarVista("detalle"));
}

// Las tarjetas enlazan a "?perfume=id": el click normal abre la ficha sin recargar la pagina,
// y abrir en otra pestaña (Ctrl/clic medio) sigue funcionando como un enlace comun.
function manejarClickDetalle(evento) {
	if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
	evento.preventDefault();
	abrirDetalle(evento.currentTarget.dataset.id);
}

function cambiarImagenDetalle(evento) {
	const boton = evento.currentTarget;
	detalleContainer.querySelector(".detalle-imagen").src = boton.dataset.src;
	detalleContainer.querySelectorAll(".detalle-miniatura").forEach((miniatura) => miniatura.classList.toggle("activa", miniatura === boton));
}

// Vuelve a la vista anterior del sitio; si se entro directo por un enlace, va al catalogo.
function volverDesdeDetalle() {
	if (history.state && history.state.interno) history.back();
	else abrirCatalogo();
}

// Comparte el enlace de la ficha con el menu del dispositivo, o lo copia si no hay menu.
async function compartirPerfume() {
	try {
		if (navigator.share) {
			await navigator.share({ title: document.title, url: location.href });
		} else {
			await navigator.clipboard.writeText(location.href);
			mostrarToast("Enlace copiado");
		}
	} catch (error) {
		// Cerrar el menu de compartir no es un error.
		if (error.name !== "AbortError") mostrarToast("No se pudo copiar el enlace");
	}
}
