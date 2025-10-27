import { hashPassword } from "./auth";
import { storage } from "./storage";

async function seedAdmin() {
  try {
    // Check if admin user already exists
    const existing = await storage.getUserByUsername("admin");
    if (existing) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword("admin123");
    const admin = await storage.createUser({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      fullName: "مدير النظام",
      email: "admin@school.com",
    });

    console.log("✅ Admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Role: admin");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
  
  process.exit(0);
}

seedAdmin();
