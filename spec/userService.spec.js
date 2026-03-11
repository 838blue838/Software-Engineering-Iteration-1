const userService = require("../src/services/userService");

describe("userService", () => {
  beforeEach(() => {
    userService.clearUsers();
  });

  it("creates a new user successfully", () => {
    const user = userService.createUser("alice", "1234");

    expect(user.username).toBe("alice");
    expect(user.id).toBe(1);
  });

  it("throws an error if username is missing", () => {
    expect(() => {
      userService.createUser("", "1234");
    }).toThrowError("Username and password are required.");
  });

  it("throws an error if password is missing", () => {
    expect(() => {
      userService.createUser("alice", "");
    }).toThrowError("Username and password are required.");
  });

  it("throws an error if user already exists", () => {
    userService.createUser("alice", "1234");

    expect(() => {
      userService.createUser("alice", "abcd");
    }).toThrowError("User already exists.");
  });

  it("validates a correct username and password", () => {
    userService.createUser("alice", "1234");

    const user = userService.validateUser("alice", "1234");
    expect(user).not.toBeNull();
    expect(user.username).toBe("alice");
  });

  it("returns null for invalid credentials", () => {
    userService.createUser("alice", "1234");

    const user = userService.validateUser("alice", "wrong");
    expect(user).toBeNull();
  });
});
