import { Builder } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { faker } from '@faker-js/faker';
import { SignupPage } from '../pages/signupPage.js';

describe('Signup Flow', () => {
    let driver;
    let page;
    const testEmail = `${faker.internet.username().toLowerCase()}@itobuz.com`;
    const testPassword = 'Password123!';

    beforeAll(async () => {
        const options = new Options()
            .addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');
        
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        page = new SignupPage(driver);
    });

    afterAll(async () => {
        await driver?.quit();
    });

    it('should register, verify via MailHog, and log in successfully', async () => {
        await page.navigateToLogin();
        await page.clickRegisterLink();
        await page.fillRegistrationForm(testEmail, testPassword);
        await page.submitRegistration();

        const toast = await page.getRegistrationToast();
        expect(toast).toContain('Please check your email for verification');

        await page.openMailhogAndFindEmail();
        await page.confirmEmailAndClick();
        await page.confirmInIframe();
        await page.login(testEmail, testPassword);
    }, 90000);
});
