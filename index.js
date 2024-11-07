// Importar Firebase y las funciones necesarias
import './firebase.js';
import { auth, db, storage } from './firebase.js';
import { onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { query, orderBy, collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

let nombreUsuario = document.getElementById("displayName");
let publicacionesDiv = document.getElementById("publicaciones"); // Contenedor de publicaciones
let botonPublicar = document.getElementById("publicar"); // Botón para publicar
let nuevaPublicacion = document.getElementById("nueva_publicacion"); // Área de texto para nueva publicación
let fotoPublicacion = document.getElementById("foto_publicacion"); // Input de archivo para subir imagen
let videoPublicacion = document.getElementById("video_publicacion"); // Input de archivo para subir video

let idUsuario = null;

// Variables para el modal de edición
let modalEditar = new bootstrap.Modal(document.getElementById('editarModal')); // Modal de edición
let nuevoTexto = document.getElementById("nuevoTexto"); // Área de texto para editar la publicación
let idActualEdicion = null; // Almacenar el ID de la publicación que se está editando   

// Variables de modal para editar perfil
let nuevoNombre = document.getElementById("nuevoNombre");
let nuevaFoto = document.getElementById("nuevaFoto");
let guardarPerfilBtn = document.getElementById("guardarPerfil");

console.log("hola mundo");

// Escuchar los cambios de autenticación
onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        // Mostrar el nombre del usuario
        nombreUsuario.innerHTML = usuario.displayName || "Usuario";
        idUsuario = usuario.uid; // Almacenar el ID del usuario

        // Recuperar la foto de perfil
        const fotoPerfil = document.getElementById("fotoPerfil");
        fotoPerfil.src = usuario.photoURL || "user.jpg"; // Foto por defecto
    } else {
        window.location.href = "prueba.html";
    }
});

// Publicar nueva publicación con foto y video
botonPublicar.addEventListener("click", async () => {
    if (nuevaPublicacion.value.trim() !== "" || fotoPublicacion.files.length > 0 || videoPublicacion.files.length > 0) {
        try {
            let urlFoto = null; // Inicialmente sin foto
            let urlVideo = null; // Inicialmente sin video

            // Subir foto si existe
            if (fotoPublicacion.files.length > 0) {
                const archivoFoto = fotoPublicacion.files[0];
                const fotoRef = ref(storage, 'fotos_publicaciones/' + archivoFoto.name);
                await uploadBytes(fotoRef, archivoFoto);
                urlFoto = await getDownloadURL(fotoRef);
            }

            // Subir video si existe
            if (videoPublicacion.files.length > 0) {
                const archivoVideo = videoPublicacion.files[0];
                const videoRef = ref(storage, 'videos_publicaciones/' + archivoVideo.name);
                await uploadBytes(videoRef, archivoVideo);
                urlVideo = await getDownloadURL(videoRef);
            }

            // Guardar la publicación con o sin imagen/video en Firestore
            await addDoc(collection(db, "publicaciones"), {
                texto: nuevaPublicacion.value,
                userId: idUsuario,
                userName: auth.currentUser.displayName,
                photoURL: auth.currentUser.photoURL,
                imagenPublicacion: urlFoto,
                videoPublicacion: urlVideo, // URL del video de la publicación (si existe)
                timestamp: new Date()
            });

            // Limpiar campos de publicación
            nuevaPublicacion.value = "";
            fotoPublicacion.value = "";
            videoPublicacion.value = "";

            cargarPublicaciones();
        } catch (error) {
            console.log("Error al publicar: ", error);
        }
    } else {
        console.log("El campo de publicación está vacío.");
    }
});

// Cargar todas las publicaciones, incluyendo imágenes
async function cargarPublicaciones() {
    publicacionesDiv.innerHTML = "";
    const publicacionesQuery = query(collection(db, "publicaciones"), orderBy("timestamp", "desc"));
    const consulta = await getDocs(publicacionesQuery);

    consulta.forEach((doc) => {
        const publicacion = doc.data();
        const publicacionDiv = document.createElement("div");
        publicacionDiv.classList.add("publicacion");

        // Convertir Timestamp a una fecha legible
        const fechaPublicacion = publicacion.timestamp.toDate();
        const horaPublicacion = fechaPublicacion.toLocaleTimeString();
        const fechaFormateada = fechaPublicacion.toLocaleDateString();

        let fotoPerfil = publicacion.photoURL || "perfil.png";
        let contenido = `
            <img src=${fotoPerfil} width="40" heigth="40">
            <p><strong>${publicacion.userName}:</strong> ${publicacion.texto}</p>
            <p>${fechaFormateada} ${horaPublicacion}</p>
        `;

        if (publicacion.imagenPublicacion) {
            contenido += `<img src="${publicacion.imagenPublicacion}" width="200" height="200">`;
        }

        if (publicacion.videoPublicacion) {
            contenido += `<video src="${publicacion.videoPublicacion}" controls type="video/mp4"></video>`;
        }

        if (publicacion.userId === idUsuario) {
            contenido += `
                <button onclick="abrirModal('${doc.id}', '${publicacion.texto}')">Editar</button>
                <button onclick="eliminarPublicacion('${doc.id}')">Eliminar</button>
            `;
        }

        // Sección de comentarios
        contenido += `
         <div class="comentarios" id="comentarios-${doc.id}"></div>
         <textarea id="comentario-${doc.id}" placeholder="Escribe un comentario..."></textarea>
         <button class="btn btn-warning mb-5" onclick="agregarComentario('${doc.id}')">Comentar</button>
        `;

        publicacionDiv.innerHTML = contenido;
        publicacionesDiv.appendChild(publicacionDiv);

        // Cargar los comentarios de esta publicación
        cargarComentarios(doc.id);
    });
}
cargarPublicaciones();

// Función para abrir el modal de edición
window.abrirModal = function (id, texto) {
    console.log("modal");
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

// Actualizar perfil (nombre y foto)
guardarPerfilBtn.addEventListener("click", async () => {
    let user = auth.currentUser; // Usuario autenticado
    let updates = {};
    // Si el nombre ha sido actualizado
    if (nuevoNombre.value.trim() !== "") {
        updates.displayName = nuevoNombre.value;
    }
    // Si se seleccionó una nueva foto
    if (nuevaFoto.files.length > 0) {
        const archivoFoto = nuevaFoto.files[0];
        const fotoRef = ref(storage, 'foto_perfiles/' + user.uid); // Referencia al storage en Firebase
        // Subir la nueva foto de perfil a Firebase Storage
        await uploadBytes(fotoRef, archivoFoto);
        const urlFoto = await getDownloadURL(fotoRef); // Obtener la URL de la foto subida
        updates.photoURL = urlFoto;
    }
    // Aplicar las actualizaciones al perfil del usuario
    await updateProfile(user, updates);
    // Actualizar la interfaz con los nuevos datos
    if (updates.displayName) {
        displayName.textContent = updates.displayName;
    }
    if (updates.photoURL) {
        document.getElementById("fotoPerfil").src = updates.photoURL;
    }
    // Limpiar los campos del formulario
    nuevoNombre.value = "";
    nuevaFoto.value = "";
    // Cerrar el modal
    let actualizarModal = bootstrap.Modal.getInstance(document.getElementById('actualizarModal'));
    actualizarModal.hide();
});

// Botón de cierre de sesión
document.getElementById("logoutButton").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            // cerrar sesión
            window.location.href = "prueba.html";
        })
        .catch((error) => {
            console.log("Error al cerrar sesión: ", error); // Manejar errores en el cierre de sesión
        });
});

// Función para cargar comentarios de una publicación
async function cargarComentarios(publicacionId) {
    const comentariosDiv = document.getElementById(`comentarios-${publicacionId}`);
    comentariosDiv.innerHTML = ""; // Limpiar comentarios previos

    const comentariosQuery = query(collection(db, "publicaciones", publicacionId, "comentarios"), orderBy("timestamp", "asc"));
    const comentariosSnapshot = await getDocs(comentariosQuery);

    comentariosSnapshot.forEach((doc) => {
        const comentario = doc.data();
        const comentarioDiv = document.createElement("div");
        comentarioDiv.classList.add("comentario");
        comentarioDiv.innerHTML = `<strong>${comentario.userName}:</strong> ${comentario.texto}`;
        comentariosDiv.appendChild(comentarioDiv);
    });
}

// Función para agregar un comentario a una publicación
async function agregarComentario(publicacionId) {
    const comentarioInput = document.getElementById(`comentario-${publicacionId}`);
    const textoComentario = comentarioInput.value.trim();

    if (textoComentario !== "") {
        try {
            await addDoc(collection(db, "publicaciones", publicacionId, "comentarios"), {
                texto: textoComentario,
                userId: idUsuario,
                userName: auth.currentUser.displayName,
                timestamp: new Date()
            });

            comentarioInput.value = ""; // Limpiar el campo de comentario
            cargarComentarios(publicacionId); // Recargar los comentarios
        } catch (error) {
            console.log("Error al agregar comentario: ", error);
        }
    }
}

window.agregarComentario = agregarComentario;