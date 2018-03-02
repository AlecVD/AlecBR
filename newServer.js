var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

server.listen(process.env.PORT || 8081,function(){
    console.log('Listening on '+server.address().port);
});

io.sockets.on('connection', function(socket){
	console.log("socket connected"); 
	// listen for disconnection; 
	socket.on('disconnect', onClientdisconnect); 
	// listen for new player
	socket.on("new_player", onNewplayer);
	// listen for player position update
	socket.on("move_player", onMovePlayer);
	
	socket.on('giveme_players', onGivePlayers);
	
	socket.on('join_queue',onJoinQueue);
});

var player_lst = [];
var playerQueue = 0;


//a player class in the server
var Player = function (startX, startY, startAngle) {
  this.x = startX
  this.y = startY
  this.angle = startAngle
}
function onGivePlayers(data){
    for (var i = 0; i < player_lst.length; i++) {
		var existingPlayer = player_lst[i];
		// console.log(player_lst[i]);
		var player_info = {
			id: existingPlayer.id,
			x: existingPlayer.x,
			y: existingPlayer.y, 
			angle: existingPlayer.angle,			
		};
		
		if(player_info.id != this.id){
		    console.log("sending existing player:"+player_info);
		    //send message to the sender-client only
		    this.to(this.id).emit('existing_player',player_info);
		}else{
		    console.log("no sending because players were the same");
		}
		
	}
}
function onJoinQueue(){
	playerQueue++;
	if(playerQueue > 1){
		startCountDown();
	}
}
function startCountDown(){
	
}
function onNewplayer (data) {
	console.log(data);
	//new player instance
	var newPlayer = new Player(data.x, data.y, data.angle);
	console.log(newPlayer);
	console.log("created new player with id " + this.id);
	newPlayer.id = this.id; 	
	//information to be sent to all clients except sender
	var current_info = {
		id: newPlayer.id, 
		x: newPlayer.x,
		y: newPlayer.y,
		angle: newPlayer.angle,
	};
	//Send all other players info
	this.broadcast.emit('existing_player',current_info);
	
	// // send player all other players
	// for (var i = 0; i < player_lst.length; i++) {
	// 	var existingPlayer = player_lst[i];
	// 	var player_info = {
	// 		id: existingPlayer.id,
	// 		x: existingPlayer.x,
	// 		y: existingPlayer.y, 
	// 		angle: existingPlayer.angle,			
	// 	};
	// 	console.log("sending existing player:"+i);
	// 	//send message to the sender-client only
	// 	this.to(this.id).emit('existing_player',player_info);
	// }
	
	this.to(this.id).emit('player_created','yuh');
	
	player_lst.push(newPlayer); 
	console.log(newPlayer);
	
	
}
//update the player position and send the information back to every client except sender
function onMovePlayer (data) {
	var movePlayer = find_playerid(this.id); 
	movePlayer.x = data.x;
	movePlayer.y = data.y;
	movePlayer.angle = data.angle; 
	
	var moveplayerData = {
		id: movePlayer.id,
		x: movePlayer.x,
		y: movePlayer.y, 
		angle: movePlayer.angle
	}
	console.log('Move Player id:'+this.id+' x:'+data.x+' y:'+data.y+' angle:'+data.angle);
	
	//send message to every connected client except the sender
	this.broadcast.emit('enemy_move', moveplayerData);
}

function onClientdisconnect() {

	var removePlayer = find_playerid(this.id); 
		
	if (removePlayer) {
		player_lst.splice(player_lst.indexOf(removePlayer), 1);
	}
	console.log("removing player " + this.id);
	//send message to every connected client except the sender
	this.broadcast.emit('remove_player', {id: this.id});
}

// find player by the the unique socket id 
function find_playerid(id) {
    for (var i = 0; i < player_lst.length; i++) {
		if (player_lst[i].id == id) {
			return player_lst[i]; 
		}
	}
	return false; 
}