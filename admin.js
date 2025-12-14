// (Configuración viene de config.js)

// 1. SEGURIDAD
async function checkAuth() {
    // Verificamos si config.js cargó bien
    if (typeof supabaseClient === 'undefined') {
        alert("Error crítico: config.js no cargó.");
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
    } else {
        cargarAdmin();
    }
}

async function cerrarSesion() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
}

// 2. CARGAR INVENTARIO (DISEÑO DE ICONOS)
async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    if (lista) lista.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">⟳ Cargando inventario...</div>';

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
        const favColor = item.destacado ? 'var(--gold)' : '#444'; // Estrella dorada o gris
        const img = item.imagen_url || 'https://via.placeholder.com/60';

        return `
            <div class="inventory-item">
                <img src="${img}" class="item-thumb" alt="img">
                
                <div class="item-meta">
                    <div class="item-title">
                        ${item.nombre} 
                        ${item.destacado ? '<span style="color:var(--gold); font-size:0.8rem;">★</span>' : ''}
                    </div>
                    <div class="item-price">$${item.precio}</div>
                    <span class="item-status ${statusClass}">${statusText}</span>
                </div>

                <div class="action-btn-group">
                    <button class="icon-btn" style="color:${favColor};" onclick="toggleDestacado(${item.id}, ${item.destacado})" title="Destacar">
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

    if (lista) lista.innerHTML = html || '<p style="text-align:center;">Inventario vacío.</p>';
}

// 3. IA GEMINI (CORREGIDA: USANDO MODELO ESPECÍFICO)
async function generarCuriosidad() {
    const nombre = document.getElementById('nombre').value;
    const campo = document.getElementById('curiosidad');
    const loader = document.getElementById('loader-ia');
    const btn = document.getElementById('btn-ia');

    if (!nombre) { alert("Escribe el nombre del producto primero."); return; }

    btn.disabled = true; loader.style.display = "inline-block"; campo.value = "";

    // TU CLAVE ESTÁ EN CONFIG.JS
    const API_KEY = CONFIG.GEMINI_KEY; 
    
    // CORRECCIÓN: Usamos 'gemini-1.5-flash-001' que es la versión exacta
    // Si esta falla, Google intentará usar la más cercana disponible.
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${API_KEY}`;

    const prompt = `Escribe un dato curioso histórico, científico o cultural breve (máximo 25 palabras) sobre: "${nombre}". Tono interesante. Sin introducciones.`;

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await res.json();

        // Manejo de errores específicos de Google
        if (data.error) {
            console.error("Error de Google:", data.error);
            // Si el modelo 001 falla, intentamos con 'gemini-pro' como respaldo final
            if(data.error.code === 404) {
                alert("Modelo no encontrado. Intentando con modelo alternativo...");
                return generarCuriosidadLegacy(nombre);
            }
            throw new Error(data.error.message);
        }
        
        if (data.candidates && data.candidates.length > 0) {
            campo.value = data.candidates[0].content.parts[0].text.trim();
        } else {
            campo.value = "No se pudo generar. Intenta de nuevo.";
        }

    } catch (e) {
        console.error("Error de conexión:", e);
        campo.value = "Error al conectar con la IA. Verifica tu conexión.";
        alert("Detalle del error: " + e.message);
    } finally {
        loader.style.display = "none"; btn.disabled = false;
    }
}

// FUNCION DE RESPALDO (Por si falla la principal)
async function generarCuriosidadLegacy(nombre) {
    const API_KEY = CONFIG.GEMINI_KEY;
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    const prompt = `Dato curioso corto sobre ${nombre}`;
    
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        if (data.candidates) {
            document.getElementById('curiosidad').value = data.candidates[0].content.parts[0].text;
        } else {
            alert("No se pudo generar con ningún modelo. Revisa tu API Key.");
        }
    } catch(e) { console.error(e); }
    document.getElementById('loader-ia').style.display = "none";
    document.getElementById('btn-ia').disabled = false;
}

// 4. GUARDAR PRODUCTO
const form = document.getElementById('form-producto');
if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
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

            if (fileInput.files.length === 0) throw new Error("Falta la imagen");
            const archivo = fileInput.files[0];
            const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;

            // Subir imagen
            const { error: upErr } = await supabaseClient.storage.from('imagenes').upload(nombreArchivo, archivo);
            if (upErr) throw upErr;

            // Obtener URL
            const { data: urlData } = supabaseClient.storage.from('imagenes').getPublicUrl(nombreArchivo);

            // Guardar en BD
            const { error: dbErr } = await supabaseClient.from('productos').insert([{
                nombre, precio, categoria, descripcion, curiosidad, destacado,
                imagen_url: urlData.publicUrl, estado: 'disponible', activo: true
            }]);

            if (dbErr) throw dbErr;
            
            alert("¡Producto Guardado!");
            form.reset();
            cargarAdmin();

        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            btn.textContent = originalText; btn.disabled = false;
        }
    });
}

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
    if(confirm("¿Eliminar?")) {
        await supabaseClient.from('productos').update({ activo: false }).eq('id', id);
        cargarAdmin();
    }
}

document.addEventListener('DOMContentLoaded', checkAuth);