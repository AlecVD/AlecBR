/*global Phaser io*/
var socket; // define a global variable called socket 
socket = io.connect(); // send a connection request to the server

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'alec-br', { preload: preload, create: create, update: update, render: render });

//Vars
var enemies = [];
var noEnemies = true;
var playerNotCreated = true;
var player;
var lastPos = {
	x: null,
	y: null,
	angle: null
};
var curPos = {
	x: null,
	y: null,
	angle: null
};
var moveSpeed = 250;

//Socket Functions

function onsocketConnected () {
	console.log("connected to server"); 
	
	// send the server our initial position and tell it we are connected
	socket.emit('new_player', {x: player.x, y: player.y, angle: player.angle});
	
	// setInterval(sendMovement,100);sss
}
function onPlayerCreated(){
	playerNotCreated = false;
	alert('playerNotCreated = '+playerNotCreated);
}
function onRemovePlayer (data) {
	var removePlayer = findplayerbyid(data.id);
	// Player not found
	if (!removePlayer) {
		console.log('Player not found: ', data.id)
		return;
	}
	
	removePlayer.player.destroy();
	enemies.splice(enemies.indexOf(removePlayer), 1);
}

var remote_player = function (id, startx, starty, start_angle) {
	// alert('new player id:'+this.id+' x:'+this.x+' y:'+this.y+' angle:'+this.angle)
	this.x = startx;
	this.y = starty;
	//this is the unique socket id. We use it as a unique name for enemy
	this.id = id;
	this.angle = start_angle;
	
	this.player2 = game.add.sprite(this.x,this.y,'blue');
    addPhysics(this.player2);
    this.player2.angle = this.angle;
}

function onEnemyMove (data) {
	// console.log(data.id);
	// console.log(enemies);
	var movePlayer = findplayerbyid (data.id); 
	
	if (!movePlayer) {
		return;
	}
	// alert('enemy move id:'+this.id+' x:'+data.x+' y:'+data.y+' angle:'+data.angle);
	movePlayer.player2.x = data.x; 
	movePlayer.player2.y = data.y; 
	movePlayer.player2.angle = data.angle; 
}
function findplayerbyid (id) {
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].id == id) {
			return enemies[i]; 
		}
	}
}

function onExistingPlayer(data) {
	console.log(data);
	// alert('Existing Player');
	noEnemies = false;
	alert('noEnemies = '+ noEnemies);

	enemies.push(new remote_player(data.id, data.x, data.y, data.angle));
}

function preload(){
    game.stage.backgroundColor = "#FFFFFF";
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;
    
    //Load images
    game.load.image('red','./assets/red.png');
    game.load.image('green','./assets/green.png');
    game.load.image('blue','./assets/blue.png');
}
function create(){
    
    //Socket Functions
	console.log("client started");
	socket.on("connect", onsocketConnected); 

	//listen to enemy movement 
	socket.on("enemy_move", onEnemyMove);
	// when received remove_player, remove the player passed; 
	socket.on('remove_player', onRemovePlayer); 
	
	socket.on("existing_player", onExistingPlayer);
	
	socket.on("player_created", onPlayerCreated);
	
	createPlayer();
}

function createPlayer(){
	//Player 1
    game.physics.startSystem(Phaser.Physics.ARCADE);
    player = game.add.sprite(50,50,'red');
    addPhysics(player);
}

function update(){
    for (var i = 0; i < enemies.length; i++) {
    	game.physics.arcade.collide(player, enemies[i]);	
    }
    
    if (game.input.keyboard.isDown(Phaser.Keyboard.W)){
        game.physics.arcade.velocityFromRotation(player.rotation, moveSpeed, player.body.velocity);

    }else if(game.input.keyboard.isDown(Phaser.Keyboard.S)){
        game.physics.arcade.velocityFromRotation(player.rotation, -moveSpeed, player.body.velocity);
    }else{
        player.body.acceleration.set(0);
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.A))
    {
        player.body.angularVelocity = -moveSpeed;
    }
    else if (game.input.keyboard.isDown(Phaser.Keyboard.D))
    {
        player.body.angularVelocity = (moveSpeed-100);
    }else{
        player.body.angularVelocity = 0;
    }
    
    //Round that shit
    player.x = Math.round((player.x)*100)/100;
    player.y = Math.round((player.y)*100)/100;
    player.angle = Math.round((player.angle)*100)/100;
    
    
    curPos = {x:player.x,y:player.y,angle:player.angle};
    
    if(lastPos.x != curPos.x || lastPos.y != curPos.y || lastPos.angle != curPos.angle){
    	// alert('send pos');
    	socket.emit('move_player', {x: player.x, y: player.y, angle: player.angle});
    	console.log("socket.emit('move_player', {x:"+ player.x+", y: "+player.y+", angle: "+player.angle+"});");
    	
    	// if(noEnemies){
    	// 	socket.emit('giveme_players');
    	// 	// alert('requesting enemies');
    	// }
    	
    }
    lastPos = curPos;
	
    
}
function startGame(){
	
}
function addPhysics(sprite){
    sprite.scale.setTo(4, 4);
    sprite.anchor.set(0.5);
    
    //Physics
    game.physics.arcade.enable(sprite);
    sprite.enableBody = true;
    sprite.body.drag.set(750);
    sprite.body.collideWorldBounds = true;
}
function render(){
  //game.debug.body(player);
  //for(var i=0;i<enemies.length;i++){
  //	game.debug.body(enemies[i].player2);
  //}
}