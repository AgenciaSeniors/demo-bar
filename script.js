// --- script.js ---
// NOTA: Ya no ponemos "const CONFIG" aquí porque config.js ya lo cargó.

let searchTimeout;
let todosLosProductos = [];
let productoActual = null;
let puntuacion = 0;

// 1. CARGAR MENÚ
async function cargarMenu() {
    console.log("🚀 Iniciando carga del menú...");
    const grid = document.getElementById('menu-grid');
    
    // Mostramos Skeletons (cajas grises) mientras carga
    if (grid) grid.innerHTML = Array(6).fill('<div class="skeleton skeleton-card"></div>').join('');

    try {
        // Verificamos si Supabase está conectado
        if (typeof supabaseClient === 'undefined') {
            throw new Error("Supabase no está conectado. Revisa config.js");
        }

        // Cargar productos
        let { data: productos, error } = await supabaseClient
            .from('productos')
            .select(`*, opiniones(puntuacion)`)
            .eq('activo', true)
            .order('destacado', { ascending: false });

        if (error) throw error;

        console.log("✅ Productos cargados:", productos.length);

        // Procesar datos
        todosLosProductos = productos.map(prod => {
            const opiniones = prod.opiniones || [];
            const total = opiniones.length;
            const suma = opiniones.reduce((acc, curr) => acc + curr.puntuacion, 0);
            prod.ratingPromedio = total ? (suma / total).toFixed(1) : null;
            return prod;
        });

    } catch (err) {
        console.error("❌ Error crítico:", err);
        // Intentar carga simple por si acaso falló la relación de opiniones
        try {
            let { data: simple } = await supabaseClient.from('productos').select('*').eq('activo', true);
            if (simple) todosLosProductos = simple;
        } catch (e) { }
    }

    renderizarMenu(todosLosProductos);
}

// 2. RENDERIZAR (Modo Visible 100%)
function renderizarMenu(lista) {
    const contenedor = document.getElementById('menu-grid');
    if (!contenedor) return;
    
    contenedor.innerHTML = '';

    if (!lista || lista.length === 0) {
        contenedor.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;"><h4>Carta Vacía 🍽️</h4><p>No se encontraron productos.</p></div>';
        return;
    }

    const html = lista.map((item, index) => {
        const claseAgotado = item.estado === 'agotado' ? 'agotado' : '';
        const img = item.imagen_url || 'https://via.placeholder.com/300?text=Sin+Imagen';
        const badge = item.destacado ? `<span class="badge-destacado">👑 TOP</span>` : '';
        const rating = item.ratingPromedio ? `★ ${item.ratingPromedio}` : '★ Nuevo';
        
        // HE QUITADO "opacity: 0" para asegurar que se vean sí o sí
        return `
            <div class="card ${claseAgotado}" onclick="abrirDetalle(${item.id})">
                ${badge}
                <div class="img-box"><img src="${img}" loading="lazy" alt="${item.nombre}"></div>
                <div class="info">
                    <h3>${item.nombre}</h3>
                    <p class="short-desc">${item.descripcion || ''}</p>
                    <div class="card-footer">
                         <span class="price">$${item.precio}</span>
                         <span class="rating-pill">${rating}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    contenedor.innerHTML = html;
}

// 3. DETALLES Y MODALES
function abrirDetalle(id) {
    productoActual = todosLosProductos.find(p => p.id === id);
    if (!productoActual) return;

    const imgEl = document.getElementById('det-img');
    const box = document.getElementById('box-curiosidad');
    
    if(imgEl) imgEl.src = productoActual.imagen_url || '';
    setText('det-titulo', productoActual.nombre);
    setText('det-desc', productoActual.descripcion);
    setText('det-precio', `$${productoActual.precio}`);
    
    const ratingBig = productoActual.ratingPromedio ? `★ ${productoActual.ratingPromedio}` : '★ --';
    setText('det-rating-big', ratingBig);

    if (productoActual.curiosidad && productoActual.curiosidad.length > 5) {
        if(box) box.style.display = "flex";
        setText('det-curiosidad', productoActual.curiosidad);
    } else {
        if(box) box.style.display = "none";
    }
    
    const modal = document.getElementById('modal-detalle');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
}

function cerrarDetalle() {
    const modal = document.getElementById('modal-detalle');
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// Puente a opiniones
function abrirOpinionDesdeDetalle() {
    cerrarDetalle();
    const modal = document.getElementById('modal-opinion');
    if(modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        puntuacion = 0;
        actualizarEstrellas();
    }
}

function cerrarModalOpiniones() {
    const modal = document.getElementById('modal-opinion');
    if(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// Estrellas
const starsContainer = document.getElementById('stars-container');
if(starsContainer) {
    starsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN') {
            puntuacion = parseInt(e.target.dataset.val);
            actualizarEstrellas();
        }
    });
}

function actualizarEstrellas() {
    document.querySelectorAll('#stars-container span').forEach(s => {
        const val = parseInt(s.dataset.val);
        s.style.color = val <= puntuacion ? 'var(--gold)' : '#444';
        s.textContent = val <= puntuacion ? '★' : '☆';
    });
}

async function enviarOpinion() {
    if (puntuacion === 0) { alert("¡Puntúa con estrellas!"); return; }
    
    const nombre = document.getElementById('cliente-nombre').value || "Anónimo";
    const comentario = document.getElementById('cliente-comentario').value;
    const btn = document.querySelector('#modal-opinion .btn-big-action');

    if(btn) { btn.textContent = "Enviando..."; btn.disabled = true; }

    const { error } = await supabaseClient.from('opiniones').insert([{
        producto_id: productoActual.id,
        cliente_nombre: nombre,
        comentario: comentario,
        puntuacion: puntuacion
    }]);

    if (!error) {
        alert("¡Gracias!");
        cerrarModalOpiniones();
        document.getElementById('cliente-comentario').value = "";
        cargarMenu(); 
    } else {
        alert("Error al enviar.");
    }
    if(btn) { btn.textContent = "ENVIAR"; btn.disabled = false; }
}

// Filtros y Buscador
function filtrar(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    const searchInput = document.getElementById('search-input');
    if(searchInput) searchInput.value = '';
    
    const lista = cat === 'todos' ? todosLosProductos : todosLosProductos.filter(p => p.categoria === cat);
    renderizarMenu(lista);
}

const searchInput = document.getElementById('search-input');
if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const term = e.target.value.toLowerCase();
        searchTimeout = setTimeout(() => {
            const lista = todosLosProductos.filter(p => 
                p.nombre.toLowerCase().includes(term) || 
                (p.descripcion && p.descripcion.toLowerCase().includes(term))
            );
            renderizarMenu(lista);
        }, 300);
    });
}

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', cargarMenu);