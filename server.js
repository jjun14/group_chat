var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var session = require('express-session');
var messages = [];
var users = [];

app.use(express.static(__dirname + "/static"));
// This sets the location where express will look for the ejs views
app.set('views', __dirname + '/views');
// Now lets set the view engine itself so that express knows that we are using ejs as opposed to another templating engine like jade
app.set('view engine', 'ejs');
// Use bodyParser to handle post-data
app.use(bodyParser.urlencoded({extended: true}));
//Create session object using express-session
// app.use(session({}));

app.get('/', function (req, res){
  res.render('index');
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
  // LISTEN for a new user entering the chat room
  socket.on('got_new_user', function(data){
    console.log('got a new user named: ' + data.name);
    users.push({id: socket.id, name: data.name});
    // BROADCAST notification that new user has entered chat
    socket.broadcast.emit('new_user', {name: data.name});
    socket.emit('entered_room', {name: data.name, messages: messages});
  });
  // LISTEN for the client entering a new message
  socket.on("got_new_message", function(data){
    messages.push({name: data.name, text: data.text});
    socket.broadcast.emit('broadcast_message', {name: data.name, text: data.text});
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
        users[i] = users[users.length - 1];
        users.pop();
        io.emit('disconnected_user', {name: name});
        return;
      }
    }
  });
})