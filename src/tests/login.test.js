const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const LoginPage = require ('../pages/LoginPage.js'); 
const fs = require('fs');

describe('Login Page Test Suite', () => {
    let driver;

    beforeAll(async () => {
        const options = new chrome.Options();
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
    await driver.manage().window().maximize();
    });
    });

    afterAll(async () => {
        await driver.quit();
    });

    beforeEach(async () => {
        await LoginPage.open(driver);
    });

    test('should login successfully and show welcome heading', async () => {
        try {
            const isHeadingVisibleBeforeLogin = await LoginPage.isWelcomeHeadingDisplayed(driver);
            expect(isHeadingVisibleBeforeLogin).toBe(false);

            await LoginPage.login(
                driver,
                process.env.TEST_USERNAME,
                process.env.TEST_PASSWORD
            );

            // Wait and check if welcome heading appears
            const isHeadingVisibleAfterLogin = await LoginPage.isWelcomeHeadingDisplayed(driver);
            expect(isHeadingVisibleAfterLogin).toBe(true);

            // Validate the welcome heading text
            const headingText = await LoginPage.getWelcomeHeadingText(driver);
            expect(headingText.trim()).toBe('Discover Simplicity & Elegance');

        } catch (error) {
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync('login-test-failure.png', screenshot, 'base64');
            console.error('Login test failed:', error);
            throw error;
        }
    }, 30000);

