const express = require('express');
const socket = require('socket.io');
const http = require('http');
const {Chess} = require('chess.js');
const path = require('path');
const app = express();

const server = http.createServer(app);
const io = socket(server);
const chess = new Chess();

let players = {};
var  currentPlayer = 'w';

const hostname = '127.0.0.1';
const port = 8080;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,"public")));


app.get("/", (req, res)=>{
    res.render("index");
});


io.on("connection", function (uniqesocket) {
    console.log('Connected');

    
    if(!players.white){
        players.white=uniqesocket.id;
        uniqesocket.emit("playerRole", 'w')
    }else if (!players.black){
        players.black= uniqesocket.id;
        uniqesocket.emit("playerRole", 'b')
    }else{
        uniqesocket.emit('spectatorRole')
    }

    uniqesocket.on("disconnect", function(){
        if(uniqesocket.id===players.white){
            delete players.white;
        }else if(uniqesocket.id===players.black){
            delete players.black;
        }
    });

    uniqesocket.on('move', function(move) {
        try {
            if(chess.turn() ==='w' && uniqesocket.id !== players.white) return;
            if(chess.turn() ==='b' && uniqesocket.id !== players.black) return;

            const result = chess.move(move);
            if(result){
                currentPlayer=chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen())
            }else{
                console.log(`Invalid move : ${move}`);
                uniqesocket.emit(`Invalid move : ${move}`);
            }
        }catch(err) {
            console.log(err);
            uniqesocket.emit(`Invalid move : ${move}`);
        }
    });

});

server.listen(port, hostname,   () => { 
    console.log(`App is running on http://localhost:${port}`)
}); 