var 	
	express = require('express'),
	app = express(),
	server = require('http').createServer(app);
	

app.get('/', function(req, res){
  res.json({ games: games, clients: clients });
});

server.listen(8080);

var clients = {}, games = [], sockets = [];

var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({server: server});
wss.on('connection', function(ws) {	
  //setTimeout(function(){
  //  ws.send( s({ type: 'position', msg: '8.3|8.121' , id: '2' }) );
  //},1000);

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
  c = clients[clients[d.id].enemyId];
  if (c)
    sockets[c.id].send( s({ type: 'position', msg: d.msg , id: d.id }) );
    //sockets.forEach(function(so){
    //  so.send( s({ type: 'position', msg: d.msg , id: d.id }) );
    //});
}

function connectRequest(d, socket){  
  var newPlayer = {id: Object.keys(clients).length + 1, score: 0, status: 'connect'}
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
    game = {players: [newPlayer.id], id: games.length + 1};
    games.push(game);
  }
}

function disconnectUser(s){
  console.log('disconnected for client' + s.clientId);
  //remove client  
  //Object.keys(clients).forEach(function(key){
  //  if (clients[key].socket == s) {clientIdToRemove = key; console.log('found key to remove:' + key); }
  //});
  //remove from game 
  games.forEach(function(g){
    if (g.players[0] == s.clientId || g.players[1] == s.clientId){
      g.players.splice(g.players.indexOf(s.clientId)); //remove client from game
      if (g.players.length == 0) games.splice(g); //remove game from games
    }
  });
  delete clients[s.clientId];
  delete sockets[s.clientId];
}

//helpers
function s(j){return JSON.stringify(j); }