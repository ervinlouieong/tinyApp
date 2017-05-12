
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
  "b2xvn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
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

// function getEmailVal() {
//   const compiledEmails = [];
//   for (let k in users) {
//     compiledEmails.push(users[k].email);
//   };
//   return compiledEmails;
// };

function getIds() {
  const compiledIds = [];
  for (let k in users) {
    compiledIds.push(k);
  };
  return compiledIds;
};

// function findUserBy(fn) {
//   for (let uid in users) {
//     if (fn(users[uid])) {
//       return users[uid];
//     }
//   }
// }


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
                       user: users,
                       urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Create-new-URL-to-be-shoretened page
app.get("/urls/new", (req, res) => {
  let templateVars = { user_id: req.cookies["user_id"],
                      user: users
                     };
  res.render("urls_new", templateVars);
});

// Generate new shortURL and redirects to that new page
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

//Go to /url/shorURL page
app.get("/urls/:id", (req, res) => {
  // console.log(urlDatabase[req.params.id],req.params.id)
  //   if (urlDatabase[req.params.id] !== req.params.id) {
  //     res.status(404);
  //     res.send('URL not used');
  //     return;
  //   };

    let templateVars = { user_id: req.cookies["user_id"],
                         user: users,
                         shortURL: req.params.id,
                         longURL: urlDatabase[req.params.id]
                       };
    res.render("urls_show", templateVars);
});

// Redirect immediately to the real URL set
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
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
  urlDatabase[shortURL] = req.body.longURL;
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
  // var user = findUserBy(user => user.email === req.body.email);
  if(!matching_userId) {
    res.status(403);
    res.send("Incorrect E-mail and/or Password!");
  } else if (!users[matching_userId].password === req.body.password) {
    // Check if password is correct with the email.
    res.status(403);
    res.send("Incorrect E-mail and/or Password!");
  } else {
    res.cookie("user_id", matching_userId);
    res.redirect("/");
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


