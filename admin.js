// --- SEGURIDAD SIMPLE ---
const CLAVE_SECRETA = "1234"; 

const entrada = prompt("🔒 Área restringida. Ingresa la contraseña de Administrador:");
if (entrada !== CLAVE_SECRETA) {
    alert("⛔ Contraseña incorrecta.");
    window.location.href = "index.html"; 
}

// --- CONFIGURACIÓN ---
const SUPABASE_URL = 'https://qspwtmfmolvqlzsbwlzv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ba5r8nJ5o49w1b9TURDLBA_EbMC_lWU';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CARGAR LISTA ---
async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    lista.innerHTML = 'Actualizando...';

    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: false });

    if (error) { alert('Error: ' + error.message); return; }

    lista.innerHTML = '';
    productos.forEach(item => {
        const esAgotado = item.estado === 'agotado';
        const estadoBadge = esAgotado 
            ? '<span class="status-text status-agotado">AGOTADO</span>' 
            : '<span class="status-text status-disponible">DISPONIBLE</span>';
        
        const btnTexto = esAgotado ? 'Activar' : 'Agotar';

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
                <button class="btn-sm btn-toggle" onclick="toggleEstado(${item.id}, '${item.estado}')">${btnTexto}</button>
                <button class="btn-sm btn-delete" onclick="eliminarProducto(${item.id})">Borrar</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// --- SUBIR PRODUCTO CON FOTO ---
document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.textContent = "Subiendo foto...";
    btn.disabled = true;

    try {
        const nombre = document.getElementById('nombre').value;
        const precio = document.getElementById('precio').value;
        const categoria = document.getElementById('categoria').value;
        const desc = document.getElementById('descripcion').value;
        const fileInput = document.getElementById('imagen-file');

        if (fileInput.files.length === 0) throw new Error("Debes seleccionar una imagen");
        
        const archivo = fileInput.files[0];
        // Crear nombre único: fecha + nombre original limpio
        const nombreArchivo = Date.now() + '_' + archivo.name.replace(/\s/g, '');

        // 1. Subir a Supabase Storage
        const { error: uploadError } = await supabaseClient
            .storage
            .from('imagenes')
            .upload(nombreArchivo, archivo);

        if (uploadError) throw uploadError;

        // 2. Obtener URL pública
        const { data: urlData } = supabaseClient
            .storage
            .from('imagenes')
            .getPublicUrl(nombreArchivo);

        // 3. Guardar en Base de Datos
        const { error: dbError } = await supabaseClient
            .from('productos')
            .insert([{
                nombre: nombre,
                precio: precio,
                categoria: categoria,
                imagen_url: urlData.publicUrl,
                descripcion: desc,
                estado: 'disponible'
            }]);

        if (dbError) throw dbError;

        alert("¡Producto guardado exitosamente!");
        document.getElementById('form-producto').reset();
        cargarAdmin();

    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
    } finally {
        btn.textContent = "GUARDAR EN EL MENÚ";
        btn.disabled = false;
    }
});

// --- ACCIONES ---
async function toggleEstado(id, estadoActual) {
    const nuevo = estadoActual === 'disponible' ? 'agotado' : 'disponible';
    await supabaseClient.from('productos').update({ estado: nuevo }).eq('id', id);
    cargarAdmin();
}

async function eliminarProducto(id) {
    if(!confirm("¿Eliminar del menú?")) return;
    await supabaseClient.from('productos').update({ activo: false }).eq('id', id);
    cargarAdmin();
}

// Iniciar
cargarAdmin();