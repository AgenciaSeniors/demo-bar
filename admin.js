// 1. VERIFICACIÓN DE SEGURIDAD (Supabase Auth)
// Si no hay usuario logueado, lo mandamos al login.html
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
    } else {
        // Solo cargamos el admin si hay sesión
        cargarAdmin();
    }
}

async function cerrarSesion() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
}

// 2. CARGAR LISTA
async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    lista.innerHTML = '<p style="text-align:center; color:#666;">Cargando...</p>';

    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: false });

    if (error) { alert("Error: " + error.message); return; }
    
    // Renderizado optimizado
    const html = productos.map(item => {
        const esAgotado = item.estado === 'agotado';
        const badgeColor = esAgotado ? 'red' : 'green';
        const badgeText = esAgotado ? 'AGOTADO' : 'DISPONIBLE';
        const favClass = item.destacado ? 'is-fav' : '';
        const img = item.imagen_url || 'https://via.placeholder.com/50';

        return `
            <div class="admin-item">
                <img src="${img}" alt="img">
                <div style="flex-grow:1;">
                    <div style="font-weight:bold; color:white;">${item.nombre}</div>
                    <div style="font-size:0.8rem; color:#888;">$${item.precio} <span style="color:${badgeColor}; margin-left:5px;">● ${badgeText}</span></div>
                </div>
                <div class="item-actions">
                    <button class="btn-sm btn-star ${favClass}" onclick="toggleDestacado(${item.id}, ${item.destacado})">★</button>
                    <button class="btn-sm btn-toggle" onclick="toggleEstado(${item.id}, '${item.estado}')">I/O</button>
                    <button class="btn-sm btn-delete" onclick="eliminarProducto(${item.id})">X</button>
                </div>
            </div>
        `;
    }).join('');

    lista.innerHTML = html;
}

// 3. IA GEMINI (ACTUALIZADA)
async function generarCuriosidad() {
    const nombre = document.getElementById('nombre').value;
    const campo = document.getElementById('curiosidad');
    const loader = document.getElementById('loader-ia');
    const btn = document.getElementById('btn-ia');

    if (!nombre) { alert("Escribe el nombre del producto primero."); return; }

    btn.disabled = true; loader.style.display = "block"; campo.value = "";

    // Usamos la clave desde config.js
    const API_KEY = CONFIG.GEMINI_KEY; 
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    const prompt = `Escribe un dato curioso histórico, científico o cultural breve (máximo 25 palabras) sobre: "${nombre}". Tono interesante. Sin introducciones.`;

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        
        if (data.candidates && data.candidates.length > 0) {
            campo.value = data.candidates[0].content.parts[0].text;
        } else {
            campo.value = "No se pudo generar un dato.";
        }
    } catch (e) {
        console.error(e);
        alert("Error IA. Verifica la consola.");
    } finally {
        loader.style.display = "none"; btn.disabled = false;
    }
}

// 4. GUARDAR PRODUCTO (Subida + Inserción)
document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = "Guardando..."; btn.disabled = true;

    try {
        const nombre = document.getElementById('nombre').value;
        const precio = document.getElementById('precio').value;
        const categoria = document.getElementById('categoria').value;
        const desc = document.getElementById('descripcion').value;
        const curiosidad = document.getElementById('curiosidad').value;
        const destacado = document.getElementById('destacado').checked;
        const fileInput = document.getElementById('imagen-file');

        if (fileInput.files.length === 0) throw new Error("Debes seleccionar una imagen");
        
        // 1. Subir Imagen (Nombre único)
        const archivo = fileInput.files[0];
        const ext = archivo.name.split('.').pop();
        const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;

        const { error: upErr } = await supabaseClient.storage.from('imagenes').upload(nombreArchivo, archivo);
        if (upErr) throw upErr;

        // 2. Obtener URL
        const { data: urlData } = supabaseClient.storage.from('imagenes').getPublicUrl(nombreArchivo);

        // 3. Insertar en BD
        const { error: dbErr } = await supabaseClient.from('productos').insert([{
            nombre, precio, categoria, descripcion, curiosidad, destacado,
            imagen_url: urlData.publicUrl, estado: 'disponible', activo: true
        }]);

        if (dbErr) throw dbErr;
        
        alert("¡Producto creado con éxito!");
        document.getElementById('form-producto').reset();
        cargarAdmin();

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.textContent = originalText; btn.disabled = false;
    }
});

// 5. ACCIONES
async function toggleDestacado(id, val) {
    await supabaseClient.from('productos').update({ destacado: !val }).eq('id', id);
    cargarAdmin();
}
async function toggleEstado(id, estado) {
    const nuevo = estado === 'disponible' ? 'agotado' : 'disponible';
    await supabaseClient.from('productos').update({ estado: nuevo }).eq('id', id);
    cargarAdmin();
}
async function eliminarProducto(id) {
    if(confirm("¿Seguro que quieres eliminar este producto?")) {
        await supabaseClient.from('productos').update({ activo: false }).eq('id', id);
        cargarAdmin();
    }
}

// Iniciar comprobación de seguridad
document.addEventListener('DOMContentLoaded', checkAuth);