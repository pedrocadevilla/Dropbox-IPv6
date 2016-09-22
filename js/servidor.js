var ip = global.infoGame.ipmulticast;
var port = global.infoGame.tcp;
var time = global.infoGame.tiempo;
var roomName = global.infoGame.roomName;
var portmulticast = global.infoGame.portmulticast;
var idcliente = 0;
var jugadores = new Array(new Object);
var share = new Array(new Object);
var puntaje = new Array(new Object);
var suma = new Array(new Object);
var ganadores = new Array(new Object);
var ipclientes = new Array(new Object);
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
var band=0, band1=0,band2=0,band3=0;
var jugadoresEnSala;
var turno = 0;
var clientTCP;
var cartasRestantes;
var rondas=0;
var band=false;
global.infoGame.Filename='';
var fs = require('fs');
fsmonitor = require('fsmonitor');
var dir = './share';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
// Eventos de Archivos y Carpetas

fsmonitor.watch('./share', null, function(change) {
    var str;
    var file;
    //console.log("Change detected:\n" + change);  
    if(change.addedFiles[0]!=null){
        console.log("Added files:    ", change.addedFiles);
        str=change.addedFiles;
        console.log(str);
        file = fs.readFileSync(dir+'/'+change.addedFiles).toString();
        var data = {
            'codigo': 7,
            'file': file
        };
       // sendMulticast(data); 
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
                sendMulticast(message);
                //network.serverUDP(message,port);
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
        clientTCP = client;
        client.on('data',function(data){
            if(band==false){
                console.log(data.toString());
                var message = parseJSON(data);
                handleData(message,client);
                if(message.codigo==4 || message.codigo==5){
                    console.log(band);
                    band=true;
                }
            }else{
                const copy = JSON.parse(data, function(key, value)  {
                return value && value.type === 'Buffer' ? new Buffer(value.data) : value;
                });
                console.log(copy.toString());
                ReceiveFile(copy,client);
                band=false;
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
            sendMulticast(data);
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
                envioDeCarta(data,sock);
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
        var name= data.nombre;
        global.infoGame.Filename=name;
        console.log('nombre:'+name);
    }
   function ReceiveFile( data, sock){
        console.log(dir);
        var file = data.file;
        console.log('tamaño:'+file.length);
        fs.writeFile('./share/'+global.infoGame.Filename,file);
        ResendFile(global.infoGame.Filename,file);
    }
   function ResendFile(name,buffer){
            var data = {
            'codigo': 6,
            'nombre':name
            };
            sendMulticast(data);
            function time(){
                myVar= setTimeout(enviar,2000);
            }
            function enviar(){
                var dataFile = {
                'file': buffer
                };
                sendMulticast(dataFile);
            }
            time();
   }
    function parseJSON( json ){
        try{
            var data = JSON.parse( json );
            return data;
        }catch(err){
            console.log('Error al parsear el JSON  -' + err);
        }
    }

    function comienzoDeRonda(points){
    jugadoresEnSala = _.size(jugadores);
    if(band === 0){
        for (var i = 0; i <=  jugadoresEnSala - 1; i++) {
             puntaje[i] = {id: jugadores[i].id, puntaje: points};
        }
    band = 1;
    }
    var data = {
        'codigo': 5,
        'puntaje': puntaje
    };
    return data;
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

