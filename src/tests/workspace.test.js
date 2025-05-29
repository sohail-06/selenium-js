import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import WorkspacePage from '../pages/workspacePage.js';
import { config } from 'dotenv';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

config();

describe('Workspace Management Tests', () => {
    let driver;
    const TEST_WORKSPACE_NAME = 'Test ' + faker.string.alphanumeric(4);
    const randomSuffix = faker.string.alphanumeric(4);
    const UPDATED_WORKSPACE_NAME = 'Test ' + randomSuffix;

    // Centralized selectors for elements used in tests
    const selectors = {
        searchRoleInput: By.css('[data-testid="search-role"]'),
        workspaceNameCell: (name) => By.css(`div.MuiDataGrid-cell[data-colindex="0"][title="${name}"]`),
    };

    beforeAll(async () => {
        const options = new chrome.Options();
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();
        await driver.manage().window().maximize();
    });

    afterAll(async () => {
        if (driver) {
            try {
                await driver.quit();
            } catch (error) {
                console.error('Error closing browser:', error);
            }
        }
    });

    test('should create a new workspace', async () => {
        try {
            await WorkspacePage.navigate(driver);
            const successMessage = await WorkspacePage.createWorkspace(driver, TEST_WORKSPACE_NAME);

            await driver.wait(until.elementIsVisible(successMessage), 10000);
            expect(await successMessage.isDisplayed()).toBe(true);
        } catch (error) {
            console.error('Error in create workspace test:', error);
            try {
                const screenshot = await driver.takeScreenshot();
                fs.writeFileSync('workspace-creation-error.png', screenshot, 'base64');
            } catch (screenshotError) {
                console.error('Failed to take screenshot:', screenshotError);
            }
            throw error;
        }
    }, 30000);

    test('should edit workspace name', async () => {
        try {
            console.log('TEST_WORKSPACE_NAME:', TEST_WORKSPACE_NAME);
            console.log('UPDATED_WORKSPACE_NAME:', UPDATED_WORKSPACE_NAME);

            const search = await driver.wait(until.elementLocated(selectors.searchRoleInput), 10000);
            await search.sendKeys(TEST_WORKSPACE_NAME);

            const successMessage = await WorkspacePage.editWorkspace(driver, TEST_WORKSPACE_NAME, UPDATED_WORKSPACE_NAME);

            await driver.wait(until.elementIsVisible(successMessage), 10000);
            expect(await successMessage.isDisplayed()).toBe(true);

            // Clear and search for updated name
            const searchAgain = await driver.wait(until.elementLocated(selectors.searchRoleInput), 10000);
            await searchAgain.clear();
            await searchAgain.sendKeys(UPDATED_WORKSPACE_NAME);
            await driver.sleep(3000);

            const workspaceNameElement = await driver.wait(until.elementLocated(selectors.workspaceNameCell(UPDATED_WORKSPACE_NAME)), 10000);
            const displayedName = await workspaceNameElement.getText();
            console.log('Expected:', UPDATED_WORKSPACE_NAME);
            console.log('Found:', displayedName);
            expect(displayedName.trim().toLowerCase()).toContain(UPDATED_WORKSPACE_NAME.toLowerCase());

        } catch (error) {
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync('workspace-edit-error.png', screenshot, 'base64');
            throw error;
        }
    }, 30000);

    test('should delete workspace', async () => {
        try {
            const search = await driver.wait(until.elementLocated(selectors.searchRoleInput), 10000);
            await search.clear();
            await search.sendKeys(UPDATED_WORKSPACE_NAME);
            await driver.sleep(2000);

            // Verify workspace present
            const workspaceNameElement = await driver.wait(until.elementLocated(selectors.workspaceNameCell(UPDATED_WORKSPACE_NAME)), 10000);
            const displayedName = await workspaceNameElement.getText();
            expect(displayedName.trim()).toBe(UPDATED_WORKSPACE_NAME);
            console.log('Verified workspace exists before deletion:', displayedName);

            // Delete workspace
            const successMessage = await WorkspacePage.deleteWorkspace(driver, UPDATED_WORKSPACE_NAME);
            await driver.wait(until.elementIsVisible(successMessage), 10000);
            expect(await successMessage.isDisplayed()).toBe(true);
            console.log('Workspace deleted successfully');

            // Confirm workspace is deleted
            await search.clear();
            await search.sendKeys(UPDATED_WORKSPACE_NAME);
            await driver.sleep(3000);

            const remaining = await driver.findElements(selectors.workspaceNameCell(UPDATED_WORKSPACE_NAME));
            expect(remaining.length).toBe(0);
            console.log('Confirmed workspace is no longer present');

        } catch (error) {
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync('workspace-delete-error.png', screenshot, 'base64');
            throw error;
        }
    }, 30000);

    // Additional tests can also use this selectors object similarly
});
