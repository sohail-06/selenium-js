import { Builder, By, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { ForgotPasswordPage } from '../pages/newResetPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import 'dotenv/config';

describe('Password Reset Flow', () => {
    let driver;
    let forgotPasswordPage;
    const NEW_PASSWORD = process.env.TEST_PASSWORD || 'NewPassword@123';

    beforeAll(async () => {
        const options = new Options();
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        
        await driver.manage().window().maximize();
        forgotPasswordPage = new ForgotPasswordPage(driver);
    });

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    describe('Password Reset Process', () => {
        test('should successfully reset password through email link', async () => {
            try {
                // Step 1: Navigate to login and access forgot password
                await forgotPasswordPage.navigateToLogin();
                await forgotPasswordPage.clickForgotPassword();
                
                // Step 2: Submit email for password reset
                await forgotPasswordPage.submitEmail(process.env.TEST_USERNAME);
                await forgotPasswordPage.waitForSuccessMessage();
                
                // Step 3: Get reset token from email
                const token = await forgotPasswordPage.getResetTokenViaMailhog(process.env.TEST_USERNAME);
                expect(token).toBeTruthy();
                
                // Step 4: Navigate to reset page and change password
                await forgotPasswordPage.navigateToResetPassword(token);
                await forgotPasswordPage.resetPassword(NEW_PASSWORD);
                
                // Step 5: Verify successful login with new password
                await LoginPage.open(driver);  // Using static method
                await LoginPage.login(driver, process.env.TEST_USERNAME, NEW_PASSWORD);  // Using static method
                
                const isHeadingVisible = await LoginPage.isWelcomeHeadingDisplayed(driver);  // Using static method
                expect(isHeadingVisible).toBe(true);
                
                const headingText = await LoginPage.getWelcomeHeadingText(driver);  // Using static method
                expect(headingText).toBe('Discover Simplicity & Elegance');
                
            } catch (error) {
                // Take screenshot on failure
                const screenshot = await driver.takeScreenshot();
                const fs = await import('fs');
                fs.writeFileSync('password-reset-error.png', screenshot, 'base64');
                throw error;
            }
        }, 120000); // 2 minute timeout

        test('should show error for invalid email format', async () => {
            try {
                await forgotPasswordPage.navigateToLogin();
                await forgotPasswordPage.clickForgotPassword();
                await forgotPasswordPage.submitEmail('invalid-email');

                const errorMessage = await driver.wait(
                    until.elementLocated(By.xpath('//*[contains(text(), "Invalid email")]')),
                    10000,
                    'Invalid email error message not found'
                );
                await driver.wait(until.elementIsVisible(errorMessage), 5000);
                expect(await errorMessage.isDisplayed()).toBe(true);
            } catch (error) {
                const screenshot = await driver.takeScreenshot();
                const fs = await import('fs');
                fs.writeFileSync('email-format-error.png', screenshot, 'base64');
                throw error;
            }
        }, 30000);

        // test('should show error for empty form submission', async () => {
        //     try {
        //         await forgotPasswordPage.navigateToLogin();
        //         await forgotPasswordPage.clickForgotPassword();
                
        //         // Find and click submit button without entering email
        //         const submitButton = await driver.wait(
        //             until.elementLocated(By.xpath('//button[.//span[contains(text(), "Request password change")]]')),
        //             10000
        //         );
        //         await submitButton.click();

        //         const errorMessage = await driver.wait(
        //             until.elementLocated(By.xpath('//*[contains(text(), "Email is required")]')),
        //             10000
        //         );
        //         expect(await errorMessage.isDisplayed()).toBe(true);
        //     } catch (error) {
        //         const screenshot = await driver.takeScreenshot();
        //         const fs = await import('fs');
        //         fs.writeFileSync('empty-form-error.png', screenshot, 'base64');
        //         throw error;
        //     }
        // }, 30000);
    });
});