import { Builder, By, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { navigate, requestPasswordReset, getSuccessMessage } from '../pages/forgotPasswordPage';
import { open, login } from '../pages/LoginPage';
require('dotenv').config();

describe('Complete Password Reset Flow Tests', () => {
    let driver;
    const MAILHOG_URL = 'https://mailhog.x-studio.io/';
    const NEW_PASSWORD = process.env.TEST_PASSWORD || 'NewPassword@123';

    beforeAll(async () => {
        const options = new Options();
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        await driver.manage().window().maximize();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test('complete password reset flow through Mailhog', async () => {
        try {
            await navigate(driver);
            await requestPasswordReset(driver, process.env.TEST_USERNAME);

            const successMessage = await getSuccessMessage(driver);
            expect(successMessage).toBeTruthy();

            // Step 2: Get reset link from Mailhog and complete password reset
            await getResetPasswordLink(driver);

        } catch (error) {
            const screenshot = await driver.takeScreenshot();
            require('fs').writeFileSync('password-reset-flow-error.png', screenshot, 'base64');
            throw error;
        }
    }, 60000);

    async function getResetPasswordLink(driver) {
        try {
            await driver.get(MAILHOG_URL);
            await driver.sleep(3000);

            const resetEmail = await driver.findElement(By.xpath(
                "(//div[contains(@class, 'msglist-message')]//span[contains(text(), 'Password Reset Request')])[1]"
            ));
            await resetEmail.click();
            await driver.sleep(3000);

            const resetLink = await driver.wait(
                until.elementLocated(By.css('a[href*="/password-reset"]')),
                25000
            );
            await driver.executeScript("arguments[0].click();", resetLink);
            await driver.sleep(3000);

            const windows = await driver.getAllWindowHandles();
            if (windows.length < 2) {
                throw new Error("Reset link did not open a new tab.");
            }
            await driver.switchTo().window(windows[1]);
            await driver.sleep(3000);

            const password = await driver.wait(
                until.elementLocated(By.css('[name="password"]')),
                10000
            );
            await password.sendKeys(NEW_PASSWORD);

            const confirmPassword = await driver.wait(
                until.elementLocated(By.css('[name="confirmPassword"]')),
                10000
            );
            await confirmPassword.sendKeys(NEW_PASSWORD);

            const changePassword = await driver.wait(
                until.elementLocated(By.css('[data-test-id="change-password-btn"]')),
                10000
            );
            await changePassword.click();
            await driver.sleep(15000);

            const toast = await driver.wait(
                until.elementLocated(By.xpath("//div[contains(text(), 'Password Changed Successfully. Please login')]")),
                10000
            );
            await driver.wait(until.elementIsVisible(toast), 15000);
            await driver.sleep(3000); 
            await open(driver);
            await driver.wait(until.elementLocated(By.css('input')), 10000);
            await login(driver, username, password);// Optional pause after toast is visible

        } catch (error) {
            console.error('Error fetching from Mailhog:', error);
            throw error;
        }
    }
});
