# Selenium Login Project

This project is a Selenium-based testing framework for automating the login functionality of a web application.

## Project Structure

- `src/tests/login.test.js`: Contains the test script for the login functionality.
- `src/pages/LoginPage.js`: Encapsulates the login page elements and actions.
- `src/utils/helpers.js`: Utility functions for common actions and waiting for elements.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd selenium-login-project
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add the necessary environment variables, such as:
   ```
   APP_URL=<your-app-url>
   USERNAME=<your-username>
   PASSWORD=<your-password>
   ```

## Running Tests

To run the tests, use the following command:
```
npm test
```

Make sure to have the necessary browser drivers installed and configured in your system PATH.