import 'dotenv/config';
import { By, until } from 'selenium-webdriver';

export class LoginPage {
    static url = process.env.LOGIN_URL || 'https://sass-starter-kit.wordpress-studio.io/login';

    static usernameInput = By.css('input[name="email"]');
    static passwordInput = By.css('input[name="password"]');
    static loginButton = By.css('button[type="submit"]');
    static welcomeHeading = By.css('#home h2');

    static async open(driver) {
        await driver.get(this.url);
    }

    static async login(driver, username, password) {
        // Wait for and fill email input
        const emailInput = await driver.wait(
            until.elementLocated(By.css('input[name="email"]')),
            10000,
            'Email input not found'
        );
        await emailInput.clear();
        await emailInput.sendKeys(username);

        // Wait for and fill password input
        const passwordInput = await driver.wait(
            until.elementLocated(By.css('input[name="password"]')),
            10000,
            'Password input not found'
        );
        await passwordInput.clear();
        await passwordInput.sendKeys(password);

        // Find and click login button
        const loginButton = await driver.wait(
            until.elementLocated(By.css('button[type="submit"]')),
            10000,
            'Login button not found'
        );
        
        await driver.wait(
            until.elementIsVisible(loginButton),
            5000,
            'Login button not visible'
        );

        await driver.executeScript("arguments[0].scrollIntoView(true);", loginButton);
        await driver.sleep(500);
        await driver.executeScript("arguments[0].click();", loginButton);
    }

    static async isWelcomeHeadingDisplayed(driver) {
        try {
            await driver.wait(until.elementLocated(this.welcomeHeading), 10000);
            const heading = await driver.findElement(this.welcomeHeading);
            return await heading.isDisplayed();
        } catch {
            return false;
        }
    }

    static async getWelcomeHeadingText(driver) {
        const heading = await driver.findElement(this.welcomeHeading);
        return await heading.getText();
    }
}
