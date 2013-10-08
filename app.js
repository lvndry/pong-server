var 	
	express = require('express'),
	app = express(),
	server = require('http').createServer(app);
	

//listen to index page
app.get('/', function(req, res){
  res.json({ games: games, clients: clients });
});

server.listen(8080);

var clients = {}, games = [], sockets = [];

//sockets section
var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({server: server});
wss.on('connection', function(ws) {	  
  ws.on('message', function(d) {    		
      console.log('received: %s', d);
      d = JSON.parse(d);      

      switch(d.type){
        case 'connectRequest': connectRequest(d, ws); break;
        case 'position': setPosition(d); break;
        default: console.log('unknown type'); break;
      }
  });  

  ws.on('close', function() {
    disconnectUser(ws);
  });

});

function setPosition(d){
  if (d.id){
    c = clients[clients[d.id].enemyId];
    if (c) sockets[c.id].send( s({ type: 'position', msg: d.msg , id: d.id }) );
  }
}

function connectRequest(d, socket){  
  var newPlayer = {id: guid(), score: 0, status: 'connect'} //Object.keys(clients).length + 1
  socket.clientId = newPlayer.id;
  sockets[newPlayer.id] = socket;

  clients[newPlayer.id] = newPlayer;
  socket.send( s({ type: 'connected', id: newPlayer.id }) );
  //join game
  var foundMatch = false;
  games.forEach(function(g){
    if (g.players.length == 1 && !foundMatch){
      //join game
      foundMatch = true;      
      oldPlayer = clients[g.players[0]];
      g.players.push(newPlayer.id);
      newPlayer.enemyId = oldPlayer.id;
      oldPlayer.enemyId = newPlayer.id;      
      sockets[oldPlayer.id].send( s({ type: 'foundMatch', msg: newPlayer.id + '|down' }) );
      sockets[newPlayer.id].send( s({ type: 'foundMatch', msg: oldPlayer.id + '|up' }) );
    }
  });
  if (!foundMatch){ //create new game
    game = {players: [newPlayer.id], id: guid()}; //games.length + 1
    games.push(game);
  }
}

function disconnectUser(socket){
  console.log('disconnected for client: ' + socket.clientId);  
  games.forEach(function(g){
    if (g.players[0] == socket.clientId || g.players[1] == socket.clientId){      
      //notify enemy left the game
      sockets[ ((g.players[0] == socket.clientId) ?  g.players[1] : g.players[0]) ].send( s({ type: 'enemyLeft', msg: socket.clientId }) );

      g.players.splice(g.players.indexOf(socket.clientId)); //remove client from game
      if (g.players.length == 0) games.splice(g); //remove game from games
    }
  });
  delete clients[socket.clientId];
  delete sockets[socket.clientId];
}

//helpers
function s(j){return JSON.stringify(j); }

  //guid
function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}