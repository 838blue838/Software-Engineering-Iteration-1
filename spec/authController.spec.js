// const authController = require("../src/controllers/authController");
// const userService = require("../src/services/userService");

// describe("authController", () => {
//   beforeEach(() => {
//     userService.clearUsers();
//   });

//   function makeRes() {
//     const res = {};

//     res.redirect = jasmine.createSpy("redirect");
//     res.send = jasmine.createSpy("send");
//     res.status = jasmine.createSpy("status").and.callFake(() => res);

//     return res;
//   }

//   it("signup stores session user and redirects", () => {
//     const req = {
//       body: { username: "bob", password: "Password1" },
//       session: {}
//     };

//     const res = makeRes();

//     authController.signup(req, res);

//     expect(req.session.user.username).toBe("bob");
//     expect(res.redirect).toHaveBeenCalledWith("/dashboard");
//   });

//   it("login rejects invalid credentials", () => {
//     const req = {
//       body: { username: "bob", password: "Password1" },
//       session: {}
//     };

//     const res = makeRes();

//     authController.login(req, res);

//     expect(res.status).toHaveBeenCalledWith(401);
//     expect(res.send).toHaveBeenCalledWith("Invalid username or password.");
//   });

//   it("login stores session user when credentials are valid", () => {
//     userService.createUser("bob", "Password1");

//     const req = {
//       body: { username: "bob", password: "Password1" },
//       session: {}
//     };

//     const res = makeRes();

//     authController.login(req, res);

//     expect(req.session.user.username).toBe("bob");
//     expect(res.redirect).toHaveBeenCalledWith("/dashboard");
//   });
// });

const authController = require("../src/controllers/authController");
const userService = require("../src/services/userService");

describe("authController", () => {

  beforeEach(async () => {
    await userService.clearUsers();
  });

  function makeRes() {
    const res = {};

    res.redirect = jasmine.createSpy("redirect");
    res.send = jasmine.createSpy("send");
    res.status = jasmine.createSpy("status").and.callFake(() => res);

    return res;
  }

  it("signup stores session user and redirects", async () => {
    const req = {
      body: { username: "bob", password: "Password1" },
      session: {}
    };

    const res = makeRes();

    await authController.signup(req, res);

    expect(req.session.user.username).toBe("bob");
    expect(res.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("login rejects invalid credentials", async () => {
    const req = {
      body: { username: "bob", password: "Password1" },
      session: {}
    };

    const res = makeRes();

    await authController.login(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      jasmine.stringContaining("/login?error=")
    );
  });

  it("login does not set session on failed login", async () => {
    const req = {
      body: { username: "bob", password: "Password1" },
      session: {}
    };

    const res = makeRes();

    await authController.login(req, res);

    expect(req.session.user).toBeUndefined();
  });

  it("login stores session user when credentials are valid", async () => {
    await userService.createUser("bob", "Password1");

    const req = {
      body: { username: "bob", password: "Password1" },
      session: {}
    };

    const res = makeRes();

    await authController.login(req, res);

    expect(req.session.user.username).toBe("bob");
    expect(res.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("logout clears session and redirects to /", (done) => {
    const req = {
      session: {
        user: { username: "bob", authProvider: "local" },
        destroy: jasmine.createSpy("destroy").and.callFake((cb) => {
          req.session.user = undefined;
          cb();
        })
      },
      app: { locals: { baseUrl: "http://localhost:3000", casBaseUrl: "https://cas.rutgers.edu" } }
    };

    const res = makeRes();
    res.redirect = jasmine.createSpy("redirect").and.callFake(() => {
      expect(req.session.user).toBeUndefined();
      expect(res.redirect).toHaveBeenCalledWith("/");
      done();
    });

    authController.logout(req, res);
  });

  it("casCallback returns 400 when ticket is missing", async () => {
    const req = {
      query: {},
      app: { locals: { baseUrl: "http://localhost:3000", casBaseUrl: "https://cas.rutgers.edu" } }
    };

    const res = makeRes();

    await authController.casCallback(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Missing CAS ticket.");
  });

});
