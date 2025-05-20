const { By, until } = require('selenium-webdriver');
require('dotenv').config();

const ForgotPasswordPage = {
    url: `${process.env.LOGIN_URL}/forget-password`,

    selectors: {
        emailInput: By.xpath('//input[@name="email"]'),
        resetButton: By.xpath('//button[@data-test-id="password-change-btn"]'),
        //successMessage: By.css('.toast--success'),
        successMessage: By.xpath("//div[contains(text(), 'Password reset link sent to your email')]"),
        errorMessage: By.css('.error-message'),
        backToLoginLink: By.xpath("//a[contains(@href,'/login')]")
    },

    async navigate(driver) {
        await driver.get(this.url);
    },

    async enterEmail(driver, email) {
        await driver.wait(until.elementLocated(this.selectors.emailInput), 5000);
        const emailInput = await driver.findElement(this.selectors.emailInput);
        await emailInput.clear();
        await emailInput.sendKeys(email);
    },

    async clickResetPassword(driver) {
        const resetButton = await driver.findElement(this.selectors.resetButton);
        await resetButton.click();
    },

    async getSuccessMessage(driver) {
        try {
            await driver.wait(until.elementLocated(this.selectors.successMessage), 5000);
            const message = await driver.findElement(this.selectors.successMessage);
            return await message.getText();
        } catch {
            return null;
        }
    },

    async getErrorMessage(driver) {
        try {
            await driver.wait(until.elementLocated(this.selectors.errorMessage), 5000);
            const message = await driver.findElement(this.selectors.errorMessage);
            return await message.getText();
        } catch {
            return null;
        }
    },

    async clickBackToLogin(driver) {
        const link = await driver.findElement(this.selectors.backToLoginLink);
        await link.click();
    },

    async requestPasswordReset(driver, email) {
        await this.enterEmail(driver, email);
        await this.clickResetPassword(driver);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
};

module.exports = ForgotPasswordPage;
