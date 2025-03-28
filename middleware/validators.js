module.exports = {

    validateRegistration: (req, res, next) => {
        const {username, passwordOne, passwordTwo} = req.body;

        if(username === "")
            return res.send({error: true, message: "Username field must be filled."})
        if(username.length < 4 || username.length > 20)
            return res.send({error: true, message: "Username must be 4 - 20 symbols long."})

        if(passwordOne === "")
            return res.send({error: true, message: "Password is required."})
        if(passwordOne.length < 4 || passwordOne.length > 20)
            return res.send({error: true, message: "Password must be 4 - 20 symbols long."})

        if(passwordTwo === "")
            return res.send({error: true, message: "Confirm password is required."})
        if(passwordOne !== passwordTwo)
            return res.send({error: true, message: "Passwords does not match."})

        next()
    },
    validateLogin: (req, res, next) => {
        const {username, password} = req.body;

        if(username === "")
            return res.send({error: true, message: "Username field must be filled."})
        if(username.length < 4 || username.length > 20)
            return res.send({error: true, message: "Username must be 4 - 20 symbols long."})

        if(password === "")
            return res.send({error: true, message: "Password is required."})
        if(password.length < 4 || password.length > 20)
            return res.send({error: true, message: "Password must be 4 - 20 symbols long."})

        next()
    },

    validatePost: (req, res, next) => {
        const {title, description, image} = req.body;

        if(title === "")
            return res.send({error: true, message: "Title field must be filled."})
        if(title.length < 10)
            return res.send({error: true, message: "Title must be at least 10 symbols long."})

        if(description === "")
            return res.send({error: true, message: "Description is required."})
        if(description.length < 10)
            return res.send({error: true, message: "Description must be at least 10 symbols long."})

        if(image === "")
            return res.send({error: true, message: "Image is required."})

        next()
    }

}