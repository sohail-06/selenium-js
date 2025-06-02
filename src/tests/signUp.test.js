import { Builder } from 'selenium-webdriver';
import { expect } from 'chai';
import { SignUpPage } from '../pages/signup.page.js';
import { faker } from '@faker-js/faker';

describe('Sign Up Page Tests', () => {
    let driver;
    const validPassword = 'Test@12345';

    beforeEach(async () => {
        driver = await new Builder().forBrowser('chrome').build();
        await driver.manage().window().maximize();
    });

    afterEach(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    it('should successfully sign up with valid data', async () => {
        const randomNumber = faker.number.int({ min: 1, max: 1000 });
        const testEmail = `super-admin${randomNumber}@example.com`;

        // Navigate to sign up page
        await SignUpPage.open(driver);

        // Fill in the sign up form and submit
        await SignUpPage.signUp(driver, testEmail, validPassword);

        // Wait for success message
        await driver.sleep(2000);
        const successMessage = await SignUpPage.getSuccessMessage(driver);
        expect(successMessage).to.not.be.null;
        expect(successMessage.toLowerCase()).to.satisfy(
            msg => msg.includes('success') || msg.includes('registered') || msg.includes('verify')
        );
    });

    it('should show error for invalid email format', async () => {
        const invalidEmail = 'invalid-email';

        // Navigate to sign up page
        await SignUpPage.open(driver);

        // Try to sign up with invalid email
        await SignUpPage.signUp(driver, invalidEmail, validPassword);

        // Should still be on registration page
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.include('/register');

        // Check for any validation feedback
        await driver.sleep(1000); // Wait for error to appear
        const errorMessage = await SignUpPage.getErrorMessage(driver);
        if (errorMessage !== null) {
            expect(errorMessage.toLowerCase()).to.satisfy(
                msg => msg.includes('email') || msg.includes('invalid')
            );
        }
    });

    it('should show error for weak password', async () => {
        const weakPassword = '123';
        const randomNumber = faker.number.int({ min: 1, max: 1000 });
        const testEmail = `super-admin${randomNumber}@example.com`;

        // Navigate to sign up page
        await SignUpPage.open(driver);

        // Try to sign up with weak password
        await SignUpPage.signUp(driver, testEmail, weakPassword);

        // Should still be on registration page
        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).to.include('/register');

        // Check for any validation feedback
        await driver.sleep(1000); // Wait for error to appear
        const errorMessage = await SignUpPage.getErrorMessage(driver);
        if (errorMessage !== null) {
            expect(errorMessage.toLowerCase()).to.satisfy(
                msg => msg.includes('password') || msg.includes('weak')
            );
        }
    });
});