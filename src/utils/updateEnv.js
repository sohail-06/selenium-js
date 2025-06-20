const fs = require('fs');
const path = require('path');

/**
 * Updates the password in the .env file
 * @param {string} newPassword - The new password to set
 */
async function updatePassword(newPassword) {
    try {
        // Path to .env file (two levels up from utils directory)
        const envPath = path.resolve(__dirname, '../../.env');
        // Read current .env content
        let envContent = fs.readFileSync(envPath, 'utf8');
        // Replace old password with new one, or add if doesn't exist
        if (envContent.includes('TEST_PASSWORD=')) {
            envContent = envContent.replace(
                /TEST_PASSWORD=.*/,
                `TEST_PASSWORD=${newPassword}`
            );
        } else {
            envContent += `\nTEST_PASSWORD=${newPassword}`;
        }
        // Write back to .env file
        fs.writeFileSync(envPath, envContent);
    } catch (error) {
        console.error('Error updating .env file:', error);
        throw error;
    }
}

module.exports = { updatePassword };
