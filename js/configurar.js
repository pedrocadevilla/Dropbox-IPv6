$('#submit').on('click',function(ev){
	ev.preventDefault();
	var udp = $("#udp");
	var tcp = $("#tcp");
	var ipmulticast = $('#ipmulticast');
	var portmulticast = $('#portmulticast');
	if(udp.val() === '' || tcp.val() === '' || 
		ipmulticast.val() === '' || portmulticast.val() === ''){
		alert('No puede dejar un campo vacío');
	}else{
		global.infoGame.udp					= Number($("#udp").val());
		global.infoGame.tcp					= Number($("#tcp").val());
		global.infoGame.ipmulticast			= $('#ipmulticast').val();
		global.infoGame.portmulticast		= Number($('#portmulticast').val());
		window.location.href = '../html/index.html';
	}
});
