var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var session = require('express-session');
var rooms = [];
var messages = [];
var users = [];

app.use(express.static(__dirname + "/static"));
// This sets the location where express will look for the ejs views
app.set('views', __dirname + '/views');
// Now lets set the view engine itself so that express knows that we are using ejs as opposed to another templating engine like jade
app.set('view engine', 'ejs');

app.get('/', function (req, res){
  res.render('index', {rooms: rooms});
});

var server = app.listen(8000, function(){
  console.log("Listening on 8000");
})
//get the socket.io module and pass the server object
var io = require('socket.io').listen(server);
// Whenever a connection event happens(the connection event is built in) run the following code
io.sockets.on('connection', function(socket){
  console.log("WE ARE USING SOCKETS!");
  //all the socket code goes in here!
  // LISTEN for a new chat room being made
  socket.on('create', function(data){
    socket.join(data.room_name);
    rooms.push({id: socket.id, room_name: data.room_name});
    socket.emit('create_room', {name: data.name, room_name: data.room_name});
  });
    // LISTEN for a new user entering the chat room
  socket.on('choose_room', function(data){
    socket.join(data.room_name);
    console.log('Entering Room name' + data.room_name);
    users.push({id: socket.id, name: data.name, room_name: data.room_name});
    // BROADCAST notification that new user has entered chat
    socket.broadcast.to(data.room_name).emit('new_user', {name: data.name});
    socket.emit('entered_room', {name: data.name, room_name: data.room_name, messages: messages});
  });
  // LISTEN for the client entering a new message
  socket.on("got_new_message", function(data){
    messages.push({name: data.name, text: data.text, room_name: data.room_name});
    socket.broadcast.to(data.room_name).emit('broadcast_message', {name: data.name, text: data.text});
    socket.emit('emit_message', {text: data.text});
  });
  // LISTEN for the client disconnect and broadcast name
  socket.on('disconnect', function(data)
  {
    var name;
    for(var i = 0; i < users.length; i++)
    {
      if(socket.id == users[i].id)
      {
        name = users[i].name;
        io.to(users[i].room_name).emit('disconnected_user', {name: name});
        users[i] = users[users.length - 1];
        users.pop();
        return;
      }
    }
  });
})