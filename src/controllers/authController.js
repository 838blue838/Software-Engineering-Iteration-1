const userService = require("../services/userService");
const { parseStringPromise } = require("xml2js");

function getCasConfig(req) {
  const baseUrl = req.app.locals.baseUrl;
  const casBaseUrl = req.app.locals.casBaseUrl;

  return {
    baseUrl,
    casBaseUrl,
    serviceUrl: `${baseUrl}/api/auth/cas/callback`,
    loginUrl: `${casBaseUrl}/login`,
    logoutUrl: `${casBaseUrl}/logout`,
    validateUrl: `${casBaseUrl}/serviceValidate`
  };
}

function signup(req, res) {
  const { username, password } = req.body;

  try {
    const user = userService.createUser(username, password);
    req.session.user = { id: user.id, username: user.username, authProvider: "local" };
    return res.redirect("/dashboard");
  } catch (error) {
    return res.status(400).send(error.message);
  }
}

function login(req, res) {
  const { username, password } = req.body;
  const user = userService.validateUser(username, password);

  if (!user) {
    return res.status(401).send("Invalid username or password.");
  }

  req.session.user = { id: user.id, username: user.username, authProvider: "local" };
  return res.redirect("/dashboard");
}

function logout(req, res) {
  const { logoutUrl, baseUrl } = getCasConfig(req);
  const currentUser = req.session.user;

  req.session.destroy(() => {
    if (currentUser && currentUser.authProvider === "cas") {
      return res.redirect(`${logoutUrl}?url=${encodeURIComponent(baseUrl)}`);
    }
    return res.redirect("/");
  });
}

function casLogin(req, res) {
  const { loginUrl, serviceUrl } = getCasConfig(req);
  return res.redirect(`${loginUrl}?service=${encodeURIComponent(serviceUrl)}`);
}

async function casCallback(req, res) {
  const { ticket } = req.query;
  const { validateUrl, serviceUrl } = getCasConfig(req);

  if (!ticket) {
    return res.status(400).send("Missing CAS ticket.");
  }

  try {
    const url =
      `${validateUrl}?service=${encodeURIComponent(serviceUrl)}` +
      `&ticket=${encodeURIComponent(ticket)}`;

    const response = await fetch(url);
    const xml = await response.text();

    const parsed = await parseStringPromise(xml, { explicitArray: false });
    const serviceResponse = parsed["cas:serviceResponse"];

    if (!serviceResponse || serviceResponse["cas:authenticationFailure"]) {
      return res.status(401).send("CAS authentication failed.");
    }

    const authSuccess = serviceResponse["cas:authenticationSuccess"];
    const netid = authSuccess && authSuccess["cas:user"];

    if (!netid) {
      return res.status(401).send("CAS user not found in validation response.");
    }

    let user = userService.findUserByUsername(netid);

    if (!user) {
      user = userService.createUser(netid, "CAS_AUTH_ONLY");
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      authProvider: "cas"
    };

    return res.redirect("/dashboard");
  } catch (error) {
    console.error("CAS callback error:", error);
    return res.status(500).send("CAS validation error.");
  }
}

module.exports = {
  signup,
  login,
  logout,
  casLogin,
  casCallback
};