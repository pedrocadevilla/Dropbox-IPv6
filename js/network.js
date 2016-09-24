var ipmulticast = global.infoGame.ipmulticast;
var udp = global.infoGame.udp;
 myIP = require('my-ip');
var network = {
    net : require('net'),
    dgram: require('dgram'),
    getMyIp : function(){
      this.ip = myIP('IPv6');
        return this.ip;
    },

    serverUDP : function(json,port){
        var self = this;
        var dgram = this.dgram;
        var PORT = port;
        var HOST = ipmulticast;
        this.server = dgram.createSocket({type: 'udp6',reuseAddr:true});
        var message = new Buffer(JSON.stringify(json));
        this.server.bind(port,'::0',function(){
        self.server.setMulticastTTL(128);
        console.log(self.ip);
        self.server.addMembership(ipmulticast,self.ip);
        console.log('listening on :' + ipmulticast);
        });
        self.server.send(message,0,message.length,PORT,HOST,function (err) {
            if (err) throw err;
            console.log('Message UDP sended to: ' + HOST + ' Port: ' + PORT);
            self.server.close();
        });
    },
    
   clientUDP: function (port){
         var self = this;
        var dgram = this.dgram;
       // var client = dgram.createSocket({type: 'udp6',reuseAddr:true});
        this.client = dgram.createSocket({type: 'udp6',reuseAddr:true});
        var PORT = port;
        var HOST = '::0';
         this.client.bind(PORT,'::0',function(){
        self.client.setMulticastTTL(128);
        console.log(self.ip);
        self.client.addMembership(global.infoGame.ipmulticast,self.ip);
        });
         self.client.on('listening',function(){
            console.log("Server on listening:"+ HOST + ' Port:' + PORT);
        });
        return self.client;
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
            console.log(multicastAddress);
        });
        var send = function(message,band){
            if(band==false){
                var data = new Buffer(JSON.stringify(message));
                server.send(data,0,data.length,PORT,multicastAddress,function(err){
                    if (err) throw err;
                 // console.log('multicast sended : '+ JSON.stringify(message));
                });
            }else{
                console.log(band);
                 server.send(message,0,message.length,PORT,multicastAddress,function(err){
                    if (err) throw err;
                  //console.log('multicast sended : '+ JSON.stringify(message));
                });
            }
        };
        return send;
    }
};