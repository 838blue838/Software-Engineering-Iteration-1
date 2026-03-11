const authController = require("../src/controllers/authController");
const userService = require("../src/services/userService");

describe("authController", () => {
  beforeEach(() => {
    userService.clearUsers();
  });

  function makeRes() {
    const res = {};

    res.redirect = jasmine.createSpy("redirect");
    res.send = jasmine.createSpy("send");
    res.status = jasmine.createSpy("status").and.callFake(() => res);

    return res;
  }

  it("signup stores session user and redirects", () => {
    const req = {
      body: { username: "bob", password: "pass" },
      session: {}
    };

    const res = makeRes();

    authController.signup(req, res);

    expect(req.session.user.username).toBe("bob");
    expect(res.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("login rejects invalid credentials", () => {
    const req = {
      body: { username: "bob", password: "wrong" },
      session: {}
    };

    const res = makeRes();

    authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith("Invalid username or password.");
  });

  it("login stores session user when credentials are valid", () => {
    userService.createUser("bob", "pass");

    const req = {
      body: { username: "bob", password: "pass" },
      session: {}
    };

    const res = makeRes();

    authController.login(req, res);

    expect(req.session.user.username).toBe("bob");
    expect(res.redirect).toHaveBeenCalledWith("/dashboard");
  });
});