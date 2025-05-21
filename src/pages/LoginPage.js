require('dotenv').config();
const { By, until } = require('selenium-webdriver');

const LoginPage = {
    url: process.env.LOGIN_URL || 'https://sass-starter-kit.wordpress-studio.io/login',

    usernameInput: By.css('[data-testid="email-input"]'),
    passwordInput: By.css('[data-testid="password-input"]'),
    loginButton: By.css('[data-testid="login-button"]'),
    welcomeHeading: By.css('#home h2'),

    async open(driver) {
        await driver.get(this.url);
    },

    async login(driver, username, password) {
        await driver.findElement(this.usernameInput).sendKeys(username);
        await driver.findElement(this.passwordInput).sendKeys(password);
        await driver.findElement(this.loginButton).click();
    },

    async isWelcomeHeadingDisplayed(driver) {
        try {
            await driver.wait(until.elementLocated(this.welcomeHeading), 10000);
            const heading = await driver.findElement(this.welcomeHeading);
            return await heading.isDisplayed();
        } catch {
            return false;
        }
    },

    async getWelcomeHeadingText(driver) {
        const heading = await driver.findElement(this.welcomeHeading);
        return await heading.getText();
    }
};

module.exports = LoginPage;
