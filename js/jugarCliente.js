var ip = network.getMyIp();
console.log(ip);
var portmulticast = global.infoGame.portmulticast;
var portTCP = global.infoGame.tcp;
var upd = global.infoGame.udp;
var jugadores = new Array(new Object);
var puntaje = new Array(new Object);
var gameID;
var ofertaCarta;
hearMulticast(portmulticast);
var clientUDP = network.clientUDP(global.infoGame.udp);
var clientTCP;
var template = _.template($('#room-template').html());
var rooms = [];
var confirm = false;
var suma=0;
var fs = require('fs');
fsmonitor = require('fsmonitor');
var dir = './shareClient';
var buffernew;
var buff;
require('buffer').Buffer;


if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
//*************************Eventos de Archivos y Carpetas*********************************
fsmonitor.watch('./shareClient', null, function(change) {
   
    //console.log("Change detected:\n" + change);
    var band;  
    if(change.addedFiles[0]!=null){
        console.log("Added files:    ", change.addedFiles);
        str=change.addedFiles[0];
        band=4;
        sendFile(str,band);

    }
    if(change.modifiedFiles[0]!=null){
    console.log("Modified files: ", change.modifiedFiles);
    str=change.modifiedFiles[0];
        band=5;
        sendFile(str,band);
    }
    if(change.removedFiles[0]!=null){
        console.log("Removed files:  ", change.removedFiles);
    }
    if(change.addedFolders[0]!=null){
        console.log("Added folders:    ", change.addedFolders);
    }
    if(change.modifiedFolders[0]!=null){
        console.log("Modified folders: ", change.modifiedFolders);
    }
    if(change.removedFolders[0]!=null){
        console.log("Removed folders:  ", change.removedFolders);
    }    
});

var monitor = fsmonitor.watch('.', {
    // include files
    matches: function(relpath) {
        return relpath.match(/\.js$/i) !== null;
    },
    // exclude directories
    excludes: function(relpath) {
        return relpath.match(/^\.git$/i) !== null;
    }
});
function sendFile(str, cod_file){
        var file;
        var stats;
        var myVar;
        console.log(str);
        
        file = fs.readFile(dir+'/'+str,'utf8', function(err,data){
            buffernew= new Buffer(data.length);
            buffernew.write(data);
            console.log(buffernew.toString('utf8'));
            fs.writeFile('./tmp/'+str,buffernew);

            var data = {
            'codigo': cod_file,
            'nombre':str
            };
            clientTCP.write(JSON.stringify(data));
        
            function time(){
                myVar= setTimeout(enviar,2000);
            }
            function enviar(){
                console.log('enviar');
                var dataFile = {
                'file': buffernew
                };
                clientTCP.write(JSON.stringify(dataFile));
            }
            time();
        });
        //sendMulticast(data); */
}
//****************************     UNIRSE  ******************************************************
clientUDP.on('message',function(message,remote){
        console.log('Mensaje recibido: ' + message + 'remote to: ' +remote.address);
        var packet;
        var ipa =""+remote.address;
        try{
             packet =  JSON.parse(message);
        }catch(er){
            console.log(er);
        }
        if(packet.codigo == 1){
            data = {
                roomName : packet.nombre,
                tiempo: packet.tiempo,
                espacios: packet.espacios,
                ip: ipa
            };
            if(!_.contains(rooms,data.ip)){
                $('#rooms').append(template(data));
                rooms.push(data.ip);
            }
            $('#'+packet.nombre+'t').text(packet.tiempo);
            $('#'+packet.nombre+'e').text(packet.espacios);
        }
});
//------------- Conectarse a un Servidor--------------------
$('.btn-floating').on('click',function(ev){
    ev.preventDefault();
    var element = $("input[name='rooms']:checked");
    var address = element.val();
    console.log(address);
    if(typeof(address) != 'undefined'){
        global.infoGame.hostAddress = address;
        global.infoGame.roomNamec = element.attr('data-roomName');
        clientTCP = network.clientTCP(portTCP, address);
        clientTCP.on('data',function(data){
        console.log(data.toString());
        var message = parseJSON(data);
        handleData(message);
});
        comprobar(ev);
        
    }else{
        alert('Debe seleccionar una sala para jugar.');
    }
});

function comprobar (ev){
//------------- Solicitar entrada al Servidor--------------------
            data = {
                'codigo' : 2,
                'nombre' : global.infoGame.playerName
            };
            console.log(data);
            clientTCP.write(JSON.stringify(data));
//------------- Esperar respuesta del Servidor--------------------
        setTimeout(function(){
           console.log('aceptado: '+confirm);
            if(confirm === true){
                clientUDP.close();
                console.log('Conectado al Host: '+global.infoGame.hostAddress+' Puerto: '+ portTCP);
                ev.currentTarget.remove();
                $('#ocultar').hide();
                $('#ocultar2').hide();
                $('#rooms').hide();
                $('#imagen_oculta').removeClass('hide');
                //window.location.href = '../html/jugarCliente.html';
            }else{
                alert('No puede ingresar a una sala llena.');
            } 
        },500);
}

//****************************  JUGAR CLIENTE  ***************************************************
function removeElementsByClass(className){
    var elements = document.getElementsByClassName(className);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}

function handleData(data){
    switch(data.codigo){
        case 3:
            aceptarSolicitud(data);
        case 4:
            presentacionJuego(data);
            break;
        case 5:
            suma=0;
            removeElementsByClass("cardp");
            removeElementsByClass("cardt");
            removeElementsByClass("cardc");
            removeElementsByClass("cardd");
            comienzoDeRonda(data);
            break;
        case 6:
            recibirArchivoMulticast(data);
        break;
        case 7:
            recibirArchivo(data);
            break;
        case 9:
            recibirCarta(data);
            break;
        case 10:
            finalizarPartida(data);
            alert('Ha finalizado el juego.');
            break;
         default:
            console.log('Codigo erroneo de JSON');
            break;
    }
}
function aceptarSolicitud(data){
    if( data.aceptado === true){
        console.log(data);
        global.infoGame.ipmulticast = data.direccion;
        global.infoGame.idcliente = data.id;
        confirm = true;
    }else{
        confirm = false;
    }
}
function recibirCarta(data){
    console.log(data);
    var valor=0;
    var numero=data.carta.substring(0, 1);
    if(data.id === global.infoGame.idcliente){
        var res = data.carta.substring(0, 1);
        switch(res){
            case 'j':
            suma = suma + 10;
            break;
            case 'q':
            suma = suma + 10;
            break;
            case 'k':
            suma = suma + 10;
            break;
            case 'a':
                if(suma + 11 > 21){
                   suma = suma + 1 ;
                }else{
                suma = suma + 11;
                }
            break;
            case '1':
            suma = suma + 10;
            break;
            default:
            valor = parseInt(res)
            suma = suma + valor;
            break;
        }
        console.log("suma: "+suma);
    } 
    var col = data.carta.substring(1, 2);
    if(col==0){
        numero=10;
        var figura = data.carta.substring(2,3);
        switch(figura){
            case 'd':
                var ascii_char='♦'
            break;
            case 'p':
                var ascii_char='♠'
            break;
            case 't':
                var ascii_char='♣'
            break;
            case 'c':
                var ascii_char='♥'
            break;
        }
    }else{
        var figura = data.carta.substring(1,2);
        switch(figura){
            case 'd':
                var ascii_char='♦'
            break;
            case 'p':
                var ascii_char='♠'
            break;
            case 't':
                var ascii_char='♣'
            break;
            case 'c':
                var ascii_char='♥'
            break;
        }
    }
    div = document.createElement('div');
    div.className = 'card'+figura;
    div.innerHTML = numero + " " + ascii_char ;
    document.getElementById(data.id).appendChild(div);
}
function presentacionJuego(data){
    jugadores = data.jugadores;
    //console.log(jugadores);
}
function comienzoDeRonda(data){
    puntaje = data.puntaje;
    //console.log(puntaje);
}
function recibirArchivo(data){
    var file;
    if(suma < 18){
        var data = {
        'codigo': 8,
        'jugar': 'true'
        };
    }else{
        var data = {
        'codigo': 8,
        'jugar': false
        };
    }
    console.log(data);
    clientTCP.write(JSON.stringify(data)); 
}
function finalizarPartida(data){
    var ronda = data.rondas;
    var cartas_jugadas = data.cartas_jugadas;
    console.log("cartas jugadas:"+cartas_jugadas);
    console.log("rondas:"+ronda);
    puntaje = data.puntaje;
    console.log(puntaje);
}
function parseJSON( json ){
    try{
        data = JSON.parse( json );
        return data;
    }catch(err){
        console.log('Error al parsear el JSON  -' + err);
    }
}
$('#bono').on('click',function(ev){
    ev.preventDefault();
    var data = {
                'codigo': 6,
                'id': global.infoGame.idcliente,
                'bono': true
            };
    clientTCP.write(JSON.stringify(data));    
});

function hearMulticast(multicastPort){
    var dgram = require('dgram');
    var socket = dgram.createSocket('udp6');
    var PORT = portmulticast;
    socket.bind(PORT,'::0',function(){
        socket.setMulticastTTL(128);
        socket.addMembership(global.infoGame.ipmulticast);
        console.log('listening on :' + global.infoGame.ipmulticast);
    });
    socket.on('message',function(message,rinfo){
       var data = parseJSON(message);
       console.log("Multicast:"+data)
       handleData(data);
    });
}