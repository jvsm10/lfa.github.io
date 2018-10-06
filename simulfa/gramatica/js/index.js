var rIndex=0,  //Indice tabela das Derivações
tIndex=0,       // Indice tabela das multiplas entradas
table = document.getElementById("table");
multTabela = document.getElementById("multTabela");
var tabelaGramatica = [];

function selecionar(entrada){
    entrada.select();
}
function tratarExpressao(entrada){
    entrada.value=entrada.value.replace(/[^a-zA-Z0-9]/,"");

}
function tratarTeste(entrada){
    entrada.value=entrada.value.replace(/[^a-z0-9]/,"");

}
function tratarNaoTerminal(entrada){
    entrada.value=entrada.value.toUpperCase().replace(/[^A-Z]/,"");
}

function checkEmptyInput(){ //Entrada deve respeitar a Gramatica Linear a Direita
    var isEmpty = false,
    entrada1 = document.getElementById("entrada1").value,
    entrada2 = document.getElementById("entrada2").value;

    if(entrada1 === ""){
        alert("Não-Terminal nao pode ser vazio");
        isEmpty = true;
        return isEmpty;
    }
    var reg;
   //  if(document.getElementById("gr").checked)
   reg = new RegExp('^(([0-9]|[a-z])*[A-Z]{0,1}([0-9]|[a-z])*)$');
    // }else if(document.getElementById("gld").checked){
    //     reg = new RegExp('^(([0-9]|[a-z])*[A-Z]{0,1})$');
    // }else if(document.getElementById("glud").checked){
    //     reg = new RegExp('^(([0-9]|[a-z]){0,1}[A-Z]{0,1})$');
    // }else if(document.getElementById("gle").checked){
    //     reg = new RegExp('^([A-Z]{0,1}([0-9]|[a-z])*)$');
    // }else if(document.getElementById("glue").checked){
    //     reg = new RegExp('^(([0-9]|[a-z]){0,1}[A-Z]{0,1})$');
    // }
    //var reg = new RegExp('^(([A-Z]{0,1}([0-9]|[a-z])*)|(([0-9]|[a-z])*[A-Z]{0,1}))$');
    if(reg.test(entrada2)){
        isEmpty = false;
    }else{
        isEmpty = true;
    }

    return isEmpty;
}

function addHtmlTableRow(){ //Adicionar nova linha na tabela
    if(!checkEmptyInput()){
        var entr1 = document.getElementById("entrada1").value,
        entr2 = document.getElementById("entrada2").value;

        //var newRow = table.insertRow(table.length);
        //cell1 = newRow.insertCell(0),
        //cell2 = newRow.insertCell(1);
        //cell1.innerHTML = entr1;
        //cell2.innerHTML = entr2;
        $('#table tr:last').after('<tr scope="row"> <td>'+entr1+'</td><td>'+entr2+'</td></tr>');
        selectedRowToInput();
        document.getElementById("entrada1").focus();
        document.getElementById("entrada1").select();

    }
}

function addTabelaGramatica(entrada1, entrada2){ //PASSA TABELA PARA VETOR PARA MANIPULAÇÃO DAS DERIVAÇÕES
    for(var i=0; i<tabelaGramatica.length; i++){
        if(tabelaGramatica[i].naoTerminal == entrada1){
            for (var j = 0; j < tabelaGramatica[i].expressao.length; j++) {
                if(tabelaGramatica[i].expressao[j] == entrada2){
                    return true;
                }
            }
            tabelaGramatica[i].expressao.push(entrada2);
            return false;
        }
    }

    tabelaGramatica.push({
        naoTerminal: entrada1,
        expressao: [entrada2],
        verificar: false,
    });
    return false;
}

//-----------TROCAR
function selectedRowToInput(){ //LINHA SELECIONADA TABELA 1
    for(var i = 0; i < table.rows.length; i++){
        table.rows[i].onclick = function(){
            rIndex = this.rowIndex;
            if(rIndex != 0){
                removerEfeito(table); 
                this.classList.toggle("selecionado"); //APLICAR O EFEITO
                document.getElementById("entrada1").value = this.cells[0].innerHTML;
                document.getElementById("entrada2").value = this.cells[1].innerHTML;
            }
        };
    }
}
//-----------TROCAR
function selectedRowToInput2(){ //LINHA SELECIONADA TABELA 2    
    for(var i = 0; i < multTabela.rows.length; i++){
        multTabela.rows[i].onclick = function(){
            tIndex = this.rowIndex;
            if(tIndex != 0){
                removerEfeito(multTabela);
                this.classList.toggle("selecionado");
                document.getElementById("entrada4").value = this.cells[0].innerHTML;
            };
        }
    }
}
selectedRowToInput2();
selectedRowToInput();
//-----------TROCAR
function removerEfeito(tabela){
    for(var i=1; i<tabela.rows.length;i++){
        tabela.rows[i].classList.remove("selecionado", "correto", "incorreto");
    }
}

function editHtmlTbleSelectedRow(){ //EDITAR ENTRADAS DA TABELA 1
    var entrada1 = document.getElementById("entrada1").value,
    entrada2 = document.getElementById("entrada2").value;
    if(!checkEmptyInput()){
        table.rows[rIndex].cells[0].innerHTML = entrada1;
        table.rows[rIndex].cells[1].innerHTML = entrada2;
    }
}

function removeSelectedRow(){ //REMOVER LINHA DA TABELA 1
    if(rIndex != 0 ){
        table.deleteRow(rIndex);
        document.getElementById("entrada1").value = "";
        document.getElementById("entrada2").value = "";
    }
}


        function grammar(){     //RESOLVE A EXPRESSAO RECURSIVAMENTE
            var entrada = document.getElementById("entrada3");
            tabelaGramatica = [];
            for(var i =1; i<table.rows.length; i++){
                table.rows[i].classList.remove('selecionado'); 
                if(addTabelaGramatica(table.rows[i].cells[0].innerHTML, table.rows[i].cells[1].innerHTML)){
                    table.deleteRow(i);
                }
            }
            var exp;
            if(resolver(table.rows[1].cells[0].innerHTML, table.rows[1].cells[0].innerHTML, entrada.value)){
                entrada.style.color="white";
                entrada.style.backgroundColor = "green";
            }else{
                entrada.style.color="white";
                entrada.style.backgroundColor = "red";
            } 
        }

        //-----------TROCAR
        function resolver(exp, naoTerminal, entrada, expAnt){

            var tam = tabelaGramatica.length;
            if(exp == entrada && naoTerminal == "-0") return true;
            
            if(exp.length > entrada.length+1 )  return false;
            for (var i = 0; i < tam; i++) {

                if(tabelaGramatica[i].naoTerminal == naoTerminal){
                    for(var j = 0; j<tabelaGramatica[i].expressao.length; j++){
                        var der = tabelaGramatica[i].expressao[j];
                        var naoTerminalDer = verificarDerivacao(der);
                        var novoexp = exp.replace(naoTerminal, der);
                        console.log(novoexp + " | " + expAnt);
                        if(!verificarRecursao(novoexp, entrada)) continue; 
                        if(expAnt == novoexp) continue;
                        if(resolver(novoexp, naoTerminalDer[0], entrada, exp)){
                            return true;    
                        }
                        
                    }
                }
            }
            return false;
        }
//-----------TROCAR
        function verificarRecursao(exp,entrada){
            var naoTerminalDer = verificarDerivacao(exp);
            var teste = exp.substring(0,naoTerminalDer[1]);
            var teste2 = exp.substring(naoTerminalDer[1]+1, exp.length);
            console.log("Teste 1 = "+teste + "|Teste 2 = " +teste2+ "| tamanho = "+exp.length);

            if(teste =="" && teste2 !=""){
                if(entrada.endsWith(teste2)) return true;
            }else if(teste !="" && teste2 ==""){
                if(entrada.startsWith(teste)) return true;
            }else if(teste !="" && teste2 !=""){
                if(entrada.startsWith(teste) || entrada.endsWith(teste2))return true;
            }else if(teste =="" && teste2 =="") return true;    
            return false;
        }
        //-----------TROCAR
        function verificarDerivacao(der){ //NAO TERMINAL SEMPRE MAISCULO
            var tam = der.length;
            for(i=0; i<tam; i++){
                if(der.charCodeAt(i)>=65 && der.charCodeAt(i)<=90){
                    return [der.charAt(i),i];
                }
            }
            return ["-0",-1];
        }

        function verificarEntradaTeste(entrada){ //VERIFICAR SE ENTRADA JA FOI INSERIDA

            for(var i=1; i<multTabela.rows.length ; i++){
                if(multTabela.rows[i].cells[0].innerHTML == entrada){
                    return false;
                }
            }
            return true;
        }

        function addTestes(){ //ADD A TABELA 2

            var entrada1 = document.getElementById("entrada4").value;
            if(verificarEntradaTeste(entrada1)){
                var newRow = multTabela.insertRow(table.length);
                cell1 = newRow.insertCell(0),
                cell1.innerHTML = entrada1;
                selectedRowToInput2();
                document.getElementById("entrada4").focus();
                document.getElementById("entrada4").select();

            }
        }



        function editTestes(){
            var entrada1 = document.getElementById("entrada4").value;
            if(tIndex != 0 ){
                multTabela.rows[tIndex].cells[0].innerHTML = entrada1;
            }
        }

        function removeTeste(){
            if(tIndex != 0 ){
                multTabela.deleteRow(tIndex);
                document.getElementById("entrada4").value = "";
            }
        }


        function grammar2(){
            for(z=1; z<multTabela.rows.length; z++){
                var teste =  multTabela.rows[z].cells[0].innerHTML;
                tabelaGramatica = [];
                for(var i = 1; i<table.rows.length; i++){
                    if(addTabelaGramatica(table.rows[i].cells[0].innerHTML, table.rows[i].cells[1].innerHTML)){
                        table.deleteRow(i);
                    }
                }
                multTabela.rows[z].classList.remove("correto", "incorreto", "selecionado");
                if(resolver(table.rows[1].cells[0].innerHTML, table.rows[1].cells[0].innerHTML, teste)){
                    multTabela.rows[z].classList.toggle("correto");
                }else{
                    multTabela.rows[z].classList.toggle("incorreto");
                }
            }
        }




/*--------------------------------------------------------------------------------------------*/


 function openCity(evt, cityName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

document.getElementById("defaultOpen").click();


