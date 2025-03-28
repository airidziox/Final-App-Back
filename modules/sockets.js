const {Server} = require("socket.io");
const usersOnline = require("../modules/usersOnline");

const io = new Server({
    cors: {
        origin: "*",
    }
});

io.on("connection", (socket) => {

    socket.on("login", (username) => {
        const online = usersOnline.getUsers()

        const userExists = online.find(x => x.id === socket.id);
        if (userExists) return

        const newUser = {
            id: socket.id,
            username: username,
        }
        usersOnline.addUser(newUser)

        const updatedOnline = usersOnline.getUsers()
        console.log(updatedOnline)

        io.emit("onlineUsers", updatedOnline)
    })

    socket.on("requestOnlineUsers", () => {
        const currentOnlineUsers = usersOnline.getUsers();
        socket.emit("onlineUsers", currentOnlineUsers);
    });

    socket.on('logout', (username) => {
        const online = usersOnline.getUsers()
        usersOnline.removeUser(username)
        io.emit("onlineUsers", online)
    })

    socket.on("disconnect", () => {
        usersOnline.removeUser(socket.id)

        const updatedOnline = usersOnline.getUsers()
        io.emit("onlineUsers", updatedOnline)
    })

});

io.listen(3001);

module.exports = io