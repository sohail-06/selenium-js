import { Builder } from 'selenium-webdriver';
import { faker } from '@faker-js/faker';
import { SignupPage } from '../pages/signupPage.js'; // Adjust the path as necessary

describe('Signup Page', () => {
    let driver;
    let page;
    const testEmail = `${faker.internet.username().toLowerCase()}@itobuz.com`;
    const testPassword = 'Password123!';

    beforeEach(async () => {
        driver = await new Builder().forBrowser('chrome').build();
        await driver.manage().window().maximize();
        page = new SignupPage(driver);
    });

    afterEach(async () => {
        if (driver) {
            try {
                await driver.quit();
            } catch (error) {
                console.warn('Failed to close browser:', error.message);
            }
        }
    });

    it('should sign up a new user, confirm via MailHog, and log in', async () => {
        await page.navigateToLogin();
        await page.clickRegisterLink();
        await page.fillRegistrationForm(testEmail, testPassword);
        await page.submitRegistration();
        const toastText = await page.getRegistrationToast();
        expect(toastText).toContain('Please check your email for verification');
        await page.openMailhogAndFindEmail();
        await page.confirmEmailAndClick();
        await page.confirmInIframe();
        await page.login(testEmail, testPassword);
    }, 90000);
});
