#!/usr/bin/env bash

# test-local.sh
# Automates the installation of dependencies and executes the E2E test suite locally on your computer.
#
# Usage:
#   chmod +x test-local.sh
#   ./test-local.sh

set -e

# Define console color helpers
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}       AeroBooth Local Setup & Testing Script       ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Check Node.js installation
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed. Please install Node.js (v18+) to proceed.${NC}"
    exit 1
fi
echo -e "${GREEN}[✔] Node.js is installed (${NC}$(node -v)${GREEN})${NC}"

# 2. Check npm installation
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed. Please install npm to proceed.${NC}"
    exit 1
fi
echo -e "${GREEN}[✔] npm is installed (${NC}v$(npm -v)${GREEN})${NC}"

# 3. Install NPM dependencies
echo -e "\n${YELLOW}[Step 1/4] Installing project dependencies...${NC}"
npm install

# 4. Install Playwright browser binaries
echo -e "\n${YELLOW}[Step 2/4] Downloading Playwright browser binaries...${NC}"
npx playwright install chromium

# 5. Run Type-Check & Linter
echo -e "\n${YELLOW}[Step 3/4] Running TypeScript type check & lint verification...${NC}"
npm run lint

# 6. Execute Playwright E2E tests
echo -e "\n${YELLOW}[Step 4/4] Launching Playwright End-to-End E2E test suite...${NC}"
if npm run test; then
    echo -e "\n${GREEN}====================================================${NC}"
    echo -e "${GREEN}      ALL TESTS PASSED SUCCESSFULLY! (100% Green)  ${NC}"
    echo -e "${GREEN}====================================================${NC}"
    echo -e "You are ready to run the app! Start the development server using:"
    echo -e "  ${BLUE}npm run dev${NC}"
else
    echo -e "\n${RED}====================================================${NC}"
    echo -e "${RED}      SOME TESTS OR VERIFICATIONS FAILED           ${NC}"
    echo -e "${RED}====================================================${NC}"
    exit 1
fi
