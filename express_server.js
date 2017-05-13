const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.set("view engine", "ejs");

// use middlewares
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['secret'],
  maxAge: 24 * 60 * 60 * 1000
}));

// Variable where url will be stored with the shortened and full URL
const urlDatabase = {};

// Variable where users will be stored with user ID, E-mail address, hashed password.
const users = {};

// Function that generates a 6-characting random string
function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i += 1 ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Get the value/s of urls from the urlDatabase object
function getUrls() {
  const compiledUrls = [];
  for (let k in urlDatabase) {
    compiledUrls.push(k);
  }
  return compiledUrls;
}

// Get the value/s from users object
function getIds() {
  const compiledIds = [];
  for (let k in users) {
    compiledIds.push(k);
  }
  return compiledIds;
}

// Compiled the urls for a specific user
function urlsForUser(id) {
  const compiledUrlsForUser = [];
  for (let k in urlDatabase) {
    if (urlDatabase[k].userId === id){
      compiledUrlsForUser.push(k);
    }
  }
  return compiledUrlsForUser;
}

// Show /url page
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  let templateVars = { user_id: req.session.user_id,
    user: users
  };
  if (!templateVars.user_id) {
    res.status(400);
    res.send("Unauthorized. Log-in or Register first before proceeding");
    return;
  }
  // Comparing and getting the urls under the user logged-in
  let userUrls = urlsForUser(templateVars.user_id);
  let userUrlDatabase = {};
  for (let i in userUrls) {
    for (let j in urlDatabase) {
      if (userUrls[i] === j) {
        userUrlDatabase[j] = urlDatabase[j];
      }
    }
  }
  templateVars.urls = userUrlDatabase;
  res.render("urls_index", templateVars);
});

// Create-new-URL-to-be-shoretened page
app.get("/urls/new", (req, res) => {
  let templateVars = { user_id: req.session.user_id,
    user: users
  };
  if (!templateVars.user_id) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// Generate new shortURL and redirects to that new page
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { userId: req.session.user_id, url: req.body.longURL }
  res.redirect(`/urls/${shortURL}`);
});

//Go to /url/shorURL page
app.get("/urls/:id", (req, res) => {
  let matching_urls = getUrls().find(url => url === req.params.id);
  if (!matching_urls) {
    res.status(404);
    res.send("URL not found.");
    return;
  }
  let templateVars = { user_id: req.session.user_id,
    user: users,
    shortURL: req.params.id
  };
  if (!templateVars.user_id) {
    res.status(400);
    res.send("Unauthorized. Log-in or Register first before proceeding");
    return;
  }
  // Comparing and getting the urls under the user logged-in
  let userUrls = urlsForUser(templateVars.user_id);
  let userUrlDatabase = {};
  for (let i in userUrls) {
    for (let j in urlDatabase) {
      if (userUrls[i] === j) {
        userUrlDatabase[j] = urlDatabase[j];
      }
    }
  }
  // Checking if the shortUrl is under the user logged-in
  templateVars.longURL = urlDatabase[req.params.id].url;
  if (!(templateVars.user_id === urlDatabase[req.params.id].userId)) {
    res.status(400);
    res.send("Unauthorize to access page.");
    return;
  }
  res.render("urls_show", templateVars);
});

// Edit the set URL of a shortened-url
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  urlDatabase[shortURL].url = req.body.longURL;
  res.redirect("/urls");
});

// Delete a url in database
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// Redirect immediately to the real URL set
app.get("/u/:shortURL", (req, res) => {
  let matching_urls = getUrls().find(url => url === req.params.shortURL);
  if (!matching_urls) {
    res.status(404);
    res.send("URL not found.");
    return;
  }
  let longURL = urlDatabase[req.params.shortURL].url;
  res.redirect(longURL);
});

// Log-in page
app.get("/login", (req, res) => {
  let templateVars = { user_id: req.session.user_id,
    user: users
  };
  res.render("urls_login", templateVars);
});

// Add login to cookies
app.post("/login", (req, res) => {
  // Check if email is in DB.
  let matching_userId = getIds().find(id => users[id].email === req.body.email);
  if (!matching_userId) {
    res.status(403);
    res.send("Incorrect E-mail and/or Password!");
  // Check if password is correct with the email.
  } else if (!(bcrypt.compareSync(req.body.password, (users[matching_userId].password)))) {
    res.status(403);
    res.send("Incorrect E-mail and/or Password!!");
  } else {
    req.session.user_id = matching_userId;
    res.redirect("/urls");
  }
});

// Remove cookies and logs-out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Registration page
app.get("/register", (req, res) => {
  let templateVars = { user_id: req.session.user_id,
    user: users
  };
  if (templateVars.user_id) {
    res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  let emailReq = req.body.email;
  let hashed_password = bcrypt.hashSync(req.body.password, 10);
  if (!(emailReq && req.body.password)) {
    res.status(400);
    res.send('Please fill in email and/or password.');
    return;
  } else if (getIds().find(id => users[id].email === emailReq)) {
    res.status(400);
    res.send('E-mail Address already used.');
    return;
  }
  // Register the new users
  let newId = generateRandomString();
  users[newId] = { id: newId, email: emailReq, password: hashed_password};
  req.session.user_id = newId;
  res.redirect("/urls");
});

// Listen to the stated PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});