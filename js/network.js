var ipbroadcast = global.infoGame.ipbroadcast;
var ipmulticast = global.infoGame.ipmulticast;
var udp = global.infoGame.udp;
var myIP = require('my-ip');
var network = {
    net : require('net'),
    dgram: require('dgram'),
    getMyIp : function(){
      this.ip = myIP('IPv6');
        return this.ip;
    },

    serverUDP : function(json,port){

        var dgram = this.dgram;
        var PORT = port;
        var HOST = ipbroadcast;
        var server = dgram.createSocket({type: 'udp6',reuseAddr:true});
        var message = new Buffer(JSON.stringify(json));

        server.send(message,0,message.length,PORT,HOST,function (err) {
            if (err) throw err;
            console.log('Message UDP sended to: ' + HOST + ' Port: ' + PORT);
            server.close();
        });
    },
    
   clientUDP: function (port){
        var dgram = this.dgram;
        var client = dgram.createSocket({type: 'udp6',reuseAddr:true});
        var PORT = port;
        var HOST = '::0';
        this.ip = myIP('IPv6');
         client.bind(PORT,'::0',function(){
        client.setMulticastTTL(128);
        console.log(this.ip);
        client.addMembership(global.infoGame.ipmulticast,this.ip);
        });
         client.on('listening',function(){
            console.log("Server on listening:"+ HOST + ' Port:' + PORT);
        });
        return client;
    },

    clientTCP : function(port,host){
        var net = this.net;      
        if(net.isIPv6(host)){
            console.log(host);  
        var client = new net.Socket();
        client.connect(port,host,function(){
            console.log('connected to: ' + host + ' ' + port);
        });
        return client;
        }else{
            return 0;
        }
    },

    multicast : function(multicastPort){
        var self = this;
        var dgram = this.dgram;
        var PORT = multicastPort;
        var multicastAddress = ipmulticast;
        var server = dgram.createSocket({type: 'udp6',reuseAddr:true});
        //var server = dgram.createSocket('udp6');
        //The port bind should be changed
        console.log('port multicast :'+ PORT);
        server.bind(PORT,'::0',function(){
            server.setMulticastTTL(128);
            console.log(self.ip);
            server.addMembership(multicastAddress);
        });
        var send = function(message){
            var data = new Buffer(JSON.stringify(message));
            server.send(data,0,data.length,PORT,multicastAddress,function(err){
                if (err) throw err;
               // console.log('multicast sended : '+ JSON.stringify(message));
            });
        };
        return send;
    }
};