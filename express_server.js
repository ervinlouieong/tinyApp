
const express = require("express");
const app = express();
let PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

// Set middlewares
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// initial database
const urlDatabase = {
  "b2xvn2": {userId: "userRandomID",
            url: "http://www.lighthouselabs.ca"},
  "9sm5xk": {userId: "userRandomID",
            url: "http://www.google.com"},
  "qwert1": {userId: "user2RandomID",
            url: "http://www.nike.ca"},
  "asdfg2": {userId: "thatsMe",
            url: "http://www.imhungry.now"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "thatsMe": {
    id: "thatsMe",
    email: "feedme@now.com",
    password: "1234"
  }
};

function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i += 1 ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  };
  return text;
};


function getUrls() {
  const compiledUrls = [];
  for (let k in urlDatabase) {
    compiledUrls.push(k);
  };
  return compiledUrls;
};

function getIds() {
  const compiledIds = [];
  for (let k in users) {
    compiledIds.push(k);
  };
  return compiledIds;
};


function urlsForUser(id) {
  const compiledUrlsForUser = [];
  for (let k in urlDatabase) {
    if (urlDatabase[k].userId === id){
      compiledUrlsForUser.push(k);
    };
  };
  return compiledUrlsForUser;
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.end("<html><body><i>Hello</i> <b>World</b></body></html>\n")
// });

// Show /url page
app.get("/urls", (req, res) => {
  let templateVars = { user_id: req.cookies["user_id"],
                       user: users
                     };
  if(!templateVars.user_id) {
    res.status(400);
    res.send("Unauthorized. Log-in or Register first before proceeding");
    return;
  };
  let userUrls = urlsForUser(templateVars.user_id);
  let userUrlDatabase = {};
  for (let i in userUrls) {
    for (let j in urlDatabase) {
      if(userUrls[i] === j) {
        userUrlDatabase[j] = urlDatabase[j];
      }
    }
  }
  templateVars.urls = userUrlDatabase;
  res.render("urls_index", templateVars);
});

// Create-new-URL-to-be-shoretened page
app.get("/urls/new", (req, res) => {
  let templateVars = { user_id: req.cookies["user_id"],
                      user: users
                     };
  if(!templateVars.user_id) {
    res.redirect("/login");
  };
  res.render("urls_new", templateVars);
});

// Generate new shortURL and redirects to that new page
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].userId = req.cookies["user_id"];
  urlDatabase[shortURL].url = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//Go to /url/shorURL page
app.get("/urls/:id", (req, res) => {
  let matching_urls = getUrls().find(url => url === req.params.id);
  if(!matching_urls) {
    res.status(404);
    res.send("URL not found.");
    return;
  };
  let templateVars = { user_id: req.cookies["user_id"],
                         user: users,
                         shortURL: req.params.id
                       };
  if(!templateVars.user_id) {
    res.status(400);
    res.send("Unauthorized. Log-in or Register first before proceeding");
    return;
  };
  let userUrls = urlsForUser(templateVars.user_id);
  let userUrlDatabase = {};
  for (let i in userUrls) {
    for (let j in urlDatabase) {
      if(userUrls[i] === j) {
        userUrlDatabase[j] = urlDatabase[j];
      }
    }
  }
  templateVars.longURL = urlDatabase[req.params.id].url;
  if(!(templateVars.user_id === urlDatabase[req.params.id].userId)) {
    res.status(400);
    res.send("Unauthorize to access page.");
    return;
  };
  res.render("urls_show", templateVars);
});

// Redirect immediately to the real URL set
app.get("/u/:shortURL", (req, res) => {
  let matching_urls = getUrls().find(url => url === req.params.shortURL);
  if(!matching_urls) {
    res.status(404);
    res.send("URL not found.");
    return;
  };
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

// Delete a url in database
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
});

// Edit the set URL of a shortened-url
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  urlDatabase[shortURL].url = req.body.longURL;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let templateVars = { user_id: req.cookies["user_id"],
                       user: users
                     };
  res.render("urls_login", templateVars);
});


// Add login to cookies
app.post("/login", (req, res) => {
  // Check if email is in DB.
  var matching_userId = getIds().find(id => users[id].email === req.body.email);
  if(!matching_userId) {
    res.status(403);
    res.send("Incorrect E-mail and/or Password!");
  } else if (!(users[matching_userId].password === req.body.password)) {
    // Check if password is correct with the email.
    res.status(403);
    res.send("Incorrect E-mail and/or Password!");
  } else {
    res.cookie("user_id", matching_userId);
    res.redirect("/urls");
  };
});

// Remove cookies and logs-out
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Registration page
app.get("/register", (req, res) => {
  let templateVars = { user_id: req.cookies["user_id"],
                       user: users
                     };
  res.render("urls_register", templateVars)
});

app.post("/register", (req,res) => {
  let emailReq = req.body.email;
  let passwordReq = req.body.password;
  if (!(emailReq && passwordReq)) {
    res.status(400);
    res.send('Please fill in email and/or password.');
    return;
  } else if (getIds().find(id => users[id].email === emailReq)) {
    res.status(400);
    res.send('E-mail Adress already used.');
    return;
  }
  let newId = generateRandomString();
  users[newId] = {};
  users[newId].id = newId;
  users[newId].email = emailReq;
  users[newId].password = passwordReq;
  res.cookie("user_id", newId);
  res.redirect("/urls");
});

// Listen to the stated PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


