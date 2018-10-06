const button = document.querySelector('.btn');
const form   = document.querySelector('.form');
function myFunction() {
  myFunction2();
    var x = document.getElementById("expr");
    var y = document.getElementById("entrada");
    var regExp = new RegExp(x.value);
    var entradas = y.value;
    if (regExp.test(entradas)){
      y.style.color = "white";
        y.style.backgroundColor = "green";
    }
    else {
      y.style.backgroundColor = "red";
      y.style.color = "white";
  }
}
function myFunction2() {
    var x = document.getElementById("expr");
    var y = document.getElementById("entrada2");
    var regExp = new RegExp(x.value);
    var entradas = y.value;
    if (regExp.test(entradas)){
      y.style.color = "white";
        y.style.backgroundColor = "green";
    }
    else {
      y.style.backgroundColor = "red";
      y.style.color = "white";
  }
}