let http = require("http");
let https = require("https");
let fs = require("fs")
let app = require("./App");
let socketIo  = require("socket.io");

// Controllers
let userController = require("./api/controllers/users");

let count = 0;
let port = 5000;
let server;

if (process.env.NODE_ENV !== "production") {

    server = http.createServer(app);

    server.listen(port, function() {
        console.log("Listening to port:", port);
    });

} else {

    server = https.createServer({
        key: fs.readFileSync("/etc/letsencrypt/live/sitaratas.eu/privkey.pem", "utf8"),
        cert: fs.readFileSync("/etc/letsencrypt/live/sitaratas.eu/cert.pem", "utf8"),
        ca: fs.readFileSync("/etc/letsencrypt/live/sitaratas.eu/chain.pem", "utf8")
    }, app);
      
    server.listen(port, function() {
        console.log("Listening to port:", port);
    });

}

let io = socketIo(server);

io.sockets.on("connection", (socket) => {

    count++;
    io.sockets.emit("count", { count });

    socket.on("set-active", (data) => {
        userController.update_socket(data, socket.id, true);
    });

    socket.on("disconnect", () => {
        userController.remove_socket(socket.id);
        count--;
        io.sockets.emit("count", { count });
    });

});

exports.io = io;
