'use strict';

const { execSync } = require('child_process');
const core = require('@actions/core');
const { getNextLottoRound, LogLevel, LottoService } = require('@rich-automation/lotto');
const { chromium } = require('playwright');

(async () => {
  let lottoService = null;

  try {
    core.info('Installing Playwright dependencies...');
    execSync('pnpm exec playwright install chromium --with-deps');

    const count = parseInt(core.getInput('count', { required: false })) || 5;
    const id = core.getInput('id', { required: true });
    const pwd = core.getInput('pwd', { required: true });

    if (count < 1 || count > 5) {
      throw new Error("The 'count' input must be a number between 1 and 5.");
    }

    const round = getNextLottoRound();
    core.info(`Current lotto round: ${round}`);

    lottoService = new LottoService({
      headless: true,
      controller: chromium,
      logLevel: LogLevel.DEBUG,
    });
    core.info('Signing in to the lotto service...');
    await lottoService.signIn(id, pwd);

    core.info(`Purchasing ${count} lotto ticket(s) for round ${round}...`);
    const numbersArray = await lottoService.purchase(count);

    core.info('Lotto tickets purchased successfully.');
    core.setOutput('numbersArray', JSON.stringify(numbersArray));
    core.setOutput('round', round);
  } catch (error) {
    core.setFailed(`Lotto purchase failed: ${error.message}`);
  } finally {
    if (lottoService) {
      await lottoService.destroy();
    }
  }
})();
