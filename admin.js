// --- SEGURIDAD SIMPLE ---
const CLAVE_SECRETA = "1234"; 

const entrada = prompt("🔒 Área restringida. Ingresa la contraseña de Administrador:");

if (entrada !== CLAVE_SECRETA) {
    alert("⛔ Contraseña incorrecta. Acceso denegado.");
    window.location.href = "index.html"; 
}

// --- 1. CONFIGURACIÓN ---
const SUPABASE_URL = 'https://qspwtmfmolvqlzsbwlzv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. CARGAR LISTA PARA EDITAR ---
async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    lista.innerHTML = 'Cargando inventario...';

    // CORRECCIÓN: Ahora usamos supabaseClient
    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: false });

    if (error) { alert('Error cargando: ' + error.message); return; }

    lista.innerHTML = '';

    productos.forEach(item => {
        const esAgotado = item.estado === 'agotado';
        const estadoBadge = esAgotado 
            ? '<span class="status-text status-agotado">AGOTADO</span>' 
            : '<span class="status-text status-disponible">DISPONIBLE</span>';
        
        const btnTexto = esAgotado ? 'Marcar Disponible' : 'Marcar Agotado';

        const div = document.createElement('div');
        div.className = 'admin-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center;">
                <img src="${item.imagen_url}" alt="img">
                <div class="item-details">
                    <strong>${item.nombre}</strong> ($${item.precio})
                    ${estadoBadge}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-sm btn-toggle" onclick="toggleEstado(${item.id}, '${item.estado}')">
                    ${btnTexto}
                </button>
                <button class="btn-sm btn-delete" onclick="eliminarProducto(${item.id})">
                    Eliminar
                </button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// --- 3. AÑADIR PRODUCTO NUEVO ---
document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value;
    const categoria = document.getElementById('categoria').value;
    const imagen = document.getElementById('imagen').value;
    const desc = document.getElementById('descripcion').value;

    // CORRECCIÓN: Usamos supabaseClient
    const { error } = await supabaseClient
        .from('productos')
        .insert([{
            nombre: nombre,
            precio: precio,
            categoria: categoria,
            imagen_url: imagen,
            descripcion: desc,
            estado: 'disponible'
        }]);

    if (error) {
        alert('Error al guardar: ' + error.message);
    } else {
        alert('¡Producto Agregado!');
        document.getElementById('form-producto').reset();
        cargarAdmin(); 
    }
});

// --- 4. CAMBIAR ESTADO ---
async function toggleEstado(id, estadoActual) {
    const nuevoEstado = estadoActual === 'disponible' ? 'agotado' : 'disponible';

    // CORRECCIÓN: Usamos supabaseClient
    const { error } = await supabaseClient
        .from('productos')
        .update({ estado: nuevoEstado })
        .eq('id', id);

    if (!error) cargarAdmin(); 
}

// --- 5. ELIMINAR PRODUCTO ---
async function eliminarProducto(id) {
    if(!confirm("¿Seguro que quieres eliminar este plato del menú?")) return;

    // CORRECCIÓN: Usamos supabaseClient
    const { error } = await supabaseClient
        .from('productos')
        .update({ activo: false })
        .eq('id', id);

    if (!error) cargarAdmin();
}

cargarAdmin();