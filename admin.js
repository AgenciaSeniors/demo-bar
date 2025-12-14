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

// 2. CARGAR LISTA (DISEÑO ACTUALIZADO)
async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    // Loader simple
    lista.innerHTML = '<div style="text-align:center; padding:40px;"><span style="color:var(--gold);">⟳ Cargando...</span></div>';

    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: false });

    if (error) { alert("Error: " + error.message); return; }
    
    const html = productos.map(item => {
        const esAgotado = item.estado === 'agotado';
        const statusClass = esAgotado ? 'status-bad' : 'status-ok';
        const statusText = esAgotado ? 'AGOTADO' : 'ACTIVO';
        const favColor = item.destacado ? 'var(--gold)' : '#444';
        const img = item.imagen_url || 'https://via.placeholder.com/60';

        return `
            <div class="inventory-item">
                <img src="${img}" class="item-thumb" alt="img">
                <div class="item-meta">
                    <div class="item-title">${item.nombre} ${item.destacado ? '🌟' : ''}</div>
                    <div class="item-price">$${item.precio}</div>
                    <span class="item-status ${statusClass}">${statusText}</span>
                </div>
                <div class="action-btn-group">
                    <button class="icon-btn" style="color:${favColor}; background:#222;" onclick="toggleDestacado(${item.id}, ${item.destacado})" title="Destacar">
                        <span class="material-icons">star</span>
                    </button>
                    <button class="icon-btn btn-edit" onclick="toggleEstado(${item.id}, '${item.estado}')" title="Cambiar Estado">
                        <span class="material-icons">power_settings_new</span>
                    </button>
                    <button class="icon-btn btn-del" onclick="eliminarProducto(${item.id})" title="Eliminar">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    lista.innerHTML = html || '<p style="text-align:center; color:#666">No hay productos aún.</p>';
}

// 3. IA GEMINI (CORREGIDO A MODELO ESTABLE)
async function generarCuriosidad() {
    const nombre = document.getElementById('nombre').value;
    const campo = document.getElementById('curiosidad');
    const loader = document.getElementById('loader-ia');
    const btn = document.getElementById('btn-ia');

    if (!nombre) { alert("Escribe el nombre del producto primero."); return; }

    btn.disabled = true; loader.style.display = "block"; campo.value = "";

    // Usamos la clave desde config.js
    const API_KEY = CONFIG.GEMINI_KEY; 
    
    // CORRECCIÓN: Usamos 'gemini-pro' que es el modelo más estable actualmente
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    const prompt = `Escribe un dato curioso histórico, científico o cultural breve (máximo 25 palabras) sobre: "${nombre}". Tono interesante. Sin introducciones.`;

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);

        const data = await res.json();
        
        if (data.candidates && data.candidates.length > 0) {
            campo.value = data.candidates[0].content.parts[0].text;
        } else {
            campo.value = "No se pudo generar un dato.";
        }
    } catch (e) {
        console.error("Error detallado:", e);
        alert("Hubo un problema conectando con la IA. Intenta de nuevo.");
        campo.value = "Error al generar.";
    } finally {
        loader.style.display = "none"; btn.disabled = false;
    }
}
        const data = await response.json();

        // Verificamos si Google nos dio un error
        if (data.error) {
            throw new Error(data.error.message);
        }

        // Extraemos el texto de forma segura
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            campo.value = data.candidates[0].content.parts[0].text.trim();
        } else {
            campo.value = "No se encontró un dato curioso. Intenta de nuevo.";
        }

    } catch (error) {
        console.error("Error detallado de IA:", error);
        alert("Ocurrió un error al consultar la IA. Revisa la consola (F12) para ver el detalle.");
        campo.value = "Error de conexión con IA.";
    } finally {
        // Restaurar estado
        loader.style.display = "none"; 
        btn.disabled = false;
        btn.textContent = "✨ Generar";
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