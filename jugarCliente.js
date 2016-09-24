var ip = network.getMyIp();
console.log(ip);
var portmulticast = global.infoGame.portmulticast;
var portTCP = global.infoGame.tcp;
var upd = global.infoGame.udp;
var jugadores = new Array(new Object);
hearMulticast(portmulticast);
//var clientUDP = network.clientUDP(global.infoGame.udp);
var clientTCP;
var template = _.template($('#room-template').html());
var rooms = [];
var confirm = false;
var fs = require('fs');
fsmonitor = require('fsmonitor');
var dir = './shareClient';
var buffernew;
var buff;
require('buffer').Buffer;
var band=false;
var mandar = true;
global.infoGame.fileName='';
global.infoGame.size=0;
var cod_f;
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
//*************************Eventos de Archivos y Carpetas*********************************
fsmonitor.watch('./shareClient', null, function(change) {
    var str_add;
    var str_mod;
    if(change.addedFiles[0]!=null && mandar==true){
        console.log("Added files:    ", change.addedFiles);
        str_add=change.addedFiles[0];
        cod_f = 4;
        sendFile(str_add,cod_f);
    }
    if(change.modifiedFiles[0]!=null){
        console.log("Modified files: ", change.modifiedFiles);
        str_mod=change.modifiedFiles[0];
        cod_f=5;
        sendFile(str_mod,cod_f);
    }
    if(change.removedFiles[0]!=null){
        console.log("Removed files:  ", change.removedFiles);
        str=change.removedFiles[0];
        band=7;
        removedFile(str,band);
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
    var myVar;
    console.log(str);
    file = fs.readFile(dir+'/'+str,function(err,data){
        console.log(data.length);
        var msg = {
        'codigo': cod_file,
        'nombre':str,
        'size':data.length
        };
        clientTCP.write(JSON.stringify(msg));
        console.log(msg);
    
        function time(){
            myVar= setTimeout(enviar,2000);
        }
        function enviar(){   
            clientTCP.write(data);
            console.log('Cliente envió archivo:'+str);
        }
        time();
    });
}
//****************************     UNIRSE  ******************************************************
function ServidorAnuncia(message,remote){
    console.log('Mensaje recibido: ' + message + 'remote to: ' +remote.address);
    var packet;
    var ipa =""+remote.address;
    if(message.codigo == 1){
        data = {
            roomName : message.nombre,
            tiempo: message.tiempo,
            espacios: message.espacios,
            ip: ipa
        };
        if(!_.contains(rooms,data.ip)){
            $('#rooms').append(template(data));
            rooms.push(data.ip);
        }
        $('#'+message.nombre+'t').text(message.tiempo);
        $('#'+message.nombre+'e').text(message.espacios);
    }
}
//});
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
            if(band==false){
                var message = parseJSON(data);
                handleData(message);
            }else{
                console.log('Recibió archivo del servidor');
                logDataStream(data); 
                buff = Buffer.concat([buff, new Buffer(data, 'hex')]);
                if(buff.length == global.infoGame.size){
                    ReceiveFile_FromServer(buff,clientTCP);
                    band=false;
                }
            }
});
    comprobar(ev);    
    }else{
        alert('Debe seleccionar una sala para jugar.');
    }
});
function logDataStream(data){  
  // log the binary data stream in rows of 8 bits
  var print = "";
    for (var i = 0; i < data.length; i++) {
        print += " " + data[i].toString(16);
    // apply proper format for bits with value < 16, observed as int tuples
        if (data[i] < 16) { print += "0"; }
    // insert a line break after every 8th bit
        if ((i + 1) % 8 === 0) {
            print += '\n';
        };
    }
}
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
            //clientUDP.close();
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

function handleData(data,rinfo){
    switch(data.codigo){
        case 1:
            ServidorAnuncia(data,rinfo);
        case 3:
            aceptarSolicitud(data);
        case 4:
            presentacionJuego(data);
            break;
        case 5:
            
            break;
        case 6:
            recibirArchivo(data,rinfo);
        break;
        case 7:
            fileRemoved(data,sock);
        break;
        case 9:
            break;
        case 10:
            break;
         default:
            console.log('Codigo erroneo de JSON');
            break;
    }
}
function recibirArchivo(data,rinfo){
    console.log('Se va recibir un archivo del servidor.');
    global.infoGame.fileName=data.nombre;
    console.log(data.ipcliente);
    if(ip != data.ipcliente){
        band=true;
    }
}
function ReceiveFile_FromServer(data,sock){   
    console.log('tamaño:'+data.length);
    console.log('Se recibió archivo del servidor.')
    mandar=false;
    fs.writeFile('./shareClient/'+global.infoGame.fileName,data);
    mandar=true;
    console.log('Se añadió el archivo:'+global.infoGame.fileName);
    //Se deberia vaciar el buffer <- OJO
    global.infoGame.fileName='';
    global.infoGame.size=0;
}
function removedFile(str, cod_file){
    var file;
    var stats;
    var myVar;
    console.log(str);
        var data = {
        'codigo': cod_file,
        'nombre':str
        };    
        function time(){
            myVar= setTimeout(enviar,2000);
        }
        function enviar(){
            console.log('remover');
            clientTCP.write(JSON.stringify(data));
        }
    time();
}
function fileRemoved( data, sock){
    const fs = require('fs');
    var nombre = data.nombre;
    fs.unlinkSync('./share/'+data.nombre);
    console.log('successfully deleted /share/'+data.name);
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
function presentacionJuego(data){
    jugadores = data.jugadores;
    //console.log(jugadores);
}
function comienzoDeRonda(data){
    puntaje = data.puntaje;
    //console.log(puntaje);
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
    //var socket = dgram.createSocket({type: 'udp6',reuseAddr:true});
    var socket = dgram.createSocket('udp6');
    var PORT = portmulticast;
    socket.bind(PORT,'::',function(){
        socket.setMulticastTTL(128);
        socket.addMembership(global.infoGame.ipmulticast);
        console.log('listening on :' + global.infoGame.ipmulticast);
    });
    socket.on('message',function(message,rinfo){
        var data = parseJSON(message);
        console.log("codigo:"+data.codigo);
        handleData(data,rinfo);
    });
}