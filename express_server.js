
const express = require("express");
const app = express();
let PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

let urlDatabase = {
  "b2xvn2": "http://www.lighthouselabs.ca",
  "9sm5xk": "http://www.google.com"
};

// function checkURLexist() {
//   for (let i in urlDatabase) {
//     if (!urlDatabase[i]) {
//     res.status(404);
//     res.send('URL not used');
//     return;
//     };
//   };
// };

function generateRandomString() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i = 0; i < 6; i += 1 ) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  };
  return text;
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body><i>Hello</i> <b>World</b></body></html>\n")
});

// Show /url page
app.get("/urls", (req, res) => {
  let templateVars = { username: req.cookies["username"],
                       urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// Create-new-URL-to-be-shoretened page
app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"]};
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
  let templateVars = { username: req.cookies["username"],
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

app.post("/login", (req, res) => {
  res.cookie("username",req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

// Listen to the stated PORT
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


