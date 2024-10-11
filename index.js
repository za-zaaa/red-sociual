// Importar Firebase y las funciones necesarias
import './firebase.js';
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// Obtener elementos del DOM
let nombreUsuario = document.getElementById("displayName"); // Nombre del usuario
let publicacionesDiv = document.getElementById("publicaciones"); // Contenedor de publicaciones
let botonPublicar = document.getElementById("publicar"); // Botón para publicar
let nuevaPublicacion = document.getElementById("nueva_publicacion"); // Área de texto para nueva publicación
let idUsuario = null; // Almacenar el ID del usuario autenticado

// Variables para el modal de edición
let modalEditar = new bootstrap.Modal(document.getElementById('editarModal')); // Modal de edición
let nuevoTexto = document.getElementById("nuevoTexto"); // Área de texto para editar la publicación
let idActualEdicion = null; // Almacenar el ID de la publicación que se está editando

// Escuchar los cambios de autenticación
onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        // Mostrar el nombre del usuario
        nombreUsuario.textContent = usuario.displayName || "Usuario";
        idUsuario = usuario.uid; // Almacenar el ID del usuario

        // Recuperar la foto de perfil
        const fotoPerfil = document.getElementById("fotoPerfil");
        fotoPerfil.src = usuario.photoURL || "perfil.jpeg"; // Foto por defecto

        cargarPublicaciones(); // Cargar publicaciones al iniciar sesión
    } else {
        window.location.href = "login.html"; // Redirigir a la página de inicio de sesión si no está autenticado
    }
});

// Publicar nueva publicación
botonPublicar.addEventListener("click", async () => {
    if (nuevaPublicacion.value.trim() !== "") { // Verificar que el campo no esté vacío
        try {
            await addDoc(collection(db, "publicaciones"), {
                texto: nuevaPublicacion.value, // Texto de la publicación
                userId: idUsuario, // ID del usuario que publica
                userName: auth.currentUser.displayName, // Nombre del usuario que publica
                timestamp: new Date() // Fecha y hora de la publicación
            });
            nuevaPublicacion.value = "";  // Limpiar el área de texto
            cargarPublicaciones(); // Recargar publicaciones
        } catch (error) {
            console.log("Error al publicar: ", error); // Manejar errores al publicar
        }
    } else {
        console.log("El campo de publicación está vacío."); // Mensaje si el campo está vacío
    }
});

// Cargar todas las publicaciones
async function cargarPublicaciones() {
    publicacionesDiv.innerHTML = ""; // Limpiar publicaciones previas
    const consultaSnapshot = await getDocs(collection(db, "publicaciones")); // Obtener todas las publicaciones
    consultaSnapshot.forEach((doc) => {
        const publicacion = doc.data(); // Datos de la publicación
        const publicacionDiv = document.createElement("div"); // Crear un nuevo div para la publicación
        publicacionDiv.classList.add("publicacion"); // Agregar clase a la publicación

        // Contenido de la publicación
        let contenido = `
            <p><strong>${publicacion.userName}:</strong> ${publicacion.texto}</p>
        `;

        // Mostrar botones solo si es el autor de la publicación
        if (publicacion.userId === idUsuario) {
            contenido += `
                <button class="btn btn-warning" onclick="abrirModal('${doc.id}', '${publicacion.texto}')">Editar</button>
                <button class="btn btn-danger" onclick="eliminarPublicacion('${doc.id}')">Eliminar</button>
            `;
        }

        publicacionDiv.innerHTML = contenido; // Asignar contenido al div
        publicacionesDiv.appendChild(publicacionDiv); // Agregar la publicación al contenedor
    });
}

// Función para abrir el modal de edición
window.abrirModal = function (id, texto) {
    idActualEdicion = id; // Almacenar el ID de la publicación que se va a editar
    nuevoTexto.value = texto; // Colocar el texto actual en el área de texto del modal
    modalEditar.show(); // Mostrar el modal
};

// Guardar cambios en la publicación editada
document.getElementById("guardarCambios").addEventListener("click", async () => {
    if (nuevoTexto.value.trim() !== "") { // Verificar que el campo no esté vacío
        try {
            await updateDoc(doc(db, "publicaciones", idActualEdicion), {
                texto: nuevoTexto.value // Actualizar el texto de la publicación
            });
            modalEditar.hide(); // Ocultar el modal
            cargarPublicaciones(); // Recargar publicaciones
        } catch (error) {
            console.log("Error al editar publicación: ", error); // Manejar errores al editar
        }
    }
});

// Función para eliminar publicación
window.eliminarPublicacion = async function (id) {
    try {
        await deleteDoc(doc(db, "publicaciones", id)); // Eliminar la publicación
        cargarPublicaciones(); // Recargar publicaciones
    } catch (error) {
        console.log("Error al eliminar publicación: ", error); // Manejar errores al eliminar
    }
};
