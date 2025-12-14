// CONFIGURACIÓN
const SUPABASE_URL = 'https://qspwtmfmolvqlzsbwlzv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU'; // Tu clave correcta
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let todosLosProductos = [];
let productoSeleccionadoId = null;
let puntuacionActual = 0;

// 1. CARGAR MENÚ
async function cargarMenu() {
    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true) 
        .order('destacado', { ascending: false }) // Los destacados primero
        .order('id', { ascending: false });

    if (error) { console.error(error); return; }
    
    todosLosProductos = productos;
    renderizarMenu(todosLosProductos);
}

// 2. RENDERIZAR (Con etiquetas y botones)
function renderizarMenu(lista) {
    const contenedor = document.getElementById('menu-grid');
    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; width:100%; margin-top:20px;">No encontramos coincidencias 😢</p>';
        return;
    }

    lista.forEach(item => {
        const claseAgotado = item.estado === 'agotado' ? 'agotado' : '';
        const imagenFinal = item.imagen_url || 'https://via.placeholder.com/150';
        
        // Etiqueta de Destacado
        let badgeHtml = '';
        if (item.destacado) {
            badgeHtml = `<span class="badge-destacado">★ RECOMENDADO</span>`;
        }

        const html = `
            <div class="card ${claseAgotado}">
                ${badgeHtml}
                <div class="img-box">
                    <img src="${imagenFinal}" alt="${item.nombre}" loading="lazy">
                </div>
                <div class="info">
                    <div class="row">
                        <h3>${item.nombre}</h3>
                        <span class="price">$${item.precio}</span>
                    </div>
                    <p class="short-desc">${item.descripcion || ''}</p>
                    <button class="btn-opinar" onclick="abrirModal(${item.id}, '${item.nombre}')">
                        💬 Opinar sobre este plato
                    </button>
                </div>
            </div>
        `;
        contenedor.innerHTML += html;
    });
}

// 3. BUSCADOR INSTANTÁNEO
document.getElementById('search-input').addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    const filtrados = todosLosProductos.filter(prod => 
        prod.nombre.toLowerCase().includes(termino) || 
        (prod.descripcion && prod.descripcion.toLowerCase().includes(termino))
    );
    renderizarMenu(filtrados);
});

// 4. FILTROS CATEGORÍA
function filtrar(categoria, boton) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    boton.classList.add('active');
    
    // Limpiamos buscador al cambiar filtro
    document.getElementById('search-input').value = '';

    if (categoria === 'todos') {
        renderizarMenu(todosLosProductos);
    } else {
        renderizarMenu(todosLosProductos.filter(p => p.categoria === categoria));
    }
}

// 5. LÓGICA DE OPINIONES
function abrirModal(id, nombre) {
    productoSeleccionadoId = id;
    document.getElementById('modal-prod-name').textContent = nombre;
    document.getElementById('modal-opinion').style.display = 'flex';
    puntuacionActual = 0;
    actualizarEstrellas();
}

function cerrarModal() {
    document.getElementById('modal-opinion').style.display = 'none';
}

// Manejo de estrellas
document.querySelectorAll('.stars span').forEach(star => {
    star.addEventListener('click', () => {
        puntuacionActual = parseInt(star.dataset.val);
        actualizarEstrellas();
    });
});

function actualizarEstrellas() {
    document.querySelectorAll('.stars span').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.val) <= puntuacionActual);
    });
}

async function enviarOpinion() {
    if (puntuacionActual === 0) { alert("¡Por favor toca las estrellas para puntuar!"); return; }
    
    const nombre = document.getElementById('cliente-nombre').value || "Anónimo";
    const comentario = document.getElementById('cliente-comentario').value;
    const btn = document.querySelector('.btn-submit');
    
    btn.textContent = "Enviando...";
    btn.disabled = true;

    const { error } = await supabaseClient.from('opiniones').insert([{
        producto_id: productoSeleccionadoId,
        cliente_nombre: nombre,
        comentario: comentario,
        puntuacion: puntuacionActual
    }]);

    if (!error) {
        alert("¡Gracias por tu opinión!");
        cerrarModal();
        document.getElementById('cliente-nombre').value = '';
        document.getElementById('cliente-comentario').value = '';
    } else {
        alert("Error al enviar. Intenta de nuevo.");
    }
    btn.textContent = "Enviar";
    btn.disabled = false;
}

document.addEventListener('DOMContentLoaded', cargarMenu);