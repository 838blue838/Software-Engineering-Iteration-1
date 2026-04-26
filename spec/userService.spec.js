// const userService = require("../src/services/userService");

// describe("userService", () => {
//   beforeEach(() => {
//     userService.clearUsers();
//   });

//   it("creates a new user successfully", () => {
//     const user = userService.createUser("alice", "Password1");

//     expect(user.username).toBe("alice");
//     expect(user.id).toBe(1);
//   });

//   it("throws an error if username is missing", () => {
//     expect(() => {
//       userService.createUser("", "Password1");
//     }).toThrowError("Username and password are required.");
//   });

//   it("throws an error if password is missing", () => {
//     expect(() => {
//       userService.createUser("alice", "");
//     }).toThrowError("Username and password are required.");
//   });

//   it("throws an error if user already exists", () => {
//     userService.createUser("alice", "Password1");

//     expect(() => {
//       userService.createUser("alice", "Password1");
//     }).toThrowError("User already exists.");
//   });

//   it("validates a correct username and password", () => {
//     userService.createUser("alice", "Password1");

//     const user = userService.validateUser("alice", "Password1");
//     expect(user).not.toBeNull();
//     expect(user.username).toBe("alice");
//   });

//   it("returns null for invalid credentials", () => {
//     userService.createUser("alice", "Password1");

//     const user = userService.validateUser("alice", "wrong");
//     expect(user).toBeNull();
//   });
// });

const userService = require("../src/services/userService");

describe("userService", () => {

  beforeEach(async () => {
    await userService.clearUsers();
  });

  it("creates a new user successfully", async () => {
    const user = await userService.createUser("alice", "Password1");

    expect(user.username).toBe("alice");
    expect(user.id).toBeDefined();
  });

  it("throws an error if username is missing", async () => {
    try {
      await userService.createUser("", "Password1");
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toBe("Username and password are required.");
    }
  });

  it("throws an error if password is missing", async () => {
    try {
      await userService.createUser("alice", "");
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toBe("Username and password are required.");
    }
  });

  it("throws an error if user already exists", async () => {
    await userService.createUser("alice", "Password1");

    try {
      await userService.createUser("alice", "Password1");
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toBe("User already exists.");
    }
  });

  it("validates a correct username and password", async () => {
    await userService.createUser("alice", "Password1");

    const user = await userService.validateUser("alice", "Password1");

    expect(user).not.toBeNull();
    expect(user.username).toBe("alice");
  });

  it("returns null for invalid credentials", async () => {
    await userService.createUser("alice", "Password1");

    const user = await userService.validateUser("alice", "wrong");

    expect(user).toBeNull();
  });

  it("validateUser returns null for non-existent username", async () => {
    const user = await userService.validateUser("nobody", "pass");

    expect(user).toBeNull();
  });

  it("auto-increments user IDs", async () => {
    const user1 = await userService.createUser("alice", "Password1");
    const user2 = await userService.createUser("bob", "Password2");

    expect(user2.id).toBeGreaterThan(user1.id);
  });


  it("rejects a password without a capital letter", async () => {
    try {
      await userService.createUser("testuser1", "password1");
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toContain("Password must be");
    }
  });

  it("rejects a password without a number", async () => {
    try {
      await userService.createUser("testuser2", "Password");
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toContain("Password must be");
    }
  });

  it("rejects a password that is too short", async () => {
    try {
      await userService.createUser("testuser3", "A1");
      fail("Expected error was not thrown");
    } catch (err) {
      expect(err.message).toContain("Password must be");
    }
  });

});
