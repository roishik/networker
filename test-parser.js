// Test the parser with the user's example
const text = `Roi Shikler רועי שיקלר is working at Mobileye as a product manager of parking products.
I met him in XMafat conference and we scheduled a followup meeting for next Tuesday at 17:00`;

console.log("Testing parser with user's example text...");
console.log("Input:", text);
console.log("\nExpected results:");
console.log("- English name: Roi Shikler");
console.log("- Hebrew name: רועי שיקלר");
console.log("- Company: Mobileye");
console.log("- Job title: Product Manager – Parking Products");
console.log("- How met: XMafat Conference");
console.log("- Follow-up: next Tuesday at 17:00");
console.log("- Tags: conference, parking, mobileye");
