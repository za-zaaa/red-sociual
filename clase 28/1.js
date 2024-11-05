function zaza() {
    let jaja = document.getElementById("jejeje").value;
    let mensaje = "";
    let jijiji = document.getElementById("resultado");

    if (isNaN(jaja)) {
        mensaje = "ingrese un numero";

    } else if (jaja > 0) {
        mensaje = "es un numero positivo";
    } else if (jaja < 0) {
        mensaje = "es un numero negativo";
    }else if (jaja == 0){
        mensaje = "escribiste el numero <0"
    }
    jijiji.innerHTML = mensaje
}