var ip = global.infoGame.ipmulticast;
var port = global.infoGame.tcp;
var time = global.infoGame.tiempo;
var roomName = global.infoGame.roomName;
var portmulticast = global.infoGame.portmulticast;
var idcliente = 0;
var jugadores = new Array(new Object);
var ipclientes = new Array(new Object);
var ipclients = new Array(new Object);
var myIP = network.getMyIp();
var users = [];
var cant = global.infoGame.espacios;
var intervalToAnnounce;
var intervalMulticast;
var sendMulticast = network.multicast(portmulticast);
var template = _.template($('#players-template').html());
var ipcliente;
var cantidad_jug = global.infoGame.espacios;
var pos;
var posi=0;
var jugadoresEnSala;
var clientTCP;
var band=false;
global.infoGame.Filename='';
 global.infoGame.size=0;
var fs = require('fs');
fsmonitor = require('fsmonitor');
var dir = './share';
var buff = new Buffer(0, 'hex');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
// Eventos de Archivos y Carpetas

fsmonitor.watch('./share', null, function(change) {
    var str;
    var file;
    //console.log("Change detected:\n" + change);  
    if(change.addedFiles[0]!=null){
        console.log("Added files:    ", change.addedFiles[0]);
        str=change.addedFiles[0];
        console.log(str);
        file = fs.readFileSync(dir+'/'+change.addedFiles[0]).toString();
        var data = {
            'codigo': 7,
            'file': file
        };
    }
    if(change.modifiedFiles[0]!=null){
    console.log("Modified files: ", change.modifiedFiles);
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

//--------------------------------------------------------------------
announceRoom(global.infoGame.roomNames,global.infoGame.tiempo,cantidad_jug,global.infoGame.udp);
    function announceRoom(room, time, space, port){
        
        intervalToAnnounce = setInterval(function(){
        var message = {
            'codigo': 1,
            'nombre': room,
            'tiempo': global.infoGame.tiempo,
            'espacios': space
        };
        if(global.infoGame.tiempo>0){
            global.infoGame.tiempo = global.infoGame.tiempo-1;
        }else{
            global.infoGame.tiempo = 120;
        }
                sendMulticast(message,false);
               //network.serverUDP(message,20050);
        }, 1000);
        var data = {
            type: 'alert-success',
            message: 'El servidor se esta Anunciando.',
            description: 'En el puerto: ' + port
        };
    }

(function startServer(){
    var server = network.net.createServer(function(client){
        console.log('client connected');
        //Verificar si el que se conecto ya no esta agregado en el vector.
        ipclientes[pos] ={id: idcliente, ip: ipcliente}; 
        ipclients[posi]={ip:client.remoteAddress};
        posi = posi + 1;
        clientTCP = client;
        client.on('data',function(data){
            if(band==false){
                var message = parseJSON(data);
                handleData(message,client);
            }else{
                console.log('Recibió archivo del cliente');
                logDataStream(data); // Acumular Buffer
                buff = Buffer.concat([buff, new Buffer(data, 'hex')]); // Concatenar el buffer
                if(buff.length == global.infoGame.size){
                      ReceiveFile(buff,client);
                      band=false;
                }
            }                                  
        });
        client.on('end',function(){
            console.log('client disconected');
            var find = _.findWhere(ipclientes,{ip:client.remoteAddress});
            console.log('find:'+find);
            var data ={
                'codigo' : 11,
                'id' : find.id
            };
            console.log('Data disconnect:'+data);
            sendMulticast(data,false);
            var user = _.find(users,function(users){
                        return typeof(users.sock.localAddress) === 'undefined';
                    });
            removePlayer(user);
            delete user.sock;
            var index = users.indexOf(user);
            users.splice(index, 1);
        });
        client.on('error', function(err){
        if (err.code == 'ECONNRESET') { 
            console.log('Un cliente ha dejado la sala.');
            //console.log(client.remoteAddress);
            client.destroy();
        }
    });
    });
    server.listen(port,function(){
        console.log('Server listening');
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
    function handleData( data , sock ){
        switch(data.codigo){
            case 2:
                responseConnection(data, sock);
                break;
            case 4:
                fileComes(data,sock);
                break;
            case 5:
                fileComes(data,sock);
                break;
            case 8:
                
                break;
            default:
                console.log('Codigo erroneo de JSON');
                break;
        }
    }
    function responseConnection( json, sock ){        
        if(global.infoGame.espacios <= 0){          
            var response ={
                'codigo' : 3,
                'aceptado' : false,
                'direccion': null,
                'id' : null
            };
        }else{
             idcliente = (cant - cantidad_jug)+1;
              console.log('idcliente: '+idcliente);
                var response ={
                    'codigo' : 3,
                    'aceptado' : true,
                    'direccion': ip,
                    'id' : idcliente
                };
            cantidad_jug =  cantidad_jug - 1;
            console.log('espacios: '+cantidad_jug);
            global.infoGame.espacios = cantidad_jug;
            
            sock.write(JSON.stringify(response));
            ipcliente = sock.remoteAddress;
            ipcliente = ipcliente.replace("::ffff:","");

                data = {
                playerName : json.nombre,
                ip : ipcliente,
                };
                
            pos = idcliente - 1;
            jugadores[pos]= {nombre: json.nombre, id: idcliente};
            ipclientes[pos] ={id: idcliente, ip: ipcliente}; 
            console.log(ipcliente);
            
            clearInterval(intervalToAnnounce);
            announceRoom(global.infoGame.roomNames,global.infoGame.tiempo,cantidad_jug,global.infoGame.udp);
            $('#players').append(template(data));
            users.push({
                ip: ipcliente,
                playerName: json.nombre
            });
        }
    }
    function fileComes( data, sock){
        global.infoGame.Filename=data.nombre;
        global.infoGame.size = data.size;
        console.log('nombre:'+data.nombre);
         band=true;
    }
   function ReceiveFile( data, sock){
        console.log(sock.remoteAddress);
        console.log('tamaño:'+data.length);
        fs.writeFile('./share/'+global.infoGame.Filename,data);
        console.log('Se guardo el archivo:'+global.infoGame.Filename+' recibido por el cliente');
        ResendFile(global.infoGame.Filename, data, sock.remoteAddress);
        global.infoGame.size=0;
    }
   function ResendFile(name,buffer, remoteAddress){
            var msg = {
            'codigo': 6,
            'nombre':name,
            'ipcliente':remoteAddress,
            'size':buffer.length
            };
            sendMulticast(msg,false);
            function time(){
                myVar= setTimeout(enviar,2000);
            }
            function enviar(){
                for (var i = 0; i < ipclients.length; i++) {
                    if(ipclients[i].ip!=remoteAddress){
                        clientTCP = network.clientTCP(port, ipclients[i].ip);
                        clientTCP.write(buffer);
                        clientTCP.destroy();
                        console.log('Servidor reenvío al cliente.'+ipclients.ip);
                    }
                }
                //sendMulticast(buffer,true);
                
            }
            time();
            //Se deberia vaciar el Buffer!
            global.infoGame.Filename='';
   }
    function parseJSON( json ){
        try{
            var data = JSON.parse( json );
            return data;
        }catch(err){
            console.log('Error al parsear el JSON  -' + err);
        }
    }


    function removeElementsByClass(className){
    var elements = document.getElementsByClassName(className);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
    }
$('#crearSala').on('click',function(ev){
    ev.preventDefault();
    console.log('Empezar juego');
    console.log('jugadoresb:'+jugadores);
    console.log(jugadores);
    ev.currentTarget.remove();
    $('#ocultar').hide();
    $('#ocultar2').hide();
    $('#players').hide();
    $('#imagen_oculta').removeClass('hide');
    $('#btn_oculta').removeClass('hide');
    clearInterval(intervalToAnnounce);
    monitor.on('change', function(changes) {
    //console.log(changes);
    });
});
$('#comenzar').on('click',function(ev){
    ev.preventDefault();
    removeElementsByClass("cardp");
    removeElementsByClass("cardt");
    removeElementsByClass("cardc");
    removeElementsByClass("cardd");

});

}());
function removePlayer(data){
    $('#'+data.playerName+'-'+ data.ip).remove();
}

