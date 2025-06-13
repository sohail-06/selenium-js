import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { LoginPage } from '../pages/LoginPage.js';
import fs from 'fs';
import 'dotenv/config';
import { describe, beforeAll, afterAll, beforeEach, test, expect } from '@jest/globals';

describe('Login Page Test Suite', () => {
    let driver;

    beforeAll(async () => {
        const options = new chrome.Options().addArguments(
            '--headless',
            '--no-sandbox',
            '--disable-dev-shm-usage'
        );

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    });

    afterAll(async () => {
        await driver?.quit();
    });

    beforeEach(async () => {
        await LoginPage.open(driver);
    });

    test('should login successfully and show welcome heading', async () => {
        try {
            const isBeforeLogin = await LoginPage.isWelcomeHeadingDisplayed(driver);
            expect(isBeforeLogin).toBe(false);

            await LoginPage.login(driver, process.env.TEST_USERNAME, process.env.TEST_PASSWORD);

            const isAfterLogin = await LoginPage.isWelcomeHeadingDisplayed(driver);
            expect(isAfterLogin).toBe(true);

            const headingText = await LoginPage.getWelcomeHeadingText(driver);
            expect(headingText.trim()).toBe('Discover Simplicity & Elegance');

            await LoginPage.logout(driver);

            const isLoginInputVisible = await LoginPage.isLoginInputDisplayed(driver);
            expect(isLoginInputVisible).toBe(true);

        } catch (error) {
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync('login-test-failure.png', screenshot, 'base64');
            console.error('Login test failed:', error);
            throw error;
        }
    }, 30000);
});
