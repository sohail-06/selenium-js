import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { WorkspacePage } from '../pages/workspacePage.js';
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

            // Verify workspace appears in grid
            const workspace = await WorkspacePage.findWorkspaceRow(driver, TEST_WORKSPACE_NAME);
            const displayedName = await workspace.getText();
            expect(displayedName.trim()).toBe(TEST_WORKSPACE_NAME);

        } catch (error) {
            console.error('Error in create workspace test:', error);
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync('workspace-creation-error.png', screenshot, 'base64');
            throw error;
        }
    }, 30000);

    test('should edit workspace name', async () => {
        try {
            console.log('TEST_WORKSPACE_NAME:', TEST_WORKSPACE_NAME);
            console.log('UPDATED_WORKSPACE_NAME:', UPDATED_WORKSPACE_NAME);

            const successMessage = await WorkspacePage.editWorkspace(driver, TEST_WORKSPACE_NAME, UPDATED_WORKSPACE_NAME);

            await driver.wait(until.elementIsVisible(successMessage), 10000);
            expect(await successMessage.isDisplayed()).toBe(true);

            // Verify the updated name appears in grid
            const workspace = await WorkspacePage.findWorkspaceRow(driver, UPDATED_WORKSPACE_NAME);
            const displayedName = await workspace.getText();
            expect(displayedName.trim()).toBe(UPDATED_WORKSPACE_NAME);

            console.log('Expected:', UPDATED_WORKSPACE_NAME);
            console.log('Found:', displayedName);

        } catch (error) {
            console.error('Error in edit workspace test:', error);
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync('workspace-edit-error.png', screenshot, 'base64');
            throw error;
        }
    }, 30000);

    test('should delete workspace', async () => {
        try {
            // Verify workspace present before deletion
            const workspace = await WorkspacePage.findWorkspaceRow(driver, UPDATED_WORKSPACE_NAME);
            const displayedName = await workspace.getText();
            expect(displayedName.trim()).toBe(UPDATED_WORKSPACE_NAME);
            console.log('Verified workspace exists before deletion:', displayedName);

            // Delete workspace and verify success
            const successMessage = await WorkspacePage.deleteWorkspace(driver, UPDATED_WORKSPACE_NAME);
            await driver.wait(until.elementIsVisible(successMessage), 10000);
            expect(await successMessage.isDisplayed()).toBe(true);

            // Verify workspace no longer exists
            await driver.sleep(2000); // Give grid time to update
            try {
                await WorkspacePage.findWorkspaceRow(driver, UPDATED_WORKSPACE_NAME, 5000);
                throw new Error('Workspace still exists after deletion');
            } catch (error) {
                // Expected error, workspace should not be found
                expect(error.message).toContain('Could not find workspace row');
            }

        } catch (error) {
            console.error('Error in delete workspace test:', error);
            const screenshot = await driver.takeScreenshot();
            fs.writeFileSync('workspace-delete-error.png', screenshot, 'base64');
            throw error;
        }
    }, 30000);
});
