// Variable para debounce (optimización de búsqueda)
let searchTimeout;
let todosLosProductos = [];
let productoActual = null;
let puntuacion = 0;

// 1. CARGAR MENÚ CON JOIN DE OPINIONES (Optimizado)
async function cargarMenu() {
    // Pedimos productos y sus opiniones en una sola llamada para calcular rating
    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select(`*, opiniones(puntuacion)`)
        .eq('activo', true)
        .order('destacado', { ascending: false });

    if (error) { console.error("Error:", error); return; }

    // Procesamos el rating promedio en el cliente para no sobrecargar la BD
    todosLosProductos = productos.map(prod => {
        const totalOps = prod.opiniones.length;
        const suma = prod.opiniones.reduce((acc, curr) => acc + curr.puntuacion, 0);
        prod.ratingPromedio = totalOps ? (suma / totalOps).toFixed(1) : null;
        return prod;
    });

    renderizarMenu(todosLosProductos);
}

// 2. RENDERIZADO DE ALTO RENDIMIENTO
function renderizarMenu(lista) {
    const contenedor = document.getElementById('menu-grid');
    
    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; width:100%; margin-top:20px;">No encontramos coincidencias 😢</p>';
        return;
    }

    // Construimos un solo string HTML (Mejor rendimiento que .innerHTML +=)
    const htmlString = lista.map(item => {
        const claseAgotado = item.estado === 'agotado' ? 'agotado' : '';
        const img = item.imagen_url || 'https://via.placeholder.com/300?text=Sin+Imagen';
        const badge = item.destacado ? `<span class="badge-destacado">★ TOP</span>` : '';
        const ratingDisplay = item.ratingPromedio ? `⭐ ${item.ratingPromedio}` : '';

        return `
            <div class="card ${claseAgotado}" onclick="abrirDetalle(${item.id})">
                ${badge}
                <div class="img-box"><img src="${img}" loading="lazy" alt="${item.nombre}"></div>
                <div class="info">
                    <h3>${item.nombre}</h3>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                         <span class="price">$${item.precio}</span>
                         <span style="font-size:0.75rem; color:#ccc;">${ratingDisplay}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    contenedor.innerHTML = htmlString;
}

// 3. DETALLE OPTIMIZADO
function abrirDetalle(id) {
    productoActual = todosLosProductos.find(p => p.id === id);
    if (!productoActual) return;

    document.getElementById('det-img').src = productoActual.imagen_url || '';
    document.getElementById('det-titulo').textContent = productoActual.nombre;
    document.getElementById('det-desc').textContent = productoActual.descripcion;
    document.getElementById('det-precio').textContent = `$${productoActual.precio}`;
    
    const ratingText = productoActual.ratingPromedio ? `⭐ ${productoActual.ratingPromedio} / 5` : '⭐ Sé el primero en opinar';
    document.getElementById('det-rating').textContent = ratingText;

    const curiosidad = productoActual.curiosidad;
    const box = document.getElementById('box-curiosidad');
    if (curiosidad && curiosidad.length > 5) {
        box.style.display = "flex";
        document.getElementById('det-curiosidad').textContent = curiosidad;
    } else {
        box.style.display = "none";
    }
    
    document.getElementById('modal-detalle').style.display = 'flex';
}
function cerrarDetalle() { document.getElementById('modal-detalle').style.display = 'none'; }

// 4. OPINIONES
function abrirOpinionDesdeDetalle() {
    cerrarDetalle();
    document.getElementById('modal-opinion').style.display = 'flex';
    puntuacion = 0;
    actualizarEstrellas();
}
function cerrarModalOpiniones() { document.getElementById('modal-opinion').style.display = 'none'; }

// Delegación de eventos para estrellas
document.getElementById('stars-container').addEventListener('click', (e) => {
    if (e.target.tagName === 'SPAN') {
        puntuacion = parseInt(e.target.dataset.val);
        actualizarEstrellas();
    }
});

function actualizarEstrellas() {
    const estrellas = document.querySelectorAll('#stars-container span');
    estrellas.forEach(s => {
        s.style.color = parseInt(s.dataset.val) <= puntuacion ? 'var(--gold)' : '#444';
    });
}

async function enviarOpinion() {
    if (puntuacion === 0) { alert("¡Por favor toca las estrellas para puntuar!"); return; }
    
    const nombre = document.getElementById('cliente-nombre').value || "Cliente Anónimo";
    const comentario = document.getElementById('cliente-comentario').value;
    const btn = document.querySelector('.btn-primary'); // Botón del modal opinion

    btn.textContent = "Enviando..."; btn.disabled = true;

    const { error } = await supabaseClient.from('opiniones').insert([{
        producto_id: productoActual.id,
        cliente_nombre: nombre,
        comentario: comentario,
        puntuacion: puntuacion
    }]);

    if (!error) {
        alert("¡Gracias por tu opinión!");
        cerrarModalOpiniones();
        // Recargar menú para actualizar promedio
        cargarMenu(); 
    } else {
        alert("Error al enviar: " + error.message);
    }
    btn.textContent = "ENVIAR RESEÑA"; btn.disabled = false;
}

// 5. FILTROS & BUSCADOR CON DEBOUNCE
function filtrar(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('search-input').value = '';
    
    const lista = cat === 'todos' ? todosLosProductos : todosLosProductos.filter(p => p.categoria === cat);
    renderizarMenu(lista);
}

document.getElementById('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const term = e.target.value.toLowerCase();
    
    // Esperamos 300ms antes de filtrar para no saturar el navegador
    searchTimeout = setTimeout(() => {
        const lista = todosLosProductos.filter(p => 
            p.nombre.toLowerCase().includes(term) || 
            (p.descripcion && p.descripcion.toLowerCase().includes(term))
        );
        renderizarMenu(lista);
    }, 300);
});

document.addEventListener('DOMContentLoaded', cargarMenu);