const express = require("express");
const mustacheExpress = require("mustache-express");
const bodyParser = require("body-parser");
const validator = require("express-validator");
const session = require("express-session");
const path = require("path");
const morgan = require("morgan");

const app = express();
app.use("/public", express.static(path.join(__dirname, "public")));
app.engine("mustache", mustacheExpress());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "mustache");

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());

app.use(morgan("dev"));

// create a data structure for holding user information
var buttonClicks = 0;
var usersArray = [{ name: "admin", pwd: "hello" }];


//this is the guard function
function guard(req, res, next) {
    // if we have a user logged in...
    if (req.session.user) {
        // ... pass on to the next function
        next();
    } else {
        // error out
        res.render("login", { errors: "You must log in to see this page." });
    }
};

//this is the validate user function
function validateUser(req, res) {
    // this is a user defined validation routine to confirm
    // requirements of the signup page

    //check to see if username meets criteria
    req.checkBody("username", "Username must be all letters, minimum 3 characters.").notEmpty().isAlpha().isLength({ min: 3, max: 20 });
    //check to see if password field matches confirmation text field
    req.checkBody("password", "Password and Confirmation do not match.").equals(req.body.confirmation);
    //check to see if password meets criteria
    req.checkBody("password", "Password doesn't meet criteria.").notEmpty().isAlpha().isLength({ min: 3, max: 20 });

    let errors = req.validationErrors();
    return errors;

};

function checkSignup(arrayOfUsers, username, password) {
    let validUser = false;
    arrayOfUsers.forEach(function (item) {
        if (item.name == username && item.pwd == password) {
            validUser = true;
        }
    });

    return validUser;
}

/*
// GET actions
*/

app.get("/", guard, function (req, res) {
    res.render('index', { user: req.session.user.name });
})

app.get("/signup", function (req, res) {
    res.render('signup');
})

app.get("/login", function (req, res) {
    res.render('login', { errors: "" });
})

app.get('/logout', function (req, res) {
    req.session.destroy();
    buttonClicks = 0;
    res.render('login');
});

/*
//  POST actions
*/

app.post("/", function (req, res) {  
    buttonClicks += 1
    res.render("index", {buttonNumbers: buttonClicks, user: req.session.user.name})  
})

app.post("/login", function (req, res) {
    let username = req.body.username
    let password = req.body.password
    // see if the user is in the array
    let validUser = false;
    validUser = checkSignup(usersArray, username, password);
    // if the user is in the array
    // update the session object
    if (validUser) {
        req.session.user = { name: username };
        res.redirect("/");
    }
    // otherwise give the bad news
    else {
        res.render("login", { errors: "Please enter a valid user name and password." })
    }
})

app.post('/signup', function (req, res) {
    // validate the user input
    let validateErrors = validateUser(req, res);

    // if the signup validation is successful, then...
    if (!validateErrors) {
        // make sure the user that is being created does not already exist
        let alreadyUser = false;
        alreadyUser = checkSignup(usersArray, req.body.username, req.body.password);
        if (alreadyUser) {
            //username and password are already in the database
            res.render('signup', { errors: "Username and password are already registered." })
        } else {
            //username and password aren't in the database
            usersArray.push({ name: req.body.username, pwd: req.body.password })
            //make a session with the logged in user that was just created
            req.session.user = { name: req.body.username, pwd: req.body.password };
            // send newly created user to home page
            res.redirect('/');
        }
    }
    // validation at signup was NOT successful, so report errors and retry...
    else {
        //redirect back to signup page
        let errorMessages = [];
        validateErrors.forEach(function (param) {
            errorMessages.push(param.msg);
        });
        //display message to user
        res.render('signup', { errors: errorMessages });
    }
});






app.listen(3000, function () {
    console.log("Server up.");
});