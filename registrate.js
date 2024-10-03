//importar firebase
import './firebase.js';
import { auth } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

let formulario_crear = document.getElementById("formulario_crear");

formulario_crear.addEventListener("submit", function (e) {
    e.preventDefault();

    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    //===========CREAR CORREO Y PASSWORD=============
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Colocar que es lo que quieres que haga cuando se crea correctamente
            console.log("Creaste tu email y password");
        })
        .catch((error) => {
            // En caso haya error, se muestra por la consola
            console.log(error.message);
        })

})