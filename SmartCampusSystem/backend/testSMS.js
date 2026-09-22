/**
 * Standalone SMS test script.
 * Usage: node testSMS.js <phone_number>
 * Example: node testSMS.js +94761234567
 *
 * Make sure SMSLENZ_USER_ID and SMSLENZ_API_KEY are set in backend/.env
 * Get both values from: https://smslenz.lk/account/api-key
 */
require("dotenv").config();
const { sendSMS } = require("./services/smsService");

const phone = process.argv[2];

if (!phone) {
  console.error("Usage: node testSMS.js <phone_number>");
  console.error("Example: node testSMS.js +94761234567");
  process.exit(1);
}

console.log("Environment check:");
console.log("  SMSLENZ_USER_ID:", process.env.SMSLENZ_USER_ID ? `set (${process.env.SMSLENZ_USER_ID.slice(0, 8)}...)` : "NOT SET");
console.log("  SMSLENZ_API_KEY:", process.env.SMSLENZ_API_KEY ? `set (${process.env.SMSLENZ_API_KEY.slice(0, 8)}...)` : "NOT SET");
console.log("  SMSLENZ_SENDER_ID:", process.env.SMSLENZ_SENDER_ID || "SMSlenzDEMO (default)");
console.log();

(async () => {
  console.log(`=== SMS Test to ${phone} ===\n`);

  const result = await sendSMS(
    phone,
    "Test SMS from Canteen Management System. If you received this, SMS integration is working!"
  );

  console.log("\n=== Result ===");
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("\nSMS sent successfully! Check the phone for the message.");
  } else {
    console.log("\nSMS FAILED. See error above.");
    console.log("Make sure you have set the correct SMSLENZ_USER_ID in backend/.env");
    console.log("Get it from: https://smslenz.lk/account/api-key");
  }
})();
