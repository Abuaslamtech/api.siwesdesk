const bcrypt = require('bcryptjs');
const hash1 = "$2b$12$wIFTFpALoMrlqPKXBBifLOHj7kCKv/hFMCPdIr/2mOpKU0AKFMb5W";
const hash2 = "$2b$12$j90FGSrGe0gs8j432wI1B.9d1qrsbvMwGck6Tu0OuLKywGVeIxWy.";
const passwords = ["ChangeMe@123", "password", "123456", "password123", "12345678", "admin", "admin123", "secret"];

for (const pwd of passwords) {
  if (bcrypt.compareSync(pwd, hash1)) {
    console.log(`hash1 matches ${pwd}`);
  }
  if (bcrypt.compareSync(pwd, hash2)) {
    console.log(`hash2 matches ${pwd}`);
  }
}
console.log("Done checking common passwords.");
