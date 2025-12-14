// admin.js

// 1. VERIFICACIÓN DE SEGURIDAD
async function checkAuth() {
    if (typeof supabaseClient === 'undefined') { 
        console.error("Supabase no está definido. Revisa config.js"); 
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

// 2. CARGAR INVENTARIO (Con carteles Verde/Rojo correctos)
async function cargarAdmin() {
    const lista = document.getElementById('lista-admin');
    if (lista) lista.innerHTML = '<div style="text-align:center; padding:40px; color:#aaa;">⟳ Cargando inventario...</div>';

    // Traemos los productos activos (activo = true significa que NO está en la papelera)
    let { data: productos, error } = await supabaseClient
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('id', { ascending: false });

    if (error) { 
        alert("Error al cargar: " + error.message); 
        return; 
    }
    
    if (!productos || productos.length === 0) {
        if (lista) lista.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">El inventario está vacío.<br><small>Añade tu primer producto arriba.</small></p>';
        return;
    }

    const html = productos.map(item => {
        // Lógica: Si estado es 'agotado', mostramos cartel ROJO. Si no, VERDE.
        const esAgotado = item.estado === 'agotado';
        
        const statusText = esAgotado ? 'AGOTADO' : 'DISPONIBLE';
        const statusClass = esAgotado ? 'status-bad' : 'status-ok'; // Estilos definidos en style.css
        
        // Icono del botón: toggle_off si está agotado, toggle_on si está disponible
        const iconState = esAgotado ? 'toggle_off' : 'toggle_on';
        const colorStateBtn = esAgotado ? '#666' : 'var(--green-success)';

        const favColor = item.destacado ? 'var(--gold)' : '#444';
        const img = item.imagen_url || 'https://via.placeholder.com/60';

        return `
            <div class="inventory-item">
                <img src="${img}" class="item-thumb" alt="Imagen del producto">
                
                <div class="item-meta">
                    <span class="item-title">
                        ${item.nombre} ${item.destacado ? '🌟' : ''}
                    </span>
                    <span class="item-price">$${item.precio}</span>
                    
                    <span class="item-status ${statusClass}">${statusText}</span>
                </div>

                <div class="action-btn-group">
                    <button class="icon-btn" style="color:${favColor}" onclick="toggleDestacado(${item.id}, ${item.destacado})" title="Destacar en carta">
                        <span class="material-icons">star</span>
                    </button>

                    <button class="icon-btn" style="color:${colorStateBtn}" onclick="toggleEstado(${item.id}, '${item.estado}')" title="Cambiar Disponibilidad">
                        <span class="material-icons">${iconState}</span>
                    </button>

                    <button class="icon-btn btn-del" onclick="eliminarProducto(${item.id})" title="Eliminar del sistema">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (lista) lista.innerHTML = html;
}

// 3. GENERAR CURIOSIDAD CON IA (Gemini)
async function generarCuriosidad() {
    const nombre = document.getElementById('nombre').value;
    const campo = document.getElementById('curiosidad');
    const loader = document.getElementById('loader-ia');
    const btn = document.getElementById('btn-ia');

    if (!nombre) { alert("Por favor escribe el nombre del producto primero."); return; }

    // UI Loading
    btn.disabled = true; 
    loader.style.display = "inline-block"; 
    campo.value = "Generando...";

    const API_KEY = CONFIG.GEMINI_KEY; 
    // Usamos el modelo Flash por ser más rápido y estable
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${API_KEY}`;
    const prompt = `Escribe un dato curioso muy breve (máximo 20 palabras) y divertido sobre: "${nombre}". Tono gastronómico.`;

    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        
        if (data.candidates && data.candidates[0].content) {
            campo.value = data.candidates[0].content.parts[0].text;
        } else {
            campo.value = "No se pudo generar el dato.";
        }
    } catch (e) {
        console.error(e);
        campo.value = "Error de conexión con la IA.";
    } finally {
        loader.style.display = "none"; 
        btn.disabled = false;
    }
}

// 4. GUARDAR NUEVO PRODUCTO
const form = document.getElementById('form-producto');
if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const textoOriginal = btn.textContent;
        
        btn.textContent = "Subiendo..."; 
        btn.disabled = true;

        try {
            const nombre = document.getElementById('nombre').value;
            const precio = document.getElementById('precio').value;
            const categoria = document.getElementById('categoria').value;
            const descripcion = document.getElementById('descripcion').value;
            const curiosidad = document.getElementById('curiosidad').value;
            const destacado = document.getElementById('destacado').checked;
            const fileInput = document.getElementById('imagen-file');

            // Validación de imagen
            if (fileInput.files.length === 0) throw new Error("Debes seleccionar una imagen.");
            const archivo = fileInput.files[0];
            
            // Crear nombre único para la imagen
            const extension = archivo.name.split('.').pop();
            const nombreArchivo = `prod_${Date.now()}.${extension}`;

            // 1. Subir imagen a Supabase Storage
            const { error: upErr } = await supabaseClient.storage
                .from('imagenes')
                .upload(nombreArchivo, archivo);
            
            if (upErr) throw upErr;

            // 2. Obtener URL pública
            const { data: urlData } = supabaseClient.storage
                .from('imagenes')
                .getPublicUrl(nombreArchivo);

            // 3. Guardar datos en la tabla 'productos'
            const { error: dbErr } = await supabaseClient.from('productos').insert([{
                nombre, 
                precio, 
                categoria, 
                descripcion, 
                curiosidad, 
                destacado,
                imagen_url: urlData.publicUrl, 
                estado: 'disponible', // Por defecto disponible
                activo: true          // Por defecto visible en el sistema
            }]);

            if (dbErr) throw dbErr;
            
            alert("¡Producto guardado exitosamente!");
            form.reset();
            cargarAdmin(); // Recargar la lista

        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            btn.textContent = textoOriginal; 
            btn.disabled = false;
        }
    });
}

// 5. ACCIONES DE BOTONES (Switch, Estrella, Borrar)

// Cambiar Destacado
async function toggleDestacado(id, valorActual) {
    await supabaseClient.from('productos').update({ destacado: !valorActual }).eq('id', id);
    cargarAdmin();
}

// Cambiar Disponibilidad (Disponible <-> Agotado)
async function toggleEstado(id, estadoActual) {
    // Si dice 'disponible', lo cambiamos a 'agotado', y viceversa
    const nuevoEstado = estadoActual === 'disponible' ? 'agotado' : 'disponible';
    
    const { error } = await supabaseClient
        .from('productos')
        .update({ estado: nuevoEstado })
        .eq('id', id);

    if(error) alert("Error al actualizar estado: " + error.message);
    else cargarAdmin();
}

// Eliminar (Borrado lógico - Papelera)
async function eliminarProducto(id) {
    if(confirm("¿Estás seguro de eliminar este producto? Desaparecerá del inventario.")) {
        // No borramos la fila, solo ponemos activo=false
        await supabaseClient.from('productos').update({ activo: false }).eq('id', id);
        cargarAdmin();
    }
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', checkAuth);