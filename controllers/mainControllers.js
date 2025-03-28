const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const {uid} = require("uid");

const io = require("../modules/sockets");
const usersOnline = require("../modules/usersOnline");

const userSchema = require("../schemas/userSchema");
const postSchema = require("../schemas/postSchema");

module.exports = {
    register: async (req, res) => {
        const {username, passwordOne} = req.body;

        const userExists = await userSchema.findOne({username})
        if (userExists) return res.send({message: "User already exists.", error: true})

        const salt = await bcrypt.genSalt(5)
        const hash = await bcrypt.hash(passwordOne, salt)

        const user = {
            username,
            password: hash,
        }

        const newUser = new userSchema(user)
        await newUser.save()

        res.send({message: "User created successfully!"});
    },
    login: async (req, res) => {
        const {username, password} = req.body;

        const userExists = await userSchema.findOne({username})
        if (!userExists) return res.send({error: true, message: "User does not exist!"});

        const samePassword = await bcrypt.compare(password, userExists.password);
        if (!samePassword) return res.send({error: true, message: "Username or password is invalid."});

        let user = {
            _id: userExists._id,
            username: userExists.username,
            password: userExists.password,
            favorites: userExists.favorites,
            image: userExists.image,
            messages: userExists.messages
        }

        const token = jwt.sign(user, process.env.SECRET_KEY)
        const posts = await postSchema.find()

        return res.send({message: "Logged in successfully!", token: token, user, posts})
    },
    changeImage: async (req, res) => {
        const {user, image} = req.body

        const updatedUser = await userSchema.findOneAndUpdate(
            {username: user.username},
            {$set: {image: image}},
            {new: true, projection: {password: 0}}
        )

        return res.send({message: "Image was changed!", updatedUser})
    },
    allPosts: async (req, res) => {
        const posts = await postSchema.find()

        res.send(posts)
    },
    createPost: async (req, res) => {
        const {user, title, description, image, time} = req.body;

        const post = {
            username: user.username,
            authorId: user._id,
            title: title,
            description: description,
            image: image,
            time: time
        }

        const newPost = new postSchema(post)
        await newPost.save()

        const posts = await postSchema.find()

        res.send({message: "Post created successfully!", posts});
    },
    deletePost: async (req, res) => {
        const postId = req.params.postId;

        await postSchema.findOneAndDelete({_id: postId})

        const posts = await postSchema.find()

        res.send({message: "Post deleted.", error: false, posts})
    },
    editPost: async (req, res) => {
        const {title, description, image} = req.body;

        const postId = req.params.postId;

        await postSchema.findOneAndUpdate(
            {_id: postId},
            {
                $set: {
                    image, title, description
                }
            }
        )

        const posts = await postSchema.find()
        return res.send({message: "Post updated!", posts})
    },
    changeUsername: async (req, res) => {
        const {newUsername, user} = req.body

        if (newUsername === "") return res.send({error: true, message: "Username field cannot be empty!"});

        const usernameExists = await userSchema.findOne({username: newUsername})
        if (usernameExists) return res.send({error: true, message: "Username is occupied!"});

        const updatedUser = await userSchema.findOneAndUpdate(
            {_id: user._id},
            {$set: {username: newUsername}},
            {new: true, projection: {password: 0}}
        )

        // Updating new user posts and favorites
        await postSchema.updateMany(
            { authorId: user._id },
            { $set: { username: newUsername } }
        );

        await userSchema.updateMany(
            { "favorites.authorId": user._id },
            { $set: { "favorites.$[post].username": newUsername } },
            { arrayFilters: [{ "post.authorId": user._id }] }
        );

        // Updating new user messages
        await userSchema.updateMany(
            { "messages.senderId": user._id },
            { $set: { "messages.$[message].sender": newUsername } },
            { arrayFilters: [{ "message.senderId": user._id }] }
        );

        // Updating new user comments
        await postSchema.updateMany(
            { "comments.commenterId": user._id },
            { $set: { "comments.$[comment].commenter": newUsername } },
            { arrayFilters: [{ "comment.commenterId": user._id }] }
        );

        return res.send({message: "Username was changed!", updatedUser})
    },
    changePassword: async (req, res) => {
        const {newPassword, user} = req.body

        const userExists = await userSchema.findOne({username: user.username})
        if (!userExists) return res.send({error: true, message: "User does not exist!"});

        if(newPassword === "")
            return res.send({error: true, message: "Password field cannot be empty!"})
        if(newPassword.length < 4 || newPassword.length > 20)
            return res.send({error: true, message: "Password must be 4 - 20 symbols long."})

        const salt = await bcrypt.genSalt(5)
        const hash = await bcrypt.hash(newPassword, salt)

        const updatedUser = await userSchema.findOneAndUpdate(
            {_id: user._id},
            {$set: {password: hash}},
            {new: true, projection: {password: 0}}
        )

        return res.send({message: "Password was changed!", updatedUser})
    },
    addToFavorites: async (req, res) => {
        const {user} = req.body;
        const postId = req.params.postId
        const postObjectId = new mongoose.Types.ObjectId(postId); // PostId from string to dbId

        const userWithFavorite = await userSchema.findOne({
            username: user.username,
            favorites: { $elemMatch: { _id: postObjectId } }
        });

        if (userWithFavorite) {
            return res.send({error: true, message: "Post is already in your Favorites!"});
        }

        const chosenPost = await postSchema.findOne({ _id: postObjectId })

        const updatedUser = await userSchema.findOneAndUpdate(
            {username: user.username},
            {$push: { favorites: chosenPost } },
            {new: true, projection: {password: 0}}
        )

        res.send(updatedUser)
    },
    removeFavorite: async (req, res) => {
        const {user} = req.body;
        const postId = req.params.postId

        const chosenPost = await postSchema.findOne({ _id: postId })
        if (!chosenPost) return res.send({error: true, message: "Post not found!"});

        const updatedUser = await userSchema.findOneAndUpdate(
            {_id: user._id},
            {$pull: { favorites: chosenPost } },
            {new: true, projection: {password: 0}}
        )

        res.send({message: "Favorite post was removed!", updatedUser});
    },
    allFavorites: async (req, res) => {
        const {user} = req.body;

        const userExists = await userSchema.findOne({_id: user._id});
        if (!userExists) return res.status(404).json({ error: 'User not found' });

        const favorites = userExists.favorites

        res.send(favorites)
    },
    singleUser: async (req, res) => {
        const username = req.params.username

        const userExists = await userSchema.findOne({username});
        const userPosts = await postSchema.find({username})

        res.send({userExists, userPosts})
    },
    singlePost: async (req, res) => {
        const postId = req.params.postId

        const postExists = await postSchema.findOne({_id: postId});

        res.send(postExists)
    },
    comment: async (req, res) => {
        const {commenter, commenterId, text, postId} = req.body

        const postExists = await postSchema.findOne({_id: postId});
        if (!postExists) return res.send({error: true, message: "Post doesn't exist!"});

        if (text === "") return res.send({error: true, message: "Text field cannot be empty!"});

        const newComment = {
            commenter, commenterId, text
        }

        const updatedPost = await postSchema.findOneAndUpdate(
            {_id: postId},
            {$push: { comments: newComment }},
            {new: true}
        )

        res.send(updatedPost)
    },
    sendMessage: async (req, res) => {
        const {sender, receiver, message, time, user} = req.body;
        const onlineUsers = usersOnline.userIsOnline(receiver);
        if (!onlineUsers) return res.send({error: true, message: "User is offline!"});

        if (message === "") return res.send({error: true, message: "Message field cannot be empty!"});

        const messageInfo = {
            id: uid(),
            sender,
            senderId: user._id,
            receiver,
            message,
            time
        }

        const updatedUser = await userSchema.findOneAndUpdate(
            {username: receiver},
            {$push: { messages: messageInfo }},
            {new: true}
        )

        const selectedUser = usersOnline.getUser(receiver);
        io.to(selectedUser.id).emit("messageReceived", updatedUser)

        res.send({error: false, message: "Message sent!", updatedUser})
    },
    deleteMessage: async (req, res) => {
        const {messageId, receiver} = req.body;

        const updatedUser = await userSchema.findOneAndUpdate(
            {username: receiver},
            {$pull: { messages: { id: messageId } } },
            {new: true, projection: {password: 0}}
        )

        res.send(updatedUser.messages)
    }
    // deleteAccount: async (req, res) => {
    //     const {password, user} = req.body
    //
    //     const samePassword = await bcrypt.compare(password, user.password);
    //     if (!samePassword) return res.send({error: true, message: "Password is incorrect!"});
    //
    //     // FIND AND DELETE SUBSCRIBER AND FAVORITE
    //     await userSchema.updateMany(
    //         { "favorites.username": user.username },
    //         {
    //             $pull: { favorites: { username: user.username } },
    //             $inc: { subscribers: -1 }
    //         },
    //         {new: true}
    //     )
    //
    //     await userSchema.findOneAndDelete({username: user.username});
    //
    //     res.send({error:false, message: "Account deleted!"})
    // },
    // notifications: async (req, res) => {
    //     const {user} = req.body
    //
    //     const notifications = await notificationSchema.find({username: user.username});
    //     res.send({ notifications })
    // },
    // deleteNotification: async (req, res) => {
    //     const {user} = req.body
    //     const notificationId = req.params.id
    //
    //     await notificationSchema.findOneAndDelete({_id: notificationId})
    //
    //     const notifications = await notificationSchema.find({username: user.username});
    //
    //     res.send({error: false, message: "Notification was deleted!", notifications})
    // }
}