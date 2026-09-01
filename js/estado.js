/* ESTADO GLOBAL Y REFERENCIAS AL DOM
   Este archivo se carga PRIMERO y define todas las variables globales y referencias compartidas.
   Los otros archivos dependen de estas variables. */

// Referencias al DOM - elementos que se reutilizan en múltiples funciones
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
const logo = document.querySelector(".logo");
const searchInput = document.getElementById("search-input");

// Estado de la aplicación
let perfumes = [];
let categoriaActiva = "todos";
let marcaActiva = "";
let generoActivo = "todos";
let textoSearchActivo = "";

// Estado del scroll y header
let ultimaPosicionScroll = window.scrollY;
let frameScrollPendiente = false;
let scrollHaciaAbajo = false;

// Temporizadores
let temporizadorHeader;
let temporizadorToast;
let temporizadorOcultarToast;
let temporizadorSearch;
