const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const userToken = req.headers.authorization;

    jwt.verify(userToken, process.env.SECRET_KEY, async (err,item) => {

        if (err) return res.send({error: true, message: "Error opening token."});
        if (!item) return res.send({error: true, message: "Token item not found"});

        req.body.user = item

        next()
    })

}