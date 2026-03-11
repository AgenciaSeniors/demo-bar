# 🍹 Demo Bar — Sistema de Menú Digital con Panel Admin

**Aplicación web para bares y restaurantes** que combina un menú digital interactivo para clientes con un panel de administración para gestionar productos, precios y disponibilidad en tiempo real.

🌐 **Demo en vivo:** [agenciaseniors.github.io/demo-bar](https://agenciaseniors.github.io/demo-bar/)

---

## 📋 Descripción

Demo Bar es una solución completa para establecimientos de hostelería que necesitan digitalizar su menú y gestionar su carta de forma sencilla. Los clientes acceden a un menú visual atractivo desde cualquier dispositivo, mientras que el propietario controla todo desde un panel de administración protegido por contraseña.

---

## ✨ Características

### 👥 Vista del Cliente (`index.html`)
- Menú visual con imágenes, nombres y precios de productos
- - Filtrado por categorías (cócteles, cervezas, cocteles sin alcohol, etc.)
  - - Diseño responsive y atractivo para móvil y escritorio
    - - Carga de productos en tiempo real desde configuración
     
      - ### 🛠️ Panel de Administración (`admin.html`)
      - - Gestión CRUD completa de productos (crear, editar, eliminar)
        - - Control de disponibilidad por ítem
          - - Actualización de precios en tiempo real
            - - Subida de imágenes de productos
              - - Acceso protegido por autenticación
               
                - ### 🔐 Autenticación (`login.html`)
                - - Sistema de login para acceso al panel admin
                  - - Protección de rutas administrativas
                   
                    - ---

                    ## 🛠️ Stack Tecnológico

                    | Capa | Tecnología |
                    |------|-----------|
                    | Frontend | HTML5 + CSS3 + JavaScript vanilla |
                    | Estilos | CSS personalizado + Modal CSS |
                    | Configuración | `config.js` centralizado |
                    | Despliegue | GitHub Pages |
                    | Persistencia | Configuración en JavaScript |

                    ---

                    ## 📁 Estructura del Proyecto

                    ```
                    demo-bar/
                    ├── img/            ← Imágenes de productos del menú
                    ├── index.html      ← Menú público para clientes
                    ├── admin.html      ← Panel de administración
                    ├── login.html      ← Página de autenticación
                    ├── script.js       ← Lógica del menú cliente
                    ├── admin.js        ← Lógica del panel admin
                    ├── config.js       ← Configuración central (productos, precios)
                    ├── style.css       ← Estilos principales
                    └── modal.css       ← Estilos del modal de productos
                    ```

                    ---

                    ## 🚀 Despliegue

                    El proyecto está desplegado automáticamente en **GitHub Pages**.

                    **Demo en vivo:** [https://agenciaseniors.github.io/demo-bar/](https://agenciaseniors.github.io/demo-bar/)

                    Para ejecutar localmente:
                    ```bash
                    git clone https://github.com/AgenciaSeniors/demo-bar.git
                    cd demo-bar
                    # Abrir index.html en el navegador
                    ```

                    ---

                    ## 📈 Estado del Proyecto

                    - ✅ Menú público en producción
                    - ✅ Panel de administración funcional
                    - ✅ 92+ deployments exitosos en GitHub Pages
                    - - ✅ Diseño responsive
                      - - ✅ Gestión de productos en tiempo real
                       
                        - ---

                        ## 💼 Caso de Uso Real

                        Este proyecto fue desarrollado como **demo comercial** para bares y restaurantes que buscan digitalizar su menú sin necesidad de una app nativa. Demuestra la implementación de un sistema CRUD con interfaz de cliente y panel admin en tecnologías web vanilla.

                        ---

                        ## 👤 Autor

                        **Eduardo Daniel Pérez Ruiz**
                        - 🎓 Estudiante de Ciencias de la Computación
                        - - 📍 Sancti Spíritus, Cuba
                          - - 🏢 Agencia "Señores"
                            - - 📧 agenciaseniors@gmail.com
                              - - 🔗 [GitHub](https://github.com/AgenciaSeniors)
                               
                                - ---

                                ## 📄 Licencia

                                © 2026 Agencia Señores. Todos los derechos reservados.
