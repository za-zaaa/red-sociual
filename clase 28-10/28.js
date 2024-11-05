function sisas() {
    let nota1 = document.getElementById('nota1').value;
    let nota2 = document.getElementById('nota2').value;
    let nota3 = document.getElementById('nota3').value;
    let mensaje = document.getElementById('mensaje');

    nota1 = parseFloat(nota1);
    nota2= parseFloat(nota2);
    nota3= parseFloat(nota3);

    let promedio = (nota1 + nota2 + nota3) / 3;

    mensaje.innerHTML = `tu promedio es: ${promedio}`;
}