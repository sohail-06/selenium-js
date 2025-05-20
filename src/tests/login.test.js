const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const LoginPage = require('../pages/LoginPage');
require('dotenv').config();

describe('Login Page Tests', () => {
    let driver;
    let loginPage;

    beforeAll(async () => {
        const options = new chrome.Options();
        // Uncomment below line to run in headless mode
        // options.addArguments('--headless');
        
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
            
        loginPage = new LoginPage(driver);
    });

    afterAll(async () => {
        await driver.quit();
    });

    beforeEach(async () => {
        await loginPage.navigate();
    });

    test('should login successfully and show welcome heading', async () => {
        try {
            // Verify heading is not present before login
            const headingBeforeLogin = await loginPage.isWelcomeHeadingPresent();
            expect(headingBeforeLogin).toBe(false);

            // Perform login
            await loginPage.login(
                process.env.TEST_USERNAME,
                process.env.TEST_PASSWORD
            );

            // Wait for page load
            await driver.wait(async () => {
                const readyState = await driver.executeScript('return document.readyState');
                return readyState === 'complete';
            }, 10000);

            // Wait for and verify heading after login
            await driver.wait(async () => {
                return await loginPage.isWelcomeHeadingPresent();
            }, 10000, 'Welcome heading did not appear after login');

            // Get heading text for assertion
            const heading = await driver.findElement(By.xpath(loginPage.selectors.welcomeHeading));
            const headingText = await heading.getText();
            expect(headingText).toBe('Discover Simplicity & Elegance');

        } catch (error) {
            const screenshot = await driver.takeScreenshot();
            require('fs').writeFileSync('error-screenshot.png', screenshot, 'base64');
            console.error('Test failed:', error);
            throw error;
        }
    }, 30000); // Increased timeout to 30 seconds
});