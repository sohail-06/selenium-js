import { Builder, By, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { ForgotPasswordPage } from '../pages/newResetPage.js';
import { LoginPage } from '../pages/LoginPage.js';
import 'dotenv/config';
import fs from 'fs';

describe('Password Reset Flow', () => {
    let driver;
    let forgotPasswordPage;
    const NEW_PASSWORD = process.env.TEST_PASSWORD || 'NewPassword@123';

    beforeAll(async () => {
        const options = new Options().addArguments(
            '--headless',
            '--no-sandbox',
            '--disable-dev-shm-usage'
        );

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        forgotPasswordPage = new ForgotPasswordPage(driver);
    });

    afterAll(async () => {
        await driver?.quit();
    });

    describe('Password Reset Process', () => {
        test('should reset password via email link and log in', async () => {
            try {
                await forgotPasswordPage.navigateToLogin();
                await forgotPasswordPage.clickForgotPassword();
                await forgotPasswordPage.submitEmail(process.env.TEST_USERNAME);
                await forgotPasswordPage.waitForSuccessMessage();

                const token = await forgotPasswordPage.getResetTokenViaMailhog(process.env.TEST_USERNAME);
                expect(token).toBeTruthy();

                await forgotPasswordPage.navigateToResetPassword(token);
                await forgotPasswordPage.resetPassword(NEW_PASSWORD);

                await LoginPage.open(driver);
                await LoginPage.login(driver, process.env.TEST_USERNAME, NEW_PASSWORD);

                const isHeadingVisible = await LoginPage.isWelcomeHeadingDisplayed(driver);
                expect(isHeadingVisible).toBe(true);

                const headingText = await LoginPage.getWelcomeHeadingText(driver);
                expect(headingText).toBe('Discover Simplicity & Elegance');
            } catch (error) {
                fs.writeFileSync('password-reset-error.png', await driver.takeScreenshot(), 'base64');
                throw error;
            }
        }, 120000);

        test('should show error for invalid email format', async () => {
            try {
                await forgotPasswordPage.navigateToLogin();
                await forgotPasswordPage.clickForgotPassword();
                await forgotPasswordPage.submitEmail('invalid-email');

                const errorMessage = await driver.wait(
                    until.elementLocated(By.xpath('//*[contains(text(), "Invalid email")]')),
                    10000
                );

                await driver.wait(until.elementIsVisible(errorMessage), 5000);
                expect(await errorMessage.isDisplayed()).toBe(true);
            } catch (error) {
                fs.writeFileSync('email-format-error.png', await driver.takeScreenshot(), 'base64');
                throw error;
            }
        }, 30000);

        // Uncomment to test empty form submission
        /*
        test('should show error for empty form submission', async () => {
            try {
                await forgotPasswordPage.navigateToLogin();
                await forgotPasswordPage.clickForgotPassword();

                const submitButton = await driver.wait(
                    until.elementLocated(By.xpath('//button[.//span[contains(text(), "Request password change")]]')),
                    10000
                );
                await submitButton.click();

                const errorMessage = await driver.wait(
                    until.elementLocated(By.xpath('//*[contains(text(), "Email is required")]')),
                    10000
                );
                expect(await errorMessage.isDisplayed()).toBe(true);
            } catch (error) {
                fs.writeFileSync('empty-form-error.png', await driver.takeScreenshot(), 'base64');
                throw error;
            }
        }, 30000);
        */
    });
});
