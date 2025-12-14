// --- 1. CONFIGURACIÓN ---
const SUPABASE_URL = 'https://qspwtmfmolvqlzsbwlzv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU';

// CORRECCIÓN IMPORTANTE: Faltaba esta línea para crear la conexión
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let todosLosProductos = [];

// --- 2. CARGAR PRODUCTOS ---
async function cargarMenu() {
    // Pedimos a la base de datos solo los productos activos
    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true) 
        .order('id', { ascending: false });

    if (error) {
        console.error('Error cargando menú:', error);
        document.getElementById('menu-grid').innerHTML = '<p>Error al cargar el menú.</p>';
        return;
    }

    todosLosProductos = productos;
    renderizarMenu(todosLosProductos);
}

// --- 3. PINTAR EN PANTALLA ---
function renderizarMenu(lista) {
    const contenedor = document.getElementById('menu-grid');
    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; width:100%">No hay productos en esta categoría.</p>';
        return;
    }

    lista.forEach(item => {
        const claseAgotado = item.estado === 'agotado' ? 'agotado' : '';
        
        // Si la imagen viene de Supabase es una URL completa, si es local es una ruta relativa.
        // El navegador maneja ambas correctamente.
        const imagenFinal = item.imagen_url || 'https://via.placeholder.com/150';

        const html = `
            <div class="card ${claseAgotado}">
                <div class="img-box">
                    <img src="${imagenFinal}" alt="${item.nombre}" loading="lazy">
                </div>
                <div class="info">
                    <div class="row">
                        <h3>${item.nombre}</h3>
                        <span class="price">$${item.precio}</span>
                    </div>
                    <p class="short-desc">${item.descripcion || ''}</p>
                </div>
            </div>
        `;
        contenedor.innerHTML += html;
    });
}

// --- 4. FILTROS ---
function filtrar(categoria, boton) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    boton.classList.add('active');

    if (categoria === 'todos') {
        renderizarMenu(todosLosProductos);
    } else {
        const filtrados = todosLosProductos.filter(p => p.categoria === categoria);
        renderizarMenu(filtrados);
    }
}

document.addEventListener('DOMContentLoaded', cargarMenu);