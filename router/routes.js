const express = require('express');
const router = express.Router();

const {
    register,
    login,
    changeImage,
    createPost,
    allPosts,
    deletePost,
    editPost,
    changeUsername,
    changePassword,
    addToFavorites,
    allFavorites,
    removeFavorite,
    singleUser,
    singlePost,
    comment,
    sendMessage,
    deleteMessage
} = require('../controllers/mainControllers');

const {
    validateRegistration,
    validateLogin,
    validatePost
} = require('../middleware/validators');

const userAuth = require('../middleware/userAuth');

router.post("/register", validateRegistration, register)
router.post("/login", validateLogin, login)
router.post("/changeImage", userAuth, changeImage)
router.post("/create", userAuth, validatePost, createPost)
router.get("/allPosts", userAuth, allPosts)
router.post("/delete/:postId", userAuth, deletePost)
router.post("/edit/:postId", userAuth, editPost)
router.post("/changeUsername", userAuth, changeUsername)
router.post("/changePassword", userAuth, changePassword)
router.post("/addFavorite/:postId", userAuth, addToFavorites)
router.post("/removeFavorite/:postId", userAuth, removeFavorite)
router.get("/favorites", userAuth, allFavorites)
router.get("/singleUser/:username", userAuth, singleUser)
router.get("/singlePost/:postId", userAuth, singlePost)
router.post("/comment", userAuth, comment)
router.post("/sendMessage", userAuth, sendMessage)
router.post("/deleteMessage", userAuth, deleteMessage)

module.exports = router;